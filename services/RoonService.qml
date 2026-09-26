pragma Singleton
pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import qs.Common
import qs.Services

// Plugin-local singleton shared by every Roon surface. Owns the Node bridge
// process (dist/roon-bridge.cjs), mirrors its state reactively and exposes
// the commands the UI calls. Speaks newline-delimited JSON over stdio.
Singleton {
    id: root

    readonly property string pluginId: "roon"

    // Roon desktop app via Bottles: "flatpak" | "native" | "none"
    property string bottlesKind: "none"
    property bool roonInstalled: false
    readonly property bool roonAppAvailable: roonInstalled
    readonly property string defaultAppCommand: bottlesKind === "native" ? "bottles-cli run -p Roon -b Roon" : "flatpak run --command=bottles-cli com.usebottles.bottles run -p Roon -b Roon"

    // --- wiring ---------------------------------------------------------------
    property string pluginDir: ""
    property string stateDir: ""
    property int attachCount: 0
    property bool wantRunning: false
    property bool _stopping: false
    property bool _restartRequested: false
    property int _restartDelay: 1000
    property int _nextId: 1
    property var _pending: ({})
    property var settings: ({})

    // --- bridge / connection --------------------------------------------------
    property string bridgeState: "stopped"        // stopped | starting | running | crashed
    property int bridgePid: 0
    property string connectionState: "starting"   // starting | discovering | unauthorized | paired | disconnected
    property string coreName: ""
    property string coreId: ""
    property string coreHost: ""
    property int coreHttpPort: 0
    property string statusMessage: ""
    property bool mprisAvailable: false
    property bool mprisActive: false
    property string lastError: ""
    // Lyrics Roon pushed per zone (LRC text), via the web display connection.
    property var lyricsByZone: ({})
    readonly property string lyrics: lyricsByZone[selectedZoneId] ?? ""
    // Roon only pushes synced lyrics; for anything else (unsynced, or the
    // Roon display turned off) lyrics views fall back to DMS's own lookup,
    // the one the dash Media tab uses.
    property var fallbackLyrics: null   // { key, lines, source }
    // Roon has lyrics for the track but only unsynced ones, which it doesn't send out.
    property var lyricsUnsyncedByZone: ({})
    readonly property bool roonUnsyncedOnly: !!lyricsUnsyncedByZone[selectedZoneId]
    property int _lyricsUsers: 0
    readonly property string _lyricsTrackKey: hasTrack ? [selectedZoneId, title, rawArtist, album, length].join("\u0001") : ""
    readonly property bool lyricsFromFallback: !lyrics && fallbackLyrics !== null && fallbackLyrics.key === _lyricsTrackKey && fallbackLyrics.lines.length > 0
    readonly property string lyricsSource: lyrics ? "Roon" : (lyricsFromFallback ? fallbackLyrics.source : "")
    readonly property bool lyricsLoading: !lyrics && !lyricsFromFallback && hasTrack && (lyricsFallbackTimer.running || _lyricsRequestKey !== "")
    property string _lyricsRequestKey: ""
    // [{ time, text }] sorted by time; time is -1 for unsynced lyrics.
    readonly property var lyricLines: lyrics ? parseLrc(lyrics) : (lyricsFromFallback ? fallbackLyrics.lines : [])
    readonly property bool lyricsSynced: lyricLines.length > 0 && lyricLines[0].time >= 0
    // Roon's loudness outline for the track (0..1 per slice), same source as lyrics.
    property var waveformByZone: ({})
    readonly property var waveform: waveformByZone[selectedZoneId] ?? []
    // Album-art accent from DMS, as long as the art it reads is Roon's (Roon is the active MPRIS player).
    readonly property bool artAccent: MprisController.activePlayer?.identity === "Roon"
    readonly property color accent: artAccent ? MediaAccentService.accent : Theme.primary
    readonly property color accentContainer: artAccent ? MediaAccentService.accentContainer : Theme.primaryContainer
    readonly property color onAccentContainer: artAccent ? MediaAccentService.onAccentContainer : Theme.onPrimaryContainer
    // "flat" | "wavy" | "spectrum" (Roon's waveform)
    readonly property string seekStyle: String(setting("seekStyle", "spectrum"))
    readonly property bool lyricsDisplayEnabled: !!setting("lyricsDisplayZone", true)
    readonly property bool paired: connectionState === "paired"

    // --- zones ----------------------------------------------------------------
    property var zones: []
    property var zoneById: ({})
    property string selectedZoneId: ""
    readonly property var selectedZone: zoneById[selectedZoneId] ?? null
    readonly property var outputs: selectedZone?.outputs ?? []
    readonly property var primaryOutput: outputs.length > 0 ? outputs[0] : null
    readonly property var nowPlaying: selectedZone?.nowPlaying ?? null
    readonly property bool hasTrack: nowPlaying !== null
    readonly property string state: selectedZone?.state ?? "stopped"
    readonly property bool isPlaying: state === "playing" || state === "loading"
    readonly property string title: nowPlaying?.title ?? ""
    readonly property string rawArtist: nowPlaying?.artist ?? ""
    readonly property string artist: formatArtists(rawArtist)
    readonly property string album: nowPlaying?.album ?? ""
    readonly property string imageKey: nowPlaying?.imageKey ?? ""
    readonly property int length: nowPlaying?.length ?? 0
    readonly property bool canPlay: selectedZone?.isPlayAllowed ?? false
    readonly property bool canPause: selectedZone?.isPauseAllowed ?? false
    readonly property bool canNext: selectedZone?.isNextAllowed ?? false
    readonly property bool canPrevious: selectedZone?.isPreviousAllowed ?? false
    readonly property bool canSeek: selectedZone?.isSeekAllowed ?? false
    readonly property bool shuffle: selectedZone?.settings?.shuffle ?? false
    readonly property string loop: selectedZone?.settings?.loop ?? "disabled"
    readonly property bool autoRadio: selectedZone?.settings?.autoRadio ?? false
    readonly property int queueItemsRemaining: selectedZone?.queueItemsRemaining ?? 0

    // Interpolated playback position (seconds) for the selected zone.
    property real position: 0
    property real _seekBase: 0
    property double _seekAt: 0
    property int _consumers: 0
    property string _trackKey: ""

    // --- queue / browse / search -------------------------------------------------
    property var queue: []
    property bool queueSubscribed: false
    property var browseItems: []
    property var browseList: null
    property var browseBreadcrumbs: []
    property bool browseLoading: false
    property int browseCount: 0
    property string browseHierarchy: "browse"
    property string searchQuery: ""
    property var searchGroups: []
    property bool searchLoading: false

    signal coreConnected
    signal coreDisconnected
    signal unauthorizedSeen
    signal trackChanged
    signal zoneListUpdated
    signal browseReady
    signal browseMessage(string message, bool isError)
    signal searchResultsReady
    signal bridgeError(string title, string detail)
    signal popoutRequested
    signal browseModalRequested

    // --- settings -----------------------------------------------------------------
    function setting(key, fallback) {
        const v = settings ? settings[key] : undefined;
        return v === undefined || v === null ? fallback : v;
    }

    function reloadSettings() {
        const before = settings || {};
        settings = SettingsData.getPluginSettingsForPlugin(pluginId) || {};
        if (bridgeState === "running") {
            const keys = ["connectionMode", "manualHost", "manualPort", "mprisEnabled"];
            if (keys.some(k => before[k] !== settings[k]))
                _pushSettings();
            // The display service is registered once at startup.
            if ((before.lyricsDisplayZone ?? true) !== (settings.lyricsDisplayZone ?? true))
                restartBridge();
        }
    }

    Connections {
        target: PluginService
        function onPluginDataChanged(changedPluginId) {
            if (changedPluginId === root.pluginId)
                root.reloadSettings();
        }
    }

    // --- lifecycle ----------------------------------------------------------------
    function _cleanPath(p) {
        p = String(p || "");
        if (p.startsWith("file://"))
            p = p.substring(7);
        return p;
    }

    function attach() {
        attachCount += 1;
        stopTimer.stop();
        if (!pluginDir) {
            pluginDir = _cleanPath(PluginService.getPluginPath(pluginId));
            const sp = _cleanPath(PluginService.getPluginStatePath(pluginId));
            stateDir = sp.substring(0, sp.lastIndexOf("/")) + "/roon";
        }
        reloadSettings();
        detectRoonApp();
        wantRunning = true;
        if (!bridge.running)
            startBridge();
    }

    function detach() {
        attachCount = Math.max(0, attachCount - 1);
        if (attachCount === 0)
            stopTimer.restart();
    }

    function startBridge() {
        if (!pluginDir) {
            console.warn("[roon] cannot start bridge: plugin directory unknown");
            return;
        }
        _stopping = false;
        const cmd = ["node", "--no-deprecation", pluginDir + "/dist/roon-bridge.cjs", "--state-dir", stateDir];
        if (lyricsDisplayEnabled)
            cmd.push("--display-zone");
        bridge.command = cmd;
        bridgeState = "starting";
        bridge.running = true;
        helloTimer.restart();
    }

    function stopBridge() {
        wantRunning = false;
        _stopping = true;
        restartTimer.stop();
        helloTimer.stop();
        if (bridge.running) {
            send({ type: "shutdown" });
            killTimer.restart();
        }
    }

    function restartBridge() {
        _restartDelay = 1000;
        if (bridge.running) {
            _restartRequested = true;
            _stopping = true;
            send({ type: "shutdown" });
            killTimer.restart();
        } else {
            wantRunning = true;
            startBridge();
        }
    }

    function _onExited(exitCode) {
        helloTimer.stop();
        killTimer.stop();
        const wasStopping = _stopping;
        bridgeState = wasStopping ? "stopped" : "crashed";
        bridgePid = 0;
        mprisActive = false;
        _pending = {};
        connectionState = "disconnected";
        _setZones([]);
        if (_restartRequested) {
            _restartRequested = false;
            _stopping = false;
            startBridge();
            return;
        }
        if (wantRunning && !wasStopping) {
            console.warn("[roon] bridge exited with", exitCode, "- restarting in", _restartDelay, "ms");
            restartTimer.interval = _restartDelay;
            _restartDelay = Math.min(30000, _restartDelay * 2);
            restartTimer.restart();
        }
        _stopping = false;
    }

    Timer {
        id: stopTimer
        interval: 2500
        onTriggered: if (root.attachCount === 0) root.stopBridge()
    }

    Timer {
        id: killTimer
        interval: 600
        onTriggered: bridge.running = false
    }

    Timer {
        id: restartTimer
        interval: 1000
        onTriggered: if (root.wantRunning && !bridge.running) root.startBridge()
    }

    Timer {
        id: helloTimer
        interval: 10000
        onTriggered: {
            if (root.bridgeState === "starting" && bridge.running) {
                console.warn("[roon] bridge did not say hello, restarting");
                root.restartBridge();
            }
        }
    }

    Component.onDestruction: {
        _stopping = true;
        if (bridge.running) {
            send({ type: "shutdown" });
            bridge.running = false;
        }
    }

    Process {
        id: bridge
        stdinEnabled: true
        stdout: SplitParser {
            onRead: line => root.handleLine(line)
        }
        stderr: SplitParser {
            onRead: line => {
                if (line && line.trim())
                    console.warn("[roon-bridge]", line);
            }
        }
        onExited: (exitCode, exitStatus) => root._onExited(exitCode)
    }

    // --- protocol -------------------------------------------------------------------
    function send(msg) {
        if (!bridge.running)
            return false;
        bridge.write(JSON.stringify(msg) + "\n");
        return true;
    }

    // request(msg, cb): cb(ok, data, error)
    function request(msg, cb) {
        const id = _nextId++;
        msg.id = id;
        if (cb)
            _pending[id] = cb;
        if (!send(msg)) {
            delete _pending[id];
            if (cb)
                cb(false, null, "bridge not running");
            return false;
        }
        return true;
    }

    // Fire-and-forget command whose failure becomes a toast.
    function command(msg, label) {
        request(msg, (ok, data, err) => {
            if (!ok)
                bridgeError("Roon: " + (label || msg.type) + " failed", err || "");
        });
    }

    function handleLine(line) {
        if (!line || !line.trim())
            return;
        let msg;
        try {
            msg = JSON.parse(line);
        } catch (e) {
            console.warn("[roon] unparsable bridge line:", line);
            return;
        }
        switch (msg.type) {
        case "hello":
            bridgeState = "running";
            bridgePid = msg.pid || 0;
            mprisAvailable = !!msg.mprisAvailable;
            _restartDelay = 1000;
            helloTimer.stop();
            _pushSettings();
            break;
        case "status":
            _onStatus(msg);
            break;
        case "zones":
            _setZones(msg.zones || []);
            break;
        case "zone_changed":
            _updateZone(msg.zone);
            break;
        case "seek":
            if (msg.zoneId === selectedZoneId)
                _applySeek(msg.position);
            break;
        case "queue":
            if (msg.zoneId === selectedZoneId)
                queue = msg.items || [];
            break;
        case "reply": {
            const cb = _pending[msg.id];
            if (cb) {
                delete _pending[msg.id];
                cb(!!msg.ok, msg.data, msg.error);
            }
            break;
        }
        case "mpris":
            mprisActive = !!msg.active;
            break;
        case "waveform": {
            const map = Object.assign({}, waveformByZone);
            if (msg.waveform && msg.waveform.length > 0)
                map[msg.zoneId] = msg.waveform;
            else
                delete map[msg.zoneId];
            waveformByZone = map;
            break;
        }
        case "lyrics_unsynced": {
            const map = Object.assign({}, lyricsUnsyncedByZone);
            if (msg.value)
                map[msg.zoneId] = true;
            else
                delete map[msg.zoneId];
            lyricsUnsyncedByZone = map;
            break;
        }
        case "lyrics": {
            const map = Object.assign({}, lyricsByZone);
            if (msg.lrc)
                map[msg.zoneId] = msg.lrc;
            else
                delete map[msg.zoneId];
            lyricsByZone = map;
            break;
        }
        case "error":
            lastError = msg.message || "";
            console.warn("[roon-bridge error]", msg.code, msg.message);
            if (msg.code === "uncaught" || msg.code === "handler")
                bridgeError("Roon bridge error", (msg.message || "").split("\n")[0]);
            break;
        case "log":
            if (msg.level === "error" || msg.level === "warn")
                console.warn("[roon-bridge]", msg.message);
            else
                console.log("[roon-bridge]", msg.message);
            break;
        default:
            break;
        }
    }

    function _pushSettings() {
        const mode = setting("connectionMode", "discovery");
        send({ type: "set_connection", mode: mode, host: String(setting("manualHost", "")), port: Number(setting("manualPort", 9330)) || 9330 });
        send({ type: "mpris", enabled: !!setting("mprisEnabled", true) });
        if (selectedZoneId)
            send({ type: "select_zone", zoneId: selectedZoneId });
        if (queueSubscribed && selectedZoneId)
            send({ type: "queue_subscribe", zoneId: selectedZoneId, max: 50 });
    }

    function _onStatus(msg) {
        const prev = connectionState;
        connectionState = msg.state || "disconnected";
        coreName = msg.coreName || "";
        coreId = msg.coreId || "";
        coreHost = msg.host || "";
        coreHttpPort = msg.httpPort || 0;
        statusMessage = msg.message || "";
        if (connectionState !== "paired") {
            lyricsByZone = ({});
            waveformByZone = ({});
            lyricsUnsyncedByZone = ({});
        }
        if (connectionState === "paired" && prev !== "paired")
            coreConnected();
        else if (connectionState === "disconnected" && prev === "paired")
            coreDisconnected();
        else if (connectionState === "unauthorized" && prev !== "unauthorized")
            unauthorizedSeen();
    }

    // --- zones ------------------------------------------------------------------------
    function _setZones(list) {
        const map = {};
        for (const z of list)
            map[z.zoneId] = z;
        zones = list;
        zoneById = map;
        _ensureSelection();
        _syncSelected();
        zoneListUpdated();
    }

    function _updateZone(z) {
        if (!z || !z.zoneId)
            return;
        const map = Object.assign({}, zoneById);
        map[z.zoneId] = z;
        let found = false;
        const list = zones.map(o => {
            if (o.zoneId === z.zoneId) {
                found = true;
                return z;
            }
            return o;
        });
        if (!found)
            list.push(z);
        zoneById = map;
        zones = list;
        if (z.zoneId === selectedZoneId)
            _syncSelected();
    }

    function findZoneByName(name) {
        const n = String(name || "").toLowerCase();
        if (!n)
            return null;
        return zones.find(z => z.name.toLowerCase() === n) || zones.find(z => z.name.toLowerCase().startsWith(n)) || zones.find(z => z.name.toLowerCase().includes(n)) || null;
    }

    function _ensureSelection() {
        if (zones.length === 0)
            return;
        if (selectedZoneId && zoneById[selectedZoneId]) {
            return;
        }
        let pick = findZoneByName(setting("defaultZoneName", ""));
        if (!pick) {
            const last = PluginService.loadPluginState(pluginId, "lastZoneId", "");
            if (last && zoneById[last])
                pick = zoneById[last];
        }
        if (!pick)
            pick = zones.find(z => z.state === "playing") || zones[0];
        selectZone(pick.zoneId);
    }

    function selectZone(zoneId) {
        if (!zoneId || zoneId === selectedZoneId)
            return;
        selectedZoneId = zoneId;
        queue = [];
        _trackKey = "";
        PluginService.savePluginState(pluginId, "lastZoneId", zoneId);
        send({ type: "select_zone", zoneId: zoneId });
        _syncSelected();
    }

    function _syncSelected() {
        const np = nowPlaying;
        const key = np ? (np.imageKey + "|" + np.title + "|" + np.artist) : "";
        if (np) {
            _seekBase = Number(np.position) || 0;
            _seekAt = Date.now();
            position = _seekBase;
        } else {
            _seekBase = 0;
            _seekAt = 0;
            position = 0;
        }
        if (key !== _trackKey) {
            _trackKey = key;
            trackChanged();
        }
    }

    function _applySeek(pos) {
        _seekBase = Number(pos) || 0;
        _seekAt = Date.now();
        position = _seekBase;
    }

    function acquire() {
        _consumers += 1;
    }

    function release() {
        _consumers = Math.max(0, _consumers - 1);
    }

    Timer {
        interval: 500
        repeat: true
        running: root.isPlaying && root._consumers > 0 && root._seekAt > 0
        onTriggered: {
            const p = root._seekBase + (Date.now() - root._seekAt) / 1000;
            root.position = root.length > 0 ? Math.min(root.length, p) : p;
        }
    }

    // --- art -----------------------------------------------------------------------------
    function artUrl(key, size) {
        if (!key || !coreHost || !coreHttpPort)
            return "";
        const s = size || 256;
        return "http://" + coreHost + ":" + coreHttpPort + "/api/image/" + encodeURIComponent(key) + "?scale=fit&width=" + s + "&height=" + s + "&format=image/jpeg";
    }

    function nowPlayingArtUrl(size) {
        return artUrl(imageKey, size);
    }

    // --- transport commands ------------------------------------------------------------
    function _control(action) {
        if (!selectedZoneId)
            return;
        command({ type: "control", zoneId: selectedZoneId, action: action }, action);
    }

    function playPause() {
        _control("playpause");
    }
    function play() {
        _control("play");
    }
    function pause() {
        _control("pause");
    }
    function stop() {
        _control("stop");
    }
    function next() {
        _control("next");
    }
    function previous() {
        _control("previous");
    }

    function seek(seconds) {
        if (!selectedZoneId)
            return;
        _applySeek(seconds);
        command({ type: "seek", zoneId: selectedZoneId, how: "absolute", seconds: Math.round(seconds) }, "seek");
    }

    function seekRelative(delta) {
        if (!selectedZoneId)
            return;
        _applySeek(Math.max(0, position + delta));
        command({ type: "seek", zoneId: selectedZoneId, how: "relative", seconds: Math.round(delta) }, "seek");
    }

    function findOutput(outputId) {
        for (const z of zones)
            for (const o of z.outputs || [])
                if (o.outputId === outputId)
                    return o;
        return null;
    }

    function setVolume(outputId, value) {
        command({ type: "volume", outputId: outputId, how: "absolute", value: value }, "volume");
    }

    function volumeStep(outputId, dir) {
        const out = findOutput(outputId);
        if (!out || !out.volume)
            return;
        if (out.volume.type === "incremental")
            command({ type: "volume", outputId: outputId, how: "relative", value: dir > 0 ? 1 : -1 }, "volume");
        else
            command({ type: "volume", outputId: outputId, how: "relative_step", value: (dir > 0 ? 1 : -1) * Number(setting("wheelVolumeStep", 2)) }, "volume");
    }

    function toggleMute(outputId) {
        command({ type: "mute", outputId: outputId, how: "toggle" }, "mute");
    }

    function setShuffle(on) {
        if (!selectedZoneId)
            return;
        command({ type: "settings", zoneId: selectedZoneId, shuffle: !!on }, "shuffle");
    }

    function cycleLoop() {
        if (!selectedZoneId)
            return;
        command({ type: "settings", zoneId: selectedZoneId, loop: "next" }, "loop");
    }

    function setRadio(on) {
        if (!selectedZoneId)
            return;
        command({ type: "settings", zoneId: selectedZoneId, autoRadio: !!on }, "radio");
    }

    function transferTo(zoneId) {
        if (!selectedZoneId || !zoneId)
            return;
        command({ type: "transfer", fromZoneId: selectedZoneId, toZoneId: zoneId }, "transfer");
    }

    function groupOutputs(outputIds) {
        command({ type: "group", outputIds: outputIds }, "group");
    }

    function ungroupOutputs(outputIds) {
        command({ type: "ungroup", outputIds: outputIds }, "ungroup");
    }

    // --- queue -------------------------------------------------------------------------
    // Refcounted: the popout and dash queue views come and go independently.
    property int _queueUsers: 0

    function subscribeQueue() {
        _queueUsers += 1;
        if (queueSubscribed)
            return;
        queueSubscribed = true;
        if (selectedZoneId)
            send({ type: "queue_subscribe", zoneId: selectedZoneId, max: 50 });
    }

    function unsubscribeQueue() {
        _queueUsers = Math.max(0, _queueUsers - 1);
        if (_queueUsers > 0 || !queueSubscribed)
            return;
        queueSubscribed = false;
        send({ type: "queue_unsubscribe" });
        queue = [];
    }

    function playFromHere(queueItemId) {
        if (!selectedZoneId)
            return;
        command({ type: "play_from_here", zoneId: selectedZoneId, queueItemId: queueItemId }, "play from queue");
    }

    // --- browse (popout session) --------------------------------------------------------
    function _browseRequest(msg) {
        browseLoading = true;
        msg.type = msg.type || "browse";
        msg.session = "popout";
        if (selectedZoneId)
            msg.zoneId = selectedZoneId;
        request(msg, (ok, data, err) => {
            browseLoading = false;
            if (!ok) {
                bridgeError("Roon browse failed", err || "");
                return;
            }
            _onBrowse(data);
        });
    }

    function _onBrowse(data) {
        if (!data)
            return;
        if (data.action === "list") {
            browseItems = data.items || [];
            browseList = data.list;
            browseBreadcrumbs = data.breadcrumbs || [];
            browseCount = data.list ? data.list.count : browseItems.length;
            browseHierarchy = data.hierarchy || browseHierarchy;
        } else if (data.action === "message") {
            browseMessage(data.message || "", !!data.isError);
        } else if (data.action === "none") {
            // An action ran (e.g. Play Now); refresh the current level.
            _browseRequest({ refresh: true });
            return;
        }
        browseReady();
    }

    function browseHome() {
        browseHierarchy = "browse";
        _browseRequest({ hierarchy: "browse", popAll: true });
    }

    function browseHierarchyRoot(hierarchy) {
        browseHierarchy = hierarchy;
        _browseRequest({ hierarchy: hierarchy, popAll: true });
    }

    function browseItem(itemKey) {
        _browseRequest({ itemKey: itemKey });
    }

    function browseInput(itemKey, text) {
        _browseRequest({ itemKey: itemKey, input: text });
    }

    function browseBack() {
        if (browseBreadcrumbs.length <= 1) {
            browseHome();
            return;
        }
        _browseRequest({ popLevels: 1 });
    }

    function browseRefresh() {
        _browseRequest({ refresh: true });
    }

    function browseSearch(text) {
        browseHierarchy = "search";
        _browseRequest({ hierarchy: "search", input: text, popAll: true });
    }

    function loadMore() {
        if (browseLoading || browseItems.length >= browseCount)
            return;
        browseLoading = true;
        request({ type: "load", session: "popout", offset: browseItems.length, count: 100 }, (ok, data, err) => {
            browseLoading = false;
            if (ok && data)
                browseItems = browseItems.concat(data.items || []);
        });
    }

    // Play something from the popout browser without navigating the UI into it.
    function playBrowseItem(itemKey, mode) {
        request({ type: "play_item", session: "popout", itemKey: itemKey, mode: mode || "play_now", zoneId: selectedZoneId }, (ok, data, err) => {
            if (!ok)
                bridgeError("Roon play failed", err || "");
            else if (data && data.message)
                browseMessage(data.message, !data.ok);
            browseRefresh();
        });
    }

    // --- search (launcher session) ------------------------------------------------------
    function search(query, category) {
        searchQuery = query;
        searchLoading = true;
        request({ type: "search", session: "launcher", query: query, category: category || "", limit: 8, zoneId: selectedZoneId }, (ok, data, err) => {
            if (data && data.query !== searchQuery)
                return;
            searchLoading = false;
            searchGroups = ok && data ? (data.groups || []) : [];
            if (!ok)
                bridgeError("Roon search failed", err || "");
            searchResultsReady();
        });
    }

    function playRef(ref, mode, cb) {
        request({ type: "play_item", ref: ref, mode: mode || "play_now", zoneId: selectedZoneId }, (ok, data, err) => {
            if (!ok)
                bridgeError("Roon play failed", err || "");
            if (cb)
                cb(ok, data, err);
        });
    }

    // Open a search result (album, artist, playlist...) in the popout's browser.
    function openRef(ref) {
        browseLoading = true;
        request({ type: "open_item", ref: ref, session: "popout", zoneId: selectedZoneId }, (ok, data, err) => {
            browseLoading = false;
            if (!ok) {
                bridgeError("Roon browse failed", err || "");
                return;
            }
            _onBrowse(data);
            browseModalRequested();
        });
    }

    function openBrowser() {
        if (browseItems.length === 0 && paired)
            browseHome();
        browseModalRequested();
    }

    // --- misc ---------------------------------------------------------------------------
    function forgetCore() {
        send({ type: "forget_core" });
    }

    function detectRoonApp() {
        const script = 'if flatpak info com.usebottles.bottles >/dev/null 2>&1; then echo bottles=flatpak; elif command -v bottles-cli >/dev/null 2>&1; then echo bottles=native; else echo bottles=none; fi; ' +
            'for d in "$HOME/.var/app/com.usebottles.bottles/data/bottles/bottles/Roon" "${XDG_DATA_HOME:-$HOME/.local/share}/bottles/bottles/Roon"; do ' +
            'if [ -f "$d/bottle.yml" ] && ls "$d"/drive_c/users/*/AppData/Local/Roon/Application/Roon.exe >/dev/null 2>&1; then echo roon=1; break; fi; done';
        Proc.runCommand("roon.detectApp", ["sh", "-c", script], (stdout, exitCode) => {
            const out = String(stdout || "");
            const m = out.match(/bottles=(\w+)/);
            bottlesKind = m ? m[1] : "none";
            roonInstalled = out.indexOf("roon=1") !== -1;
        }, 0, 15000);
    }

    function installRoonApp() {
        if (bottlesKind === "none" || !pluginDir)
            return false;
        Quickshell.execDetached(["sh", pluginDir + "/assets/install-roon-bottles.sh", bottlesKind]);
        return true;
    }

    function openRoonApp() {
        const title = String(setting("roonWindowTitle", "Roon") || "Roon");
        try {
            if (CompositorService.isNiri) {
                const wins = NiriService.windows || [];
                const w = wins.find(x => x.title === title) || wins.find(x => x.title && x.title.startsWith(title));
                if (w) {
                    NiriService.focusWindow(w.id);
                    return true;
                }
            } else if (CompositorService.isHyprland) {
                const wins = HyprlandService.windows || [];
                const w = wins.find(x => x.title === title);
                if (w && (w.address || w.id)) {
                    HyprlandService.focusWindow(w.address || w.id);
                    return true;
                }
            }
        } catch (e) {
            console.warn("[roon] window focus failed:", e);
        }
        const cmd = String(setting("roonAppCommand", "") || defaultAppCommand);
        Quickshell.execDetached(["sh", "-c", cmd]);
        return false;
    }

    function parseLrc(text) {
        if (!text)
            return [];
        const synced = [];
        const plain = [];
        for (const raw of String(text).split("\n")) {
            const stamps = [];
            let rest = raw;
            let m;
            while ((m = /^\s*\[(\d+):(\d+(?:[.:]\d+)?)\]/.exec(rest)) !== null) {
                stamps.push(Number(m[1]) * 60 + Number(m[2].replace(":", ".")));
                rest = rest.substring(m[0].length);
            }
            const line = rest.replace(/<\d+:\d+(?:[.:]\d+)?>/g, "").trim();
            if (stamps.length === 0) {
                if (!/^\s*\[[a-z]+:.*\]\s*$/i.test(raw) && line)
                    plain.push({ time: -1, text: line });
                continue;
            }
            for (const t of stamps)
                synced.push({ time: t, text: line });
        }
        if (synced.length > 0)
            return synced.sort((a, b) => a.time - b.time);
        return plain;
    }

    function acquireLyrics() {
        _lyricsUsers += 1;
        lyricsFallbackTimer.restart();
    }

    function releaseLyrics() {
        _lyricsUsers = Math.max(0, _lyricsUsers - 1);
    }

    on_LyricsTrackKeyChanged: lyricsFallbackTimer.restart()
    onLyricsChanged: lyricsFallbackTimer.restart()

    // Give Roon a moment to push its LRC (it follows the track change within
    // milliseconds) before asking DMS.
    Timer {
        id: lyricsFallbackTimer
        interval: 1200
        onTriggered: root._fetchFallbackLyrics()
    }

    function _fetchFallbackLyrics() {
        const key = _lyricsTrackKey;
        if (lyrics || !key || _lyricsUsers === 0 || _lyricsRequestKey === key || (fallbackLyrics && fallbackLyrics.key === key))
            return;
        if (!DMSService.isConnected)
            return;
        _lyricsRequestKey = key;
        const providers = MediaOptions.enabledLyricsProviders;
        DMSService.sendRequest("lyrics.get", {
            "title": title,
            "artist": rawArtist.split(" / ")[0],
            "album": album,
            "duration": length,
            "fileUrl": "",
            "allowNetwork": providers.length > 0,
            "providers": providers
        }, response => {
            if (root._lyricsRequestKey === key)
                root._lyricsRequestKey = "";
            const r = response && !response.error ? response.result : null;
            let lines = [];
            if (r && r.found && !r.instrumental) {
                lines = (r.synced || []).filter(l => Number.isFinite(l.t) && typeof l.x === "string").map(l => ({
                            time: l.t,
                            text: l.x
                        }));
                if (lines.length === 0)
                    lines = String(r.plain || "").split("\n").map(t => t.trim()).filter(t => t.length > 0).map(t => ({
                                time: -1,
                                text: t
                            }));
            }
            root.fallbackLyrics = {
                key: key,
                lines: lines,
                source: r && r.attribution && r.attribution.name ? r.attribution.name : ""
            };
        });
    }

    // Playback position right now, interpolated from the last seek report.
    function currentPosition() {
        if (!_seekAt)
            return _seekBase;
        const p = _seekBase + (isPlaying ? (Date.now() - _seekAt) / 1000 : 0);
        return length > 0 ? Math.min(length, p) : p;
    }

    // Roon joins credits with " / "; show them as a natural list instead.
    function formatArtists(raw) {
        const parts = String(raw || "").split(" / ").map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length <= 1)
            return parts.join("");
        return parts.join(", ");
    }

    function formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds || 0));
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const ss = String(s % 60).padStart(2, "0");
        if (h > 0)
            return h + ":" + String(m % 60).padStart(2, "0") + ":" + ss;
        return m + ":" + ss;
    }

    function pillText() {
        if (!hasTrack)
            return "";
        const fmt = setting("pillFormat", "title-artist");
        if (fmt === "title" || !artist)
            return title;
        if (fmt === "artist-title")
            return artist + " – " + title;
        return title + " • " + artist;
    }
}
