#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createProtocol } = require("./protocol");
const { RoonBridge } = require("./roon");
const { BrowseSessions } = require("./browse");
const { MprisBridge } = require("./mpris");
const { RoonDisplay, LyricsStore } = require("./lyrics");

const VERSION = "0.2.0";

function usage() {
  return [
    "roon-bridge: Roon sidecar for the DankMaterialShell Roon plugin",
    "",
    "  --state-dir <dir>      where roon-state.json (pairing token) and bridge.pid live",
    "  --cache-dir <dir>      where lyric sidecars go (default $XDG_CACHE_HOME/DankMaterialShell/plugins/roon)",
    "  --display-zone         host a Roon display so the core sends lyrics",
    "  --extension-id <id>    Roon extension id (default codes.noa.dms-roon)",
    "  --host <host>          connect directly instead of SOOD discovery",
    "  --port <port>          websocket port for --host (default 9330)",
    "  --linger <seconds>     keep running this long after stdin closes (dev)",
    "  --version | --help",
    "",
    "Speaks newline-delimited JSON on stdin/stdout.",
  ].join("\n");
}

function parseArgs(argv) {
  const out = {
    stateDir: "",
    cacheDir: "",
    displayZone: false,
    extensionId: "codes.noa.dms-roon",
    displayName: "DMS Roon",
    displayVersion: VERSION,
    publisher: "Noa Himesaka",
    email: "himesaka@noa.codes",
    website: "https://github.com/NoaHimesaka1873/dms-plugin-roon",
    mode: "discovery",
    host: "",
    port: 9330,
    linger: 0,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--state-dir":
        out.stateDir = next();
        break;
      case "--cache-dir":
        out.cacheDir = next();
        break;
      case "--display-zone":
        out.displayZone = true;
        break;
      case "--extension-id":
        out.extensionId = next();
        break;
      case "--host":
        out.host = next();
        out.mode = "manual";
        break;
      case "--port":
        out.port = Number(next()) || 9330;
        break;
      case "--mode":
        out.mode = next();
        break;
      case "--linger":
        out.linger = Number(next()) || 0;
        break;
      case "--version":
        console.log(VERSION);
        process.exit(0);
        break;
      case "--help":
      case "-h":
        console.log(usage());
        process.exit(0);
        break;
      default:
        console.error("unknown argument: " + a);
        console.error(usage());
        process.exit(2);
    }
  }
  if (!out.stateDir) {
    const base = process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state");
    out.stateDir = path.join(base, "DankMaterialShell", "plugins", "roon");
  }
  if (!out.cacheDir) {
    const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
    out.cacheDir = path.join(base, "DankMaterialShell", "plugins", "roon");
  }
  return out;
}

function otherBridgeRunning(pidFile) {
  let pid;
  try {
    pid = Number(fs.readFileSync(pidFile, "utf8").trim());
  } catch {
    return 0;
  }
  if (!pid || pid === process.pid) return 0;
  try {
    process.kill(pid, 0);
  } catch {
    return 0;
  }
  try {
    const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    if (!cmd.includes("roon-bridge") && !cmd.includes("bridge/src/index.js")) return 0;
  } catch {
    /* not linux, trust the pid */
  }
  return pid;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.stateDir, { recursive: true });
  const pidFile = path.join(opts.stateDir, "bridge.pid");

  let shuttingDown = false;
  const proto = createProtocol({ onMessage: handle, onEnd: onStdinEnd });
  const log = (level, message) => proto.log(level, message);

  const other = otherBridgeRunning(pidFile);
  if (other) {
    proto.send({ type: "hello", version: VERSION, pid: process.pid, mprisAvailable: false });
    proto.send({ type: "status", state: "disconnected", coreName: "", coreId: "", host: "", httpPort: 0, message: `another bridge is running (pid ${other})` });
    process.exit(3);
  }
  fs.writeFileSync(pidFile, String(process.pid));

  const bridge = new RoonBridge({ ...opts, log });
  const browse = new BrowseSessions(bridge);
  const lyrics = new LyricsStore(opts.cacheDir, log);
  const mpris = new MprisBridge(bridge, log, lyrics);
  const display = opts.displayZone ? new RoonDisplay({ stateDir: opts.stateDir, log }) : null;
  let mprisWanted = false;
  let queueWanted = false;
  let queueMax = 50;

  proto.send({ type: "hello", version: VERSION, pid: process.pid, mprisAvailable: mpris.available });

  bridge.on("status", (s) => proto.send({ type: "status", ...s }));
  bridge.on("zones", (zones) => {
    proto.send({ type: "zones", zones });
    mpris.update();
  });
  bridge.on("zone_changed", (zone) => {
    proto.send({ type: "zone_changed", zone });
    if (zone.zoneId === bridge.selectedZoneId) mpris.update();
  });
  bridge.on("seek", (s) => {
    proto.send({ type: "seek", ...s });
    mpris.onSeek(s.zoneId, s.position);
  });
  bridge.on("queue", (q) => proto.send({ type: "queue", ...q }));
  // Every zone's now playing carries the .lrc sidecar url while Roon's lyrics
  // match its track; DMS's lyrics engine reads the sidecar before any provider.
  bridge.decorateNowPlaying = (raw, np) => {
    const entry = lyrics.current(raw.zone_id, raw);
    np.lyricsUrl = entry ? lyrics.trackUrl(entry, np) : "";
  };
  const onLyrics = (l) => {
    if (!lyrics.set(l.zoneId, l.key, l.lrc, l.track)) return;
    const entry = lyrics.get(l.zoneId);
    proto.send({ type: "lyrics", zoneId: l.zoneId, lrc: entry ? entry.lrc : "" });
    const raw = bridge.zones.get(l.zoneId);
    if (raw) proto.send({ type: "zone_changed", zone: bridge.normalizeZone(raw) });
    if (l.zoneId === bridge.selectedZoneId) mpris.update();
  };
  const waveforms = new Map();
  // Zones where Roon has lyrics (a key) but no LRC: unsynced text Roon keeps to its own app.
  const unsynced = new Set();
  const onUnsynced = (l) => {
    const has = !!l.key && !(l.lrc && l.lrc.trim());
    if (has === unsynced.has(l.zoneId)) return;
    if (has) unsynced.add(l.zoneId);
    else unsynced.delete(l.zoneId);
    proto.send({ type: "lyrics_unsynced", zoneId: l.zoneId, value: has });
  };
  const clearLyrics = () => {
    for (const zoneId of lyrics.zones()) onLyrics({ zoneId, key: null, lrc: "", track: "" });
    for (const zoneId of waveforms.keys()) proto.send({ type: "waveform", zoneId, waveform: [] });
    waveforms.clear();
    for (const zoneId of unsynced) proto.send({ type: "lyrics_unsynced", zoneId, value: false });
    unsynced.clear();
  };
  if (display) {
    display.on("waveform", (w) => {
      const key = w.waveform ? w.waveform.join(",") : "";
      if ((waveforms.get(w.zoneId) || "") === key) return;
      if (key) waveforms.set(w.zoneId, key);
      else waveforms.delete(w.zoneId);
      proto.send({ type: "waveform", zoneId: w.zoneId, waveform: w.waveform || [] });
    });
    display.on("lyrics", (l) => {
      onLyrics(l);
      onUnsynced(l);
    });
    display.on("cleared", clearLyrics);
    bridge.on("selected", (zoneId) => display.follow(zoneId));
  }
  bridge.on("paired", () => {
    if (display) {
      display.follow(bridge.selectedZoneId);
      display.start(bridge.status.host, bridge.status.httpPort);
    }
    if (mprisWanted && bridge.selectedZoneId) {
      mpris.enable();
      proto.send({ type: "mpris", active: mpris.active, busName: "org.mpris.MediaPlayer2.roon" });
    }
    if (queueWanted && bridge.selectedZoneId) bridge.subscribeQueue(bridge.selectedZoneId, queueMax);
  });
  bridge.on("unpaired", () => {
    browse.sessions.clear();
    if (display) display.stop();
    clearLyrics();
    if (mpris.active) {
      mpris.disable();
      proto.send({ type: "mpris", active: false, busName: "org.mpris.MediaPlayer2.roon" });
    }
  });

  const handlers = {
    ping: () => ({ pong: Date.now() }),
    select_zone: (m) => {
      bridge.selectZone(m.zoneId || null);
      mpris.setZone(bridge.selectedZoneId);
      if (mprisWanted && bridge.selectedZoneId && bridge.transport && !mpris.active) {
        mpris.enable();
        proto.send({ type: "mpris", active: mpris.active, busName: "org.mpris.MediaPlayer2.roon" });
      }
      if (queueWanted && bridge.selectedZoneId && bridge.transport && bridge.queueZoneId !== bridge.selectedZoneId) {
        bridge.subscribeQueue(bridge.selectedZoneId, queueMax);
      }
      return { selectedZoneId: bridge.selectedZoneId };
    },
    control: (m) => bridge.control(m.zoneId || bridge.selectedZoneId, m.action),
    seek: (m) => bridge.seek(m.zoneId || bridge.selectedZoneId, m.how, m.seconds),
    volume: (m) => bridge.volume(m.outputId, m.how, m.value),
    mute: (m) => bridge.mute(m.outputId, m.how || "toggle"),
    settings: (m) => bridge.settings(m.zoneId || bridge.selectedZoneId, m),
    transfer: (m) => bridge.transfer(m.fromZoneId || bridge.selectedZoneId, m.toZoneId),
    group: (m) => bridge.group(m.outputIds),
    ungroup: (m) => bridge.ungroup(m.outputIds),
    queue_subscribe: (m) => {
      queueWanted = true;
      queueMax = Number(m.max) || 50;
      bridge.subscribeQueue(m.zoneId || bridge.selectedZoneId, queueMax);
      return { zoneId: bridge.queueZoneId };
    },
    queue_unsubscribe: () => {
      queueWanted = false;
      bridge.stopQueue();
    },
    play_from_here: (m) => bridge.playFromHere(m.zoneId || bridge.selectedZoneId, m.queueItemId),
    browse: (m) => browse.browse(m.session || "popout", m),
    load: (m) => browse.load(m.session || "popout", m),
    reset_session: (m) => browse.reset(m.session || "popout"),
    search: (m) => browse.search(String(m.query || ""), { category: m.category || "", limit: Number(m.limit) || 10, zoneId: m.zoneId, key: m.session || "launcher" }),
    play_item: (m) => {
      const zoneId = m.zoneId || bridge.selectedZoneId;
      if (m.ref) return browse.playRef(m.ref, m.mode || "play_now", zoneId);
      return browse.playItem(m.session || "popout", m.itemKey, m.mode || "play_now", zoneId);
    },
    open_item: (m) => browse.openRef(m.ref, { zoneId: m.zoneId || bridge.selectedZoneId, key: m.session || "popout" }),
    mpris: (m) => {
      mprisWanted = !!m.enabled;
      if (mprisWanted && bridge.selectedZoneId && bridge.transport) mpris.enable();
      else if (!mprisWanted) mpris.disable();
      proto.send({ type: "mpris", active: mpris.active, busName: "org.mpris.MediaPlayer2.roon" });
      return { active: mpris.active, available: mpris.available };
    },
    set_connection: (m) => ({ restarted: bridge.setConnection({ mode: m.mode, host: m.host, port: m.port }) }),
    forget_core: () => {
      bridge.forgetCore();
    },
    status: () => ({ ...bridge.status, selectedZoneId: bridge.selectedZoneId, mpris: mpris.active }),
    zones: () => ({ zones: bridge.normalizedZones() }),
    lyrics: (m) => {
      const zoneId = m.zoneId || bridge.selectedZoneId;
      const entry = lyrics.current(zoneId, bridge.zones.get(zoneId));
      return { lrc: entry ? entry.lrc : "", displayZone: opts.displayZone };
    },
    shutdown: () => {
      shutdown(0);
    },
  };

  function handle(msg) {
    const fn = handlers[msg.type];
    if (!fn) {
      if (msg.id != null) proto.fail(msg.id, `unknown message type: ${msg.type}`, "unknown_type");
      else proto.send({ type: "error", code: "unknown_type", message: `unknown message type: ${msg.type}` });
      return;
    }
    let result;
    try {
      result = fn(msg);
    } catch (e) {
      if (msg.id != null) proto.fail(msg.id, e);
      else proto.send({ type: "error", code: "handler", message: e.message, request: msg.type });
      return;
    }
    Promise.resolve(result).then(
      (data) => {
        if (msg.id != null) proto.reply(msg.id, data);
      },
      (e) => {
        if (msg.id != null) proto.fail(msg.id, e);
        else proto.send({ type: "error", code: "handler", message: e && e.message ? e.message : String(e), request: msg.type });
      }
    );
  }

  function onStdinEnd() {
    if (opts.linger > 0) setTimeout(() => shutdown(0), opts.linger * 1000);
    else shutdown(0);
  }

  function shutdown(code) {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      mpris.disable();
      if (display) display.stop();
      bridge.stop();
    } catch {
      /* best effort */
    }
    try {
      if (fs.readFileSync(pidFile, "utf8").trim() === String(process.pid)) fs.unlinkSync(pidFile);
    } catch {
      /* ignore */
    }
    setTimeout(() => process.exit(code), 150).unref();
  }

  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGINT", () => shutdown(0));
  process.on("SIGHUP", () => shutdown(0));
  process.on("uncaughtException", (e) => {
    proto.send({ type: "error", code: "uncaught", message: e && e.stack ? e.stack : String(e) });
  });
  process.on("unhandledRejection", (e) => {
    proto.send({ type: "error", code: "unhandled", message: e && e.stack ? e.stack : String(e) });
  });

  bridge.start();
}

main();
