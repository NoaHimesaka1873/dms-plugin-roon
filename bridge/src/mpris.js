"use strict";

const crypto = require("node:crypto");

let Player = null;
try {
  Player = require("mpris-service");
} catch {
  Player = null;
}

// Mirrors the selected Roon zone as org.mpris.MediaPlayer2.roon.
class MprisBridge {
  constructor(bridge, log, lyrics) {
    this.bridge = bridge;
    this.lyrics = lyrics || null;
    this.log = log || (() => {});
    this.player = null;
    this.zoneId = null;
    this.available = !!Player;
    this._seekBase = 0;
    this._seekAt = 0;
    this._playing = false;
    this._lastTrackId = "";
    this._resyncSeeks = 0;
  }

  get active() {
    return !!this.player;
  }

  enable() {
    if (!this.available) return false;
    if (this.player) return true;
    let p;
    try {
      p = Player({
        name: "roon",
        identity: "Roon",
        supportedUriSchemes: [],
        supportedMimeTypes: [],
        supportedInterfaces: ["player"],
      });
    } catch (e) {
      this.log("error", "mpris: " + e.message);
      return false;
    }
    this.player = p;
    p.getPosition = () => Math.round(this.position() * 1e6);
    p.canQuit = false;
    p.canRaise = false;
    p.canControl = true;
    for (const ev of ["play", "pause", "playpause", "stop", "next", "previous"]) {
      p.on(ev, () => this._control(ev));
    }
    p.on("seek", (offset) => this._seek("relative", Number(offset) / 1e6));
    p.on("position", (e) => this._seek("absolute", Number(e && e.position) / 1e6));
    p.on("volume", (v) => this._setVolume(Number(v)));
    p.on("shuffle", (b) => this._settings({ shuffle: !!b }));
    p.on("loopStatus", (s) => this._settings({ loop: s === "Track" ? "loop_one" : s === "Playlist" ? "loop" : "disabled" }));
    p.on("quit", () => {});
    p.on("raise", () => {});
    if (p._bus && typeof p._bus.on === "function") {
      p._bus.on("error", (e) => this.log("warn", "mpris bus: " + (e && e.message)));
    }
    this.update();
    return true;
  }

  disable() {
    if (!this.player) return;
    const p = this.player;
    this.player = null;
    try {
      if (p._bus && typeof p._bus.disconnect === "function") p._bus.disconnect();
    } catch (e) {
      this.log("warn", "mpris disable: " + e.message);
    }
  }

  setZone(zoneId) {
    this.zoneId = zoneId || null;
    this._lastTrackId = "";
    this._resyncSeeks = 3;
    this.update();
  }

  position() {
    if (!this._seekAt) return this._seekBase;
    const extra = this._playing ? (Date.now() - this._seekAt) / 1000 : 0;
    return this._seekBase + extra;
  }

  // Clients like Quickshell only re-read Position on track/status changes and
  // Seeked, then extrapolate. Right after a track change Roon's zone still
  // carries the old track's seek position, so a client can anchor on that and
  // run past the end of the new track. Send Seeked on the first reports after
  // every track change so they re-anchor on the real position.
  onSeek(zoneId, position) {
    if (zoneId !== this.zoneId) return;
    const drift = Math.abs(this.position() - position);
    this._seekBase = Number(position) || 0;
    this._seekAt = Date.now();
    if (!this.player) return;
    if (drift > 2 || this._resyncSeeks > 0) {
      if (this._resyncSeeks > 0) this._resyncSeeks--;
      this.player.seeked(Math.round(this._seekBase * 1e6));
    }
  }

  update() {
    const p = this.player;
    if (!p) return;
    const raw = this.zoneId ? this.bridge.zones.get(this.zoneId) : null;
    if (!raw) {
      this._playing = false;
      p.playbackStatus = "Stopped";
      p.metadata = {};
      p.canGoNext = false;
      p.canGoPrevious = false;
      p.canPlay = false;
      p.canPause = false;
      p.canSeek = false;
      return;
    }
    const z = this.bridge.normalizeZone(raw);
    const np = z.nowPlaying;
    const playing = z.state === "playing" || z.state === "loading";
    if (playing !== this._playing) {
      this._seekBase = this.position();
      this._seekAt = Date.now();
      this._playing = playing;
    }
    let jumped = false;
    if (np && np.position != null) {
      // Never carry a position past the (new) track's end.
      const next = np.length > 0 && np.position > np.length ? 0 : np.position;
      // A zone update can move the position too (repeat-one wrapping to 0, a
      // seek from another Roon remote). Clients never re-read Position on
      // their own, so tell them.
      jumped = this._seekAt > 0 && Math.abs(this.position() - next) > 2;
      this._seekBase = next;
      this._seekAt = Date.now();
    }
    p.playbackStatus = z.state === "playing" || z.state === "loading" ? "Playing" : z.state === "paused" ? "Paused" : "Stopped";
    p.canGoNext = z.isNextAllowed;
    p.canGoPrevious = z.isPreviousAllowed;
    p.canPlay = z.isPlayAllowed;
    p.canPause = z.isPauseAllowed;
    p.canSeek = z.isSeekAllowed;
    p.shuffle = z.settings.shuffle;
    p.loopStatus = z.settings.loop === "loop_one" ? "Track" : z.settings.loop === "loop" ? "Playlist" : "None";
    const out = z.outputs.find((o) => o.volume && o.volume.type !== "incremental");
    if (out) {
      const v = out.volume;
      const range = v.max - v.min || 1;
      p.volume = v.isMuted ? 0 : Math.max(0, Math.min(1, (v.value - v.min) / range));
    }
    if (np) {
      const trackId = crypto.createHash("sha1").update(`${z.zoneId}|${np.imageKey}|${np.title}|${np.artist}`).digest("hex").slice(0, 16);
      const meta = {
        "mpris:trackid": p.objectPath("track/" + trackId),
        "mpris:length": Math.round((np.length || 0) * 1e6),
        "xesam:title": np.title,
        "xesam:album": np.album,
        "xesam:artist": np.artist ? np.artist.split(" / ") : [],
      };
      const art = this.bridge.artUrl(np.imageKey, 600);
      if (art) meta["mpris:artUrl"] = art;
      // Roon's lyrics reach the DMS lyrics view as an .lrc sidecar of xesam:url.
      if (np.lyricsUrl) {
        meta["xesam:url"] = np.lyricsUrl;
        meta["xesam:asText"] = this.lyrics ? this.lyrics.plainText(this.lyrics.current(z.zoneId, raw)) : "";
      }
      if (trackId !== this._lastTrackId) {
        this._lastTrackId = trackId;
        this._resyncSeeks = 3;
      }
      p.metadata = meta;
      if (jumped) p.seeked(Math.round(this._seekBase * 1e6));
    } else {
      p.metadata = {};
    }
  }

  _control(ev) {
    if (!this.zoneId) return;
    const map = { play: "play", pause: "pause", playpause: "playpause", stop: "stop", next: "next", previous: "previous" };
    this.bridge.control(this.zoneId, map[ev]).catch((e) => this.log("warn", "mpris control: " + e.message));
  }

  _seek(how, seconds) {
    if (!this.zoneId || !Number.isFinite(seconds)) return;
    this.bridge.seek(this.zoneId, how, seconds).catch((e) => this.log("warn", "mpris seek: " + e.message));
  }

  _settings(patch) {
    if (!this.zoneId) return;
    this.bridge.settings(this.zoneId, patch).catch((e) => this.log("warn", "mpris settings: " + e.message));
  }

  _setVolume(v) {
    if (!this.zoneId || !Number.isFinite(v)) return;
    const raw = this.bridge.zones.get(this.zoneId);
    if (!raw) return;
    const out = (raw.outputs || []).find((o) => o.volume && o.volume.type !== "incremental");
    if (!out) return;
    const vol = out.volume;
    const value = vol.min + Math.max(0, Math.min(1, v)) * (vol.max - vol.min);
    const rounded = vol.step ? Math.round(value / vol.step) * vol.step : Math.round(value);
    this.bridge.volume(out.output_id, "absolute", rounded).catch((e) => this.log("warn", "mpris volume: " + e.message));
  }
}

module.exports = { MprisBridge };
