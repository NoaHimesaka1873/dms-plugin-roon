"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const EventEmitter = require("node:events");
const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiImage = require("node-roon-api-image");

const DISPLAY_EXTENSION_ID = "com.roonlabs.display_zone";
const DISPLAY_SERVICE = "com.roonlabs.zonedisplay:1";
const RECONNECT_MS = 5000;
const SIDECAR_KEEP = 200;

// Identifies the track a zone is playing; lyrics are only valid for it.
function trackSignature(rawZone) {
  const np = rawZone && rawZone.now_playing;
  if (!np) return "";
  const three = np.three_line || {};
  const one = np.one_line || {};
  return [np.image_key || "", three.line1 || one.line1 || "", three.line2 || ""].join("|");
}

// Roon only sends lyrics to its web display, the page at :9330/display/. This
// is a second connection that registers exactly like that page does (same
// extension id and registration, which the core trusts as a display without
// enabling anything) and hosts the same zonedisplay service. Roon lists it
// under Settings → Displays, and its zone subscription carries
// "LyricsChanged" ({zone_id, key, lrc}) for every zone, right after the
// zone's track changes.
// The same subscription carries "WaveformChanged" ({zone_id, waveform}), the
// loudness outline Roon draws as its seek bar.
// Emits: lyrics ({zoneId, key, lrc, track}), waveform ({zoneId, waveform}), cleared.
class RoonDisplay extends EventEmitter {
  constructor({ stateDir, log }) {
    super();
    this.log = log || (() => {});
    this.stateFile = path.join(stateDir, "display-state.json");
    this.display = {
      display_key: loadDisplayKey(stateDir),
      auto_name: "DankMaterialShell on " + os.hostname(),
      active_zone_id: null,
    };
    this.host = "";
    this.port = 0;
    this.moo = null;
    this.tracks = new Map();
    this._timer = null;
    this._stopped = true;

    // Registration copied from the web display page (display_ui.js).
    this.roon = new RoonApi({
      extension_id: DISPLAY_EXTENSION_ID,
      display_name: "Roon API Display Zone",
      display_version: "1.0.0",
      publisher: "Roon Labs, LLC",
      email: "contact@roonlabs.com",
      log_level: "none",
      get_persisted_state: () => this._loadState(),
      set_persisted_state: (st) => this._saveState(st),
      core_paired: (core) => this._onPaired(core),
      core_unpaired: () => this.emit("cleared"),
    });
    const matches = (req) => req.body && req.body.display_key === this.display.display_key;
    this.svc = this.roon.register_service(DISPLAY_SERVICE, {
      subscriptions: [
        {
          subscribe_name: "subscribe_displays",
          unsubscribe_name: "unsubscribe_displays",
          start: (req) => req.send_continue("Subscribed", { displays: [this.display] }),
        },
      ],
      methods: {
        get_displays: (req) => req.send_complete("Success", { displays: [this.display] }),
        activate: (req) => {
          if (!matches(req)) return req.send_complete("InvalidKey");
          this._setActive(req.body.zone_id || null);
          req.send_complete("Success");
        },
        deactivate: (req) => {
          if (!matches(req)) return req.send_complete("InvalidKey");
          this._setActive(null);
          req.send_complete("Success");
        },
        update_settings: (req) => req.send_complete(matches(req) ? "Success" : "InvalidKey"),
      },
    });
    this.roon.init_services({
      required_services: [RoonApiTransport, RoonApiImage],
      provided_services: [{ services: [this.svc] }],
    });
  }

  // Connect to the core the main connection is paired with.
  start(host, port) {
    if (!host || !port) return;
    if (!this._stopped && host === this.host && Number(port) === this.port) return;
    this.stop();
    this._stopped = false;
    this.host = host;
    this.port = Number(port);
    this._connect();
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    if (this.moo) {
      const moo = this.moo;
      this.moo = null;
      try {
        moo.transport.close();
      } catch {
        /* already gone */
      }
    }
  }

  // Show the zone selected in DMS, so the display in Roon's list matches the bar.
  follow(zoneId) {
    if ((zoneId || null) === this.display.active_zone_id) return;
    this.display.active_zone_id = zoneId || null;
    this._announce();
  }

  _connect() {
    if (this._stopped || this.moo) return;
    this.moo = this.roon.ws_connect({
      host: this.host,
      port: this.port,
      onclose: () => {
        this.moo = null;
        this.emit("cleared");
        if (this._stopped) return;
        this._timer = setTimeout(() => {
          this._timer = null;
          this._connect();
        }, RECONNECT_MS);
      },
      onerror: () => {},
    });
  }

  _onPaired(core) {
    this.tracks.clear();
    core.services.RoonApiTransport.subscribe_zones((resp, body) => {
      if (!body) return;
      if (resp === "Subscribed" || resp === "Changed") {
        for (const z of [...(body.zones || []), ...(body.zones_added || []), ...(body.zones_changed || [])]) {
          const track = trackSignature(z);
          if (this.tracks.get(z.zone_id) === track) continue;
          this.tracks.set(z.zone_id, track);
          // A new track drops the old lyrics and waveform; its own follow right after.
          if (resp === "Changed") {
            this.emit("lyrics", { zoneId: z.zone_id, key: null, lrc: "", track });
            this.emit("waveform", { zoneId: z.zone_id, waveform: null });
          }
        }
        for (const id of body.zones_removed || []) {
          this.tracks.delete(id);
          this.emit("lyrics", { zoneId: id, key: null, lrc: "", track: "" });
          this.emit("waveform", { zoneId: id, waveform: null });
        }
        return;
      }
      if (resp === "WaveformChanged") {
        // Unanalysed tracks come as all zeros; treat those as no waveform, like Roon's display does.
        const wf = Array.isArray(body.waveform) && body.waveform.some((v) => v > 0) ? body.waveform.map((v) => Math.round(Number(v) * 1000) / 1000) : null;
        this.emit("waveform", { zoneId: body.zone_id, waveform: wf });
        return;
      }
      if (resp !== "LyricsChanged") return;
      this.emit("lyrics", {
        zoneId: body.zone_id,
        key: body.key == null ? null : String(body.key),
        lrc: body.lrc || "",
        track: this.tracks.get(body.zone_id) || "",
      });
    });
  }

  _setActive(zoneId) {
    this.display.active_zone_id = zoneId;
    this._announce();
  }

  _announce() {
    try {
      this.svc.send_continue_all("subscribe_displays", "Changed", { displays_changed: [this.display] });
    } catch (e) {
      this.log("warn", "display: " + e.message);
    }
  }

  _loadState() {
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, "utf8")) || {};
    } catch {
      return {};
    }
  }

  _saveState(st) {
    try {
      fs.writeFileSync(this.stateFile + ".tmp", JSON.stringify(st, null, 2));
      fs.renameSync(this.stateFile + ".tmp", this.stateFile);
    } catch (e) {
      this.log("warn", "display state: " + e.message);
    }
  }
}

function loadDisplayKey(stateDir) {
  const file = path.join(stateDir, "display-key");
  try {
    const key = fs.readFileSync(file, "utf8").trim();
    if (key) return key;
  } catch {
    /* first run */
  }
  const key = crypto.randomUUID();
  try {
    fs.writeFileSync(file, key);
  } catch {
    /* a fresh key next time is fine */
  }
  return key;
}

// One path segment from track metadata: no slashes, no leading dots, sane length.
function segment(text, fallback) {
  let s = String(text || "")
    .replace(/[\/\0]/g, "∕")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  if (!s) s = fallback;
  while (Buffer.byteLength(s) > 180) s = s.slice(0, -1);
  return s;
}

// Lyrics per zone, written out as .lrc sidecars. DMS reads a sidecar next to
// the MPRIS xesam:url before asking any network provider, and the audio file
// itself doesn't have to exist, so the MPRIS track points at
// <dir>/<Album>/<Artist> - <Title>.roon and the lyrics sit in the .lrc beside it.
class LyricsStore {
  constructor(cacheDir, log) {
    this.dir = path.join(cacheDir, "lyrics");
    this.log = log || (() => {});
    this.byZone = new Map();
  }

  // Returns true when the zone's lyrics actually changed.
  set(zoneId, key, lrc, track) {
    const text = typeof lrc === "string" && lrc.trim() ? lrc : "";
    const prev = this.byZone.get(zoneId);
    if (prev && prev.key === (key || null) && prev.lrc === text && prev.track === (track || "")) return false;
    if (!prev && !text) return false;
    if (text) this.byZone.set(zoneId, { key: key || null, lrc: text, track: track || "" });
    else this.byZone.delete(zoneId);
    return true;
  }

  get(zoneId) {
    return this.byZone.get(zoneId) || null;
  }

  zones() {
    return Array.from(this.byZone.keys());
  }

  // Lyrics for the zone, but only while it still plays the track they came with.
  current(zoneId, rawZone) {
    const entry = this.byZone.get(zoneId);
    if (!entry || entry.track !== trackSignature(rawZone)) return null;
    return entry;
  }

  // file:// URL whose .lrc sibling holds these lyrics, or "" if writing failed.
  trackUrl(entry, np) {
    if (!entry || !np) return "";
    const artist = String(np.artist || "").split(" / ").join(", ");
    const name = segment(artist ? `${artist} - ${np.title}` : np.title, "Unknown Track");
    const base = path.join(this.dir, segment(np.album, "Unknown Album"), name);
    const lrcPath = base + ".lrc";
    try {
      let existing = null;
      try {
        existing = fs.readFileSync(lrcPath, "utf8");
      } catch {
        /* not written yet */
      }
      if (existing !== entry.lrc) {
        fs.mkdirSync(path.dirname(lrcPath), { recursive: true });
        fs.writeFileSync(lrcPath + ".tmp", entry.lrc);
        fs.renameSync(lrcPath + ".tmp", lrcPath);
        this._prune();
      }
    } catch (e) {
      this.log("warn", "lyrics: " + e.message);
      return "";
    }
    return "file://" + base.split(path.sep).map(encodeURIComponent).join("/") + ".roon";
  }

  // Plain text for xesam:asText, timestamps stripped.
  plainText(entry) {
    if (!entry) return "";
    return entry.lrc
      .split("\n")
      .filter((l) => !/^\[[a-z]+:.*\]\s*$/i.test(l.trim()))
      .map((l) => l.replace(/\[\d+:\d+(?:[.:]\d+)?\]/g, "").replace(/<\d+:\d+(?:[.:]\d+)?>/g, "").trim())
      .join("\n")
      .trim();
  }

  // Keep the newest sidecars; lyrics are cheap to get again from Roon.
  _prune() {
    try {
      const files = [];
      for (const album of fs.readdirSync(this.dir)) {
        const albumDir = path.join(this.dir, album);
        if (!fs.statSync(albumDir).isDirectory()) continue;
        for (const f of fs.readdirSync(albumDir)) {
          if (!f.endsWith(".lrc")) continue;
          const p = path.join(albumDir, f);
          files.push({ p, t: fs.statSync(p).mtimeMs });
        }
      }
      files.sort((a, b) => b.t - a.t);
      for (const { p } of files.slice(SIDECAR_KEEP)) {
        fs.unlinkSync(p);
        const albumDir = path.dirname(p);
        if (fs.readdirSync(albumDir).length === 0) fs.rmdirSync(albumDir);
      }
    } catch {
      /* best effort */
    }
  }
}

module.exports = { RoonDisplay, LyricsStore, trackSignature };
