import QtQuick
import Quickshell
import qs.Common
import qs.Services
import "./services"

// Launcher surface: `roon <query>` searches the Roon library; `roon` alone
// shows transport shortcuts and zones.
QtObject {
    id: root

    property var pluginService: null
    property string pluginId: "roon"
    property string trigger: "roon"
    property string currentCategory: ""
    property string pendingQuery: "\x00"
    property string lastSentQuery: "\x00"

    signal itemsChanged

    property Timer searchDebounce: Timer {
        interval: 350
        repeat: false
        onTriggered: {
            if (root.pendingQuery === root.lastSentQuery)
                return;
            root.lastSentQuery = root.pendingQuery;
            if (root.pendingQuery)
                RoonService.search(root.pendingQuery, root.currentCategory);
        }
    }

    property Connections roonConn: Connections {
        target: RoonService

        function onSearchResultsReady() {
            root.requestUpdate();
        }

        function onZoneListUpdated() {
            root.requestUpdate();
        }

        function onTrackChanged() {
            root.requestUpdate();
        }
    }

    function requestUpdate() {
        if (pluginService && typeof pluginService.requestLauncherUpdate === "function")
            pluginService.requestLauncherUpdate(pluginId);
    }

    Component.onCompleted: {
        if (pluginService)
            trigger = pluginService.loadPluginData(pluginId, "trigger", "roon");
    }

    function getCategories() {
        return [
            { id: "", name: "All", searchTerm: "" },
            { id: "albums", name: "Albums", searchTerm: "" },
            { id: "artists", name: "Artists", searchTerm: "" },
            { id: "tracks", name: "Tracks", searchTerm: "" },
            { id: "playlists", name: "Playlists", searchTerm: "" },
            { id: "radio", name: "Radio", searchTerm: "" },
            { id: "composers", name: "Composers", searchTerm: "" }
        ];
    }

    function setCategory(categoryId) {
        if (currentCategory === categoryId)
            return;
        currentCategory = categoryId;
        lastSentQuery = "\x00";
        searchDebounce.restart();
    }

    function iconFor(category, hint) {
        const c = (category || "").toLowerCase();
        if (c.includes("album"))
            return "material:album";
        if (c.includes("artist"))
            return "material:person";
        if (c.includes("track"))
            return "material:music_note";
        if (c.includes("playlist"))
            return "material:queue_music";
        if (c.includes("radio"))
            return "material:radio";
        if (c.includes("composer"))
            return "material:piano";
        if (c.includes("genre"))
            return "material:category";
        return hint === "action" ? "material:play_arrow" : "material:library_music";
    }

    function shortcutItems() {
        const items = [];
        const zone = RoonService.selectedZone;
        if (!RoonService.paired) {
            items.push({
                name: RoonService.connectionState === "unauthorized" ? "Enable DMS Roon in Roon → Settings → Extensions" : "Roon is not connected",
                icon: "material:cloud_off",
                comment: RoonService.statusMessage,
                action: RoonService.roonAppAvailable ? "roon-cmd:open" : "none",
                categories: ["Roon"],
                _preScored: 1000
            });
            return items;
        }
        if (RoonService.hasTrack) {
            items.push({
                name: RoonService.title,
                icon: "material:album",
                comment: (RoonService.artist ? RoonService.artist + " • " : "") + (zone ? zone.name : ""),
                action: "roon-cmd:popout",
                categories: ["Now Playing"],
                imageUrl: RoonService.nowPlayingArtUrl(128),
                _preScored: 1000
            });
        }
        items.push({
            name: RoonService.isPlaying ? "Pause" : "Play",
            icon: RoonService.isPlaying ? "material:pause" : "material:play_arrow",
            comment: zone ? zone.name : "",
            action: "roon-cmd:playpause",
            categories: ["Roon"],
            _preScored: 990
        });
        items.push({ name: "Next track", icon: "material:skip_next", comment: "", action: "roon-cmd:next", categories: ["Roon"], _preScored: 980 });
        items.push({ name: "Previous track", icon: "material:skip_previous", comment: "", action: "roon-cmd:previous", categories: ["Roon"], _preScored: 970 });
        items.push({ name: "Browse library", icon: "material:library_music", comment: "Open the Roon library browser", action: "roon-cmd:browse", categories: ["Roon"], _preScored: 965 });
        if (RoonService.roonAppAvailable)
            items.push({ name: "Open Roon", icon: "material:open_in_new", comment: "Focus or launch the Roon app", action: "roon-cmd:open", categories: ["Roon"], _preScored: 960 });
        RoonService.zones.forEach((z, i) => {
            items.push({
                name: (z.zoneId === RoonService.selectedZoneId ? "● " : "") + z.name,
                icon: "material:speaker",
                comment: z.nowPlaying ? z.state + " • " + z.nowPlaying.title + " — " + RoonService.formatArtists(z.nowPlaying.artist) : z.state,
                action: "roon-zone:" + z.zoneId,
                categories: ["Zones"],
                _preScored: 900 - i
            });
        });
        return items;
    }

    function getItems(query) {
        const q = (query || "").trim();
        if (!q) {
            pendingQuery = "";
            return shortcutItems();
        }
        if (q !== pendingQuery) {
            pendingQuery = q;
            searchDebounce.restart();
        }
        if (!RoonService.paired) {
            return shortcutItems();
        }
        if (RoonService.searchLoading || q !== lastSentQuery || RoonService.searchQuery !== q) {
            return [{
                name: "Searching Roon…",
                icon: "material:hourglass_empty",
                comment: q,
                action: "none",
                categories: ["Roon"],
                _preScored: 1
            }];
        }
        const items = [];
        let rank = 1000;
        for (const group of RoonService.searchGroups) {
            for (const it of group.items) {
                const opens = it.hint === "list";
                items.push({
                    name: it.title,
                    icon: iconFor(group.category, it.hint),
                    comment: (it.subtitle ? it.subtitle + " · " : "") + group.category + (opens ? " · Enter to open" : ""),
                    action: (opens ? "roon-open:" : "roon-ref:") + it.ref,
                    categories: [group.category],
                    keywords: [q],
                    imageUrl: it.artUrl || "",
                    _preScored: rank--
                });
            }
        }
        if (items.length === 0) {
            return [{
                name: "No results for \"" + q + "\"",
                icon: "material:search_off",
                comment: "Try another search",
                action: "none",
                categories: ["Roon"],
                _preScored: 1
            }];
        }
        return items;
    }

    function runCommand(cmd) {
        switch (cmd) {
        case "playpause":
            RoonService.playPause();
            break;
        case "next":
            RoonService.next();
            break;
        case "previous":
            RoonService.previous();
            break;
        case "open":
            RoonService.openRoonApp();
            break;
        case "popout":
            RoonService.popoutRequested();
            break;
        case "browse":
            RoonService.openBrowser();
            break;
        default:
            break;
        }
    }

    function playRef(ref, mode) {
        const zone = RoonService.selectedZone;
        RoonService.playRef(ref, mode, (ok, data) => {
            if (ok)
                ToastService.showInfo("Roon", (data && data.action ? data.action : "Playing") + (zone ? " on " + zone.name : ""));
        });
    }

    function executeItem(item) {
        if (!item || !item.action || item.action === "none")
            return;
        if (item.action.startsWith("roon-cmd:")) {
            runCommand(item.action.substring(9));
            return;
        }
        if (item.action.startsWith("roon-zone:")) {
            RoonService.selectZone(item.action.substring(10));
            return;
        }
        if (item.action.startsWith("roon-open:")) {
            RoonService.openRef(item.action.substring(10));
            return;
        }
        if (item.action.startsWith("roon-ref:")) {
            playRef(item.action.substring(9), "play_now");
        }
    }

    function getContextMenuActions(item) {
        if (!item || !item.action)
            return [];
        const isOpen = item.action.startsWith("roon-open:");
        if (!isOpen && !item.action.startsWith("roon-ref:"))
            return [];
        const ref = item.action.substring(isOpen ? 10 : 9);
        return [
            { icon: "library_music", text: "Open", closeLauncher: true, action: () => RoonService.openRef(ref) },
            { icon: "play_arrow", text: "Play Now", closeLauncher: true, action: () => root.playRef(ref, "play_now") },
            { icon: "playlist_add", text: "Queue", closeLauncher: true, action: () => root.playRef(ref, "queue") },
            { icon: "playlist_play", text: "Add Next", closeLauncher: true, action: () => root.playRef(ref, "add_next") },
            { icon: "radio", text: "Start Radio", closeLauncher: true, action: () => root.playRef(ref, "start_radio") }
        ];
    }
}
