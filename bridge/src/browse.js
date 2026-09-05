"use strict";

// Browse sessions are kept server-side by Roon, keyed by multi_session_key.
// The popout uses "popout", the launcher uses "launcher".
const CATEGORY_MATCHERS = {
  albums: /album/i,
  artists: /artist/i,
  tracks: /track/i,
  playlists: /playlist/i,
  radio: /radio/i,
  composers: /composer/i,
  genres: /genre/i,
  tags: /tag/i,
};

const MODE_TITLES = {
  play_now: /^play now$/i,
  queue: /^queue$/i,
  add_next: /^add next$/i,
  start_radio: /^start radio$/i,
  play_from_here: /^play from here$/i,
  shuffle: /^shuffle$/i,
  play: /^play/i,
};

class BrowseSessions {
  constructor(bridge) {
    this.bridge = bridge;
    this.sessions = new Map();
    this.searchRefs = new Map();
    this.refSeq = 0;
    this.lastSearch = null;
  }

  _svc() {
    const svc = this.bridge.browseSvc;
    if (!svc) throw new Error("not paired");
    return svc;
  }

  _browse(opts) {
    return new Promise((resolve, reject) => {
      this._svc().browse(opts, (err, body) => (err ? reject(new Error(String(err))) : resolve(body || {})));
    });
  }

  _load(opts) {
    return new Promise((resolve, reject) => {
      this._svc().load(opts, (err, body) => (err ? reject(new Error(String(err))) : resolve(body || {})));
    });
  }

  session(key) {
    let s = this.sessions.get(key);
    if (!s) {
      s = { key, hierarchy: "browse", crumbs: [], list: null };
      this.sessions.set(key, s);
    }
    return s;
  }

  reset(key) {
    this.sessions.delete(key);
  }

  normItem(i) {
    return {
      title: i.title || "",
      subtitle: i.subtitle || "",
      imageKey: i.image_key || "",
      artUrl: this.bridge.artUrl(i.image_key, 128),
      itemKey: i.item_key || "",
      hint: i.hint || null,
      inputPrompt: i.input_prompt || null,
    };
  }

  normList(l) {
    return {
      title: l.title || "",
      subtitle: l.subtitle || "",
      count: l.count || 0,
      level: l.level || 0,
      hint: l.hint || null,
      imageKey: l.image_key || "",
      artUrl: this.bridge.artUrl(l.image_key, 256),
    };
  }

  _crumb(s, list) {
    const lvl = list.level || 0;
    s.crumbs = s.crumbs.slice(0, lvl);
    s.crumbs[lvl] = list.title || "";
  }

  // Perform a browse step and (when it yields a list) load its first page.
  async browse(key, { hierarchy, itemKey, input, popAll, popLevels, refresh, zoneId, count = 100, load = true } = {}) {
    const s = this.session(key);
    if (hierarchy) s.hierarchy = hierarchy;
    const opts = { hierarchy: s.hierarchy, multi_session_key: key };
    if (itemKey) opts.item_key = itemKey;
    if (input !== undefined && input !== null) opts.input = String(input);
    if (popAll) opts.pop_all = true;
    if (popLevels) opts.pop_levels = Number(popLevels);
    if (refresh) opts.refresh_list = true;
    const zid = zoneId || this.bridge.selectedZoneId;
    if (zid) opts.zone_or_output_id = zid;

    const res = await this._browse(opts);
    const out = {
      action: res.action || "none",
      message: res.message || "",
      isError: !!res.is_error,
      item: res.item ? this.normItem(res.item) : null,
      list: null,
      items: [],
      offset: 0,
      breadcrumbs: s.crumbs.slice(),
      hierarchy: s.hierarchy,
    };
    if (res.action === "list" && res.list) {
      s.list = res.list;
      this._crumb(s, res.list);
      out.list = this.normList(res.list);
      out.breadcrumbs = s.crumbs.slice();
      if (load && count > 0) {
        const page = await this._load({ hierarchy: s.hierarchy, multi_session_key: key, offset: 0, count });
        out.items = (page.items || []).map((i) => this.normItem(i));
        out.offset = page.offset || 0;
        if (page.list) out.list = this.normList(page.list);
      }
    }
    return out;
  }

  async load(key, { offset = 0, count = 100, level } = {}) {
    const s = this.session(key);
    const opts = { hierarchy: s.hierarchy, multi_session_key: key, offset: Number(offset) || 0, count: Number(count) || 100 };
    if (level !== undefined && level !== null) opts.level = Number(level);
    const page = await this._load(opts);
    return {
      items: (page.items || []).map((i) => this.normItem(i)),
      offset: page.offset || 0,
      list: page.list ? this.normList(page.list) : s.list ? this.normList(s.list) : null,
      breadcrumbs: s.crumbs.slice(),
    };
  }

  static categoryMatches(title, category) {
    if (!category) return true;
    const re = CATEGORY_MATCHERS[category];
    if (re) return re.test(title);
    return title.toLowerCase().includes(category.toLowerCase());
  }

  // Search the library. Roon's "search" hierarchy returns one list item per
  // category (Albums, Artists, Tracks, ...); we drill into each and take the
  // first `limit` results, then pop back so the session stays at the category
  // level for later replays.
  async search(query, { category = "", limit = 10, zoneId, key = "launcher" } = {}) {
    const root = await this.browse(key, { hierarchy: "search", input: query, popAll: true, zoneId, count: 50 });
    const groups = [];
    this.searchRefs.clear();
    this.lastSearch = { query, zoneId, key };
    if (root.action !== "list") {
      return { query, groups, message: root.message || "", isError: root.isError };
    }
    const direct = [];
    for (const cat of root.items) {
      if (cat.hint !== "list") {
        if (!category) direct.push(this._ref(cat, { query, category: "", categoryKey: "", direct: true }));
        continue;
      }
      if (!BrowseSessions.categoryMatches(cat.title, category)) continue;
      const level = await this.browse(key, { itemKey: cat.itemKey, zoneId, count: limit });
      const items = level.items.slice(0, limit).map((it, idx) =>
        this._ref(it, { query, category: cat.title, categoryKey: cat.itemKey, index: idx })
      );
      if (items.length) groups.push({ category: cat.title, items });
      await this.browse(key, { popLevels: 1, zoneId, load: false });
    }
    if (direct.length) groups.unshift({ category: "Top", items: direct });
    return { query, groups };
  }

  _ref(item, meta) {
    const ref = String(++this.refSeq);
    this.searchRefs.set(ref, { ...meta, title: item.title, subtitle: item.subtitle, itemKey: item.itemKey, hint: item.hint });
    return { ref, ...item };
  }

  // Play a search result. Try the stored item_key first (valid while the
  // session still sits at the level it came from), otherwise replay the search
  // path by title.
  async playRef(ref, mode, zoneId) {
    const meta = this.searchRefs.get(String(ref));
    if (!meta) throw new Error("unknown search result (search again)");
    const key = meta.key || "launcher";
    try {
      return await this.playItem(key, meta.itemKey, mode, zoneId);
    } catch (e) {
      this.bridge.log("info", `playRef: direct key failed (${e.message}), replaying search`);
    }
    const root = await this.browse(key, { hierarchy: "search", input: meta.query, popAll: true, zoneId, count: 50 });
    let target = null;
    if (meta.direct) {
      target = root.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle);
    } else {
      const cat = root.items.find((i) => i.hint === "list" && i.title === meta.category);
      if (!cat) throw new Error("search category vanished");
      const level = await this.browse(key, { itemKey: cat.itemKey, zoneId, count: Math.max(50, meta.index + 5) });
      target = level.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle) || level.items[meta.index];
    }
    if (!target) throw new Error("search result vanished");
    return this.playItem(key, target.itemKey, mode, zoneId);
  }

  // Replay a search result's path inside another session (the popout's
  // browser) and drill into the item so its contents can be shown.
  async openRef(ref, { zoneId, key = "popout" } = {}) {
    const meta = this.searchRefs.get(String(ref));
    if (!meta) throw new Error("unknown search result (search again)");
    this.reset(key);
    const root = await this.browse(key, { hierarchy: "search", input: meta.query, popAll: true, zoneId, count: 50 });
    if (meta.direct) {
      const item = root.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle);
      if (!item) throw new Error("search result vanished");
      return this.browse(key, { itemKey: item.itemKey, zoneId });
    }
    const cat = root.items.find((i) => i.hint === "list" && i.title === meta.category);
    if (!cat) throw new Error("search category vanished");
    const level = await this.browse(key, { itemKey: cat.itemKey, zoneId, count: Math.max(50, meta.index + 5) });
    const item = level.items.find((i) => i.title === meta.title && i.subtitle === meta.subtitle) || level.items[meta.index];
    if (!item) throw new Error("search result vanished");
    return this.browse(key, { itemKey: item.itemKey, zoneId });
  }

  // Drill into an item until an action list appears, then run the action
  // matching `mode` (Play Now, Queue, Add Next, Start Radio...).
  async playItem(key, itemKey, mode, zoneId) {
    if (!itemKey) throw new Error("itemKey required");
    const res = await this.browse(key, { itemKey, zoneId, count: 50 });
    if (res.action === "message") return { ok: !res.isError, message: res.message };
    if (res.action !== "list") return { ok: true, message: "", action: res.action };
    let actions = res.items.filter((i) => i.hint === "action");
    if (!actions.length) {
      const al = res.items.find((i) => i.hint === "action_list");
      if (!al) return { ok: false, message: "Nothing playable here" };
      const sub = await this.browse(key, { itemKey: al.itemKey, zoneId, count: 50 });
      if (sub.action === "message") return { ok: !sub.isError, message: sub.message };
      actions = sub.items.filter((i) => i.hint === "action");
    }
    return this._runAction(key, actions, mode, zoneId);
  }

  async _runAction(key, actions, mode, zoneId) {
    if (!actions.length) return { ok: false, message: "No actions available" };
    const want = MODE_TITLES[mode || "play_now"];
    let chosen = want ? actions.find((a) => want.test(a.title)) : null;
    if (!chosen && mode === "play_now") chosen = actions.find((a) => MODE_TITLES.play.test(a.title));
    if (!chosen) chosen = actions[0];
    const r = await this.browse(key, { itemKey: chosen.itemKey, zoneId, load: false });
    const ok = r.action !== "message" || !r.isError;
    return { ok, message: r.message || chosen.title, action: chosen.title, result: r.action };
  }
}

module.exports = { BrowseSessions };
