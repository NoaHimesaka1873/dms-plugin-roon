"use strict";

const fs = require("node:fs");
const path = require("node:path");
const EventEmitter = require("node:events");
const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiBrowse = require("node-roon-api-browse");
const RoonApiImage = require("node-roon-api-image");
const RoonApiStatus = require("node-roon-api-status");

const SOOD_SERVICE_ID = "00720724-5143-4a9b-abac-0e50cba674bb";
const UNAUTHORIZED_AFTER_MS = 5000;
const OTHER_ZONE_SEEK_THROTTLE_MS = 5000;

// Owns the Roon connection (discovery or manual), the zone cache and the
// transport commands. Emits: status, zones, zone_changed, seek, queue, selected, paired, unpaired.
class RoonBridge extends EventEmitter {
  constructor(opts) {
    super();
    this.opts = opts;
    this.stateFile = path.join(opts.stateDir, "roon-state.json");
    this.roon = null;
    this.core = null;
    this.transport = null;
    this.browseSvc = null;
    this.zones = new Map();
    this.status = { state: "starting", coreName: "", coreId: "", host: "", httpPort: 0, message: "" };
    this.selectedZoneId = null;
    this.queueSub = null;
    this.queueZoneId = null;
    this.queueItems = [];
    this._seekLast = new Map();
    this._coreSeenTimer = null;
    this._manualMoo = null;
    this._manualRetry = 0;
    this._manualTimer = null;
    this._stopped = false;
  }

  log(level, message) {
    if (this.opts.log) this.opts.log(level, message);
  }

  // --- persisted state (pairing token) -------------------------------------

  loadState() {
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, "utf8")) || {};
    } catch {
      return {};
    }
  }

  saveState(state) {
    fs.mkdirSync(this.opts.stateDir, { recursive: true });
    const tmp = this.stateFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, this.stateFile);
  }

  // --- lifecycle -------------------------------------------------------------

  start() {
    const o = this.opts;
    this.roon = new RoonApi({
      extension_id: o.extensionId,
      display_name: o.displayName,
      display_version: o.displayVersion,
      publisher: o.publisher,
      email: o.email,
      website: o.website,
      log_level: "none",
      get_persisted_state: () => this.loadState(),
      set_persisted_state: (s) => this.saveState(s),
      core_paired: (core) => this._onPaired(core),
      core_unpaired: (core) => this._onUnpaired(core),
    });
    this.svcStatus = new RoonApiStatus(this.roon);
    this.roon.init_services({
      required_services: [RoonApiTransport, RoonApiBrowse, RoonApiImage],
      provided_services: [this.svcStatus],
    });
    this.svcStatus.set_status("Waiting for DankMaterialShell", false);
    this._connect();
  }

  stop() {
    this._stopped = true;
    if (this._coreSeenTimer) clearTimeout(this._coreSeenTimer);
    if (this._manualTimer) clearTimeout(this._manualTimer);
    this._coreSeenTimer = null;
    this._manualTimer = null;
    this.stopQueue();
    try {
      if (this.roon && this.roon.stop_discovery) this.roon.stop_discovery();
      if (this.roon && this.roon.disconnect_all) this.roon.disconnect_all();
      if (this._manualMoo) this._manualMoo.transport.close();
    } catch (e) {
      this.log("warn", "stop: " + e.message);
    }
  }

  // Switch connection mode at runtime (settings change). Restarts the connection.
  setConnection({ mode, host, port }) {
    const changed = mode !== this.opts.mode || host !== this.opts.host || Number(port) !== Number(this.opts.port);
    this.opts.mode = mode || "discovery";
    this.opts.host = host || "";
    this.opts.port = Number(port) || 9330;
    if (!changed) return false;
    this._reconnect();
    return true;
  }

  forgetCore() {
    const state = this.loadState();
    delete state.tokens;
    delete state.paired_core_id;
    this.saveState(state);
    if (this.roon) {
      this.roon.paired_core_id = undefined;
      this.roon.paired_core = undefined;
      this.roon.is_paired = false;
    }
    this._reconnect();
  }

  _reconnect() {
    try {
      if (this.roon.stop_discovery) this.roon.stop_discovery();
      if (this.roon.disconnect_all) this.roon.disconnect_all();
      if (this._manualMoo) {
        const moo = this._manualMoo;
        this._manualMoo = null;
        moo.transport.close();
      }
    } catch (e) {
      this.log("warn", "reconnect: " + e.message);
    }
    if (this._manualTimer) clearTimeout(this._manualTimer);
    this._manualTimer = null;
    this._manualRetry = 0;
    setTimeout(() => this._connect(), 250);
  }

  _connect() {
    if (this._stopped) return;
    if (this.opts.mode === "manual" && this.opts.host) {
      this._setStatus({ state: "discovering", message: `Connecting to ${this.opts.host}:${this.opts.port}` });
      this._manualConnect();
    } else {
      this._setStatus({ state: "discovering", message: "Looking for Roon Server" });
      this.roon.start_discovery();
      this._hookSood();
    }
  }

  _hookSood() {
    const sood = this.roon._sood;
    if (!sood || sood.__dmsHooked) return;
    sood.__dmsHooked = true;
    sood.on("message", (msg) => {
      if (!msg || !msg.props || msg.props.service_id !== SOOD_SERVICE_ID) return;
      this._coreSeen(msg.from && msg.from.ip, msg.props);
    });
  }

  // A core answered but has not paired us yet: after a grace period report
  // "unauthorized" so the UI can tell the user to press Enable in Roon.
  _coreSeen(ip, props) {
    if (this.status.state === "paired") return;
    this.lastSeenCore = { ip, props };
    if (this._coreSeenTimer) return;
    if (this.status.state === "unauthorized" && this.status.host === (ip || "")) return;
    this._coreSeenTimer = setTimeout(() => {
      this._coreSeenTimer = null;
      if (this.status.state === "paired" || this._stopped) return;
      this._setStatus({
        state: "unauthorized",
        host: ip || "",
        httpPort: Number(props.http_port) || 0,
        coreName: props.display_name || props.name || "",
        message: 'Enable "DMS Roon" in Roon → Settings → Extensions',
      });
    }, UNAUTHORIZED_AFTER_MS);
  }

  _manualConnect() {
    if (this._stopped || this._manualMoo) return;
    const host = this.opts.host;
    const port = Number(this.opts.port) || 9330;
    this._manualMoo = this.roon.ws_connect({
      host,
      port,
      onclose: () => {
        this._manualMoo = null;
        if (this.status.state === "paired") this._onUnpaired(this.core);
        this._scheduleManualRetry();
      },
      onerror: () => {},
    });
    this._coreSeen(host, { http_port: port });
  }

  _scheduleManualRetry() {
    if (this._stopped || this.opts.mode !== "manual") return;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this._manualRetry++, 5));
    this._manualTimer = setTimeout(() => {
      this._manualTimer = null;
      this._manualConnect();
    }, delay);
  }

  _onPaired(core) {
    this.core = core;
    this._manualRetry = 0;
    if (this._coreSeenTimer) {
      clearTimeout(this._coreSeenTimer);
      this._coreSeenTimer = null;
    }
    this.transport = core.services.RoonApiTransport;
    this.browseSvc = core.services.RoonApiBrowse;
    const t = core.moo.transport;
    this._setStatus({
      state: "paired",
      coreName: core.display_name || "",
      coreId: core.core_id || "",
      host: t.host || "",
      httpPort: Number(t.port) || 0,
      message: "",
    });
    this.svcStatus.set_status("Connected to DankMaterialShell", false);
    this.transport.subscribe_zones((resp, body) => this._onZones(resp, body));
    this.emit("paired", core);
  }

  _onUnpaired(core) {
    if (this.core && core && core.core_id && this.core.core_id !== core.core_id) return;
    this.core = null;
    this.transport = null;
    this.browseSvc = null;
    this.zones.clear();
    this.stopQueue();
    this._setStatus({ state: "disconnected", message: "Roon Server connection lost" });
    this.emit("zones", []);
    this.emit("unpaired");
  }

  _setStatus(patch) {
    Object.assign(this.status, patch);
    this.emit("status", { ...this.status });
  }

  // --- zones -----------------------------------------------------------------

  artUrl(imageKey, size) {
    if (!imageKey || !this.status.host || !this.status.httpPort) return "";
    const s = Number(size) || 256;
    return `http://${this.status.host}:${this.status.httpPort}/api/image/${encodeURIComponent(imageKey)}?scale=fit&width=${s}&height=${s}&format=image/jpeg`;
  }

  normalizeZone(z) {
    const np = z.now_playing || null;
    const three = (np && np.three_line) || {};
    const two = (np && np.two_line) || {};
    const one = (np && np.one_line) || {};
    return {
      zoneId: z.zone_id,
      name: z.display_name || "",
      state: z.state || "stopped",
      isPlayAllowed: !!z.is_play_allowed,
      isPauseAllowed: !!z.is_pause_allowed,
      isNextAllowed: !!z.is_next_allowed,
      isPreviousAllowed: !!z.is_previous_allowed,
      isSeekAllowed: !!z.is_seek_allowed,
      queueItemsRemaining: z.queue_items_remaining || 0,
      queueTimeRemaining: z.queue_time_remaining || 0,
      settings: {
        loop: (z.settings && z.settings.loop) || "disabled",
        shuffle: !!(z.settings && z.settings.shuffle),
        autoRadio: !!(z.settings && z.settings.auto_radio),
      },
      outputs: (z.outputs || []).map((o) => ({
        outputId: o.output_id,
        zoneId: o.zone_id,
        name: o.display_name || "",
        state: o.state || "",
        volume: o.volume
          ? {
              type: o.volume.type || "number",
              min: o.volume.min,
              max: o.volume.max,
              value: o.volume.value,
              step: o.volume.step,
              isMuted: !!o.volume.is_muted,
            }
          : null,
      })),
      nowPlaying: np
        ? {
            title: three.line1 || one.line1 || "",
            artist: three.line2 || "",
            album: three.line3 || "",
            line1: three.line1 || one.line1 || "",
            line2: three.line2 || "",
            line3: three.line3 || "",
            oneLine: one.line1 || "",
            twoLine1: two.line1 || "",
            twoLine2: two.line2 || "",
            imageKey: np.image_key || "",
            artUrl: this.artUrl(np.image_key, 512),
            length: np.length || 0,
            position: np.seek_position != null ? np.seek_position : z.seek_position || 0,
          }
        : null,
    };
  }

  normalizedZones() {
    return Array.from(this.zones.values()).map((z) => this.normalizeZone(z));
  }

  _emitZones() {
    this.emit("zones", this.normalizedZones());
  }

  _onZones(resp, body) {
    if (resp === "Subscribed") {
      this.zones.clear();
      (body.zones || []).forEach((z) => this.zones.set(z.zone_id, z));
      this._emitZones();
      return;
    }
    if (resp !== "Changed" || !body) return;
    let structural = false;
    (body.zones_removed || []).forEach((id) => {
      this.zones.delete(id);
      structural = true;
    });
    (body.zones_added || []).forEach((z) => {
      this.zones.set(z.zone_id, z);
      structural = true;
    });
    (body.zones_changed || []).forEach((z) => {
      this.zones.set(z.zone_id, z);
      if (!structural) this.emit("zone_changed", this.normalizeZone(z));
    });
    if (structural) this._emitZones();
    (body.zones_seek_changed || []).forEach((s) => {
      const z = this.zones.get(s.zone_id);
      if (!z) return;
      if (z.now_playing) z.now_playing.seek_position = s.seek_position;
      z.seek_position = s.seek_position;
      z.queue_time_remaining = s.queue_time_remaining;
      const now = Date.now();
      const last = this._seekLast.get(s.zone_id) || 0;
      const selected = s.zone_id === this.selectedZoneId;
      if (selected || now - last >= OTHER_ZONE_SEEK_THROTTLE_MS) {
        this._seekLast.set(s.zone_id, now);
        this.emit("seek", { zoneId: s.zone_id, position: s.seek_position, queueTimeRemaining: s.queue_time_remaining });
      }
    });
  }

  findOutput(outputId) {
    for (const z of this.zones.values()) {
      for (const o of z.outputs || []) if (o.output_id === outputId) return o;
    }
    return null;
  }

  selectZone(zoneId) {
    this.selectedZoneId = zoneId || null;
    if (this.queueSub && this.queueZoneId !== this.selectedZoneId) {
      const max = this.queueMax;
      this.stopQueue();
      if (this.selectedZoneId) this.subscribeQueue(this.selectedZoneId, max);
    }
    this.emit("selected", this.selectedZoneId);
  }

  // --- transport commands (promises) ----------------------------------------

  _call(fn) {
    return new Promise((resolve, reject) => {
      if (!this.transport) return reject(new Error("not paired"));
      try {
        fn((err, body) => (err ? reject(new Error(String(err))) : resolve(body)));
      } catch (e) {
        reject(e);
      }
    });
  }

  control(zoneId, action) {
    if (!zoneId) return Promise.reject(new Error("zoneId required"));
    return this._call((cb) => this.transport.control(zoneId, action, cb));
  }

  seek(zoneId, how, seconds) {
    return this._call((cb) => this.transport.seek(zoneId, how || "absolute", Number(seconds) || 0, cb));
  }

  volume(outputId, how, value) {
    return this._call((cb) => this.transport.change_volume(outputId, how || "absolute", Number(value) || 0, cb));
  }

  mute(outputId, how) {
    if (how === "toggle") {
      const o = this.findOutput(outputId);
      how = o && o.volume && o.volume.is_muted ? "unmute" : "mute";
    }
    return this._call((cb) => this.transport.mute(outputId, how, cb));
  }

  settings(zoneId, s) {
    const patch = {};
    if (s.shuffle !== undefined) patch.shuffle = !!s.shuffle;
    if (s.loop !== undefined) patch.loop = s.loop;
    if (s.autoRadio !== undefined) patch.auto_radio = !!s.autoRadio;
    return this._call((cb) => this.transport.change_settings(zoneId, patch, cb));
  }

  transfer(fromZoneId, toZoneId) {
    return this._call((cb) => this.transport.transfer_zone(fromZoneId, toZoneId, cb));
  }

  group(outputIds) {
    return this._call((cb) => this.transport.group_outputs(outputIds || [], cb));
  }

  ungroup(outputIds) {
    return this._call((cb) => this.transport.ungroup_outputs(outputIds || [], cb));
  }

  playFromHere(zoneId, queueItemId) {
    return new Promise((resolve, reject) => {
      if (!this.transport) return reject(new Error("not paired"));
      this.transport.play_from_here(zoneId, queueItemId, (msg, body) => {
        if (msg && msg.name === "Success") resolve(body);
        else reject(new Error(msg ? msg.name : "NetworkError"));
      });
    });
  }

  // --- queue -----------------------------------------------------------------

  normalizeQueueItem(i) {
    const three = i.three_line || {};
    const one = i.one_line || {};
    return {
      queueItemId: i.queue_item_id,
      title: three.line1 || one.line1 || "",
      subtitle: three.line2 || "",
      album: three.line3 || "",
      imageKey: i.image_key || "",
      artUrl: this.artUrl(i.image_key, 128),
      length: i.length || 0,
    };
  }

  subscribeQueue(zoneId, max) {
    this.stopQueue();
    if (!this.transport || !zoneId) return;
    this.queueZoneId = zoneId;
    this.queueMax = Number(max) || 50;
    this.queueItems = [];
    this.queueSub = this.transport.subscribe_queue(zoneId, this.queueMax, (resp, body) => {
      if (resp === "Subscribed") {
        this.queueItems = (body && body.items) || [];
      } else if (resp === "Changed") {
        for (const ch of (body && body.changes) || []) {
          if (ch.operation === "remove") this.queueItems.splice(ch.index, ch.count);
          else if (ch.operation === "insert") this.queueItems.splice(ch.index, 0, ...(ch.items || []));
        }
      } else {
        return;
      }
      this.emit("queue", { zoneId, items: this.queueItems.map((i) => this.normalizeQueueItem(i)) });
    });
  }

  stopQueue() {
    if (this.queueSub) {
      try {
        this.queueSub.unsubscribe(() => {});
      } catch {
        /* connection may be gone */
      }
    }
    this.queueSub = null;
    this.queueZoneId = null;
    this.queueItems = [];
  }
}

module.exports = { RoonBridge };
