import QtQuick
import Quickshell
import Quickshell.Io
import qs.Common
import qs.Services
import qs.Modules.Plugins
import "./services"

// Daemon surface: one persistent instance. Keeps the RoonService singleton
// attached (which owns the bridge process), surfaces errors as toasts and
// exposes `dms ipc call roon ...` for compositor keybinds.
PluginComponent {
    id: root

    property var popoutService: null
    property bool _announcedPairing: false

    Component.onCompleted: RoonService.attach()
    Component.onDestruction: RoonService.detach()

    RoonBrowseModal {
        id: browseModal
    }

    Connections {
        target: RoonService

        function onBridgeError(title, detail) {
            ToastService.showError(title, detail);
        }

        function onCoreConnected() {
            if (root._announcedPairing)
                return;
            root._announcedPairing = true;
            ToastService.showInfo("Roon", "Connected to " + RoonService.coreName);
        }

        function onBrowseModalRequested() {
            browseModal.open();
        }

        function onUnauthorizedSeen() {
            ToastService.showInfo("Roon", "Enable \"DMS Roon\" in Roon → Settings → Extensions");
        }
    }

    IpcHandler {
        target: "roon"

        function playpause(): string {
            RoonService.playPause();
            return "ok";
        }
        function play(): string {
            RoonService.play();
            return "ok";
        }
        function pause(): string {
            RoonService.pause();
            return "ok";
        }
        function stop(): string {
            RoonService.stop();
            return "ok";
        }
        function next(): string {
            RoonService.next();
            return "ok";
        }
        function previous(): string {
            RoonService.previous();
            return "ok";
        }
        function seek(delta: string): string {
            const n = Number(delta);
            if (!isFinite(n))
                return "usage: seek <seconds, +/- for relative>";
            if (delta.startsWith("+") || delta.startsWith("-"))
                RoonService.seekRelative(n);
            else
                RoonService.seek(n);
            return "ok";
        }
        function volume(arg: string): string {
            const out = RoonService.primaryOutput;
            if (!out)
                return "no output";
            if (arg === "up")
                RoonService.volumeStep(out.outputId, 1);
            else if (arg === "down")
                RoonService.volumeStep(out.outputId, -1);
            else if (arg === "mute")
                RoonService.toggleMute(out.outputId);
            else if (isFinite(Number(arg)))
                RoonService.setVolume(out.outputId, Number(arg));
            else
                return "usage: volume up|down|mute|<value>";
            return "ok";
        }
        function zone(name: string): string {
            if (!name || name.trim() === "")
                return RoonService.zones.map(z => (z.zoneId === RoonService.selectedZoneId ? "* " : "  ") + z.name + " [" + z.state + "]").join("\n");
            const z = RoonService.findZoneByName(name);
            if (!z)
                return "no zone matching \"" + name + "\"";
            RoonService.selectZone(z.zoneId);
            return "selected " + z.name;
        }
        function shuffle(): string {
            RoonService.setShuffle(!RoonService.shuffle);
            return RoonService.shuffle ? "shuffle off" : "shuffle on";
        }
        function loop(): string {
            RoonService.cycleLoop();
            return "ok";
        }
        function radio(): string {
            RoonService.setRadio(!RoonService.autoRadio);
            return "ok";
        }
        function status(): string {
            return JSON.stringify({
                bridge: RoonService.bridgeState,
                connection: RoonService.connectionState,
                core: RoonService.coreName,
                zone: RoonService.selectedZone ? RoonService.selectedZone.name : "",
                state: RoonService.state,
                title: RoonService.title,
                artist: RoonService.artist,
                album: RoonService.album,
                canNext: RoonService.canNext,
                canPrevious: RoonService.canPrevious,
                queueRemaining: RoonService.queueItemsRemaining,
                position: Math.round(RoonService.position),
                length: RoonService.length,
                mpris: RoonService.mprisActive,
                lyrics: RoonService.lyricsSource,
                lyricLines: RoonService.lyricLines.length,
                lyricsSynced: RoonService.lyricsSynced,
                roonUnsyncedOnly: RoonService.roonUnsyncedOnly
            });
        }
        function popout(tab: string): string {
            const idx = ["playing", "queue", "browse", "zones"].indexOf((tab || "").toLowerCase());
            if (idx >= 0)
                PluginService.setGlobalVar("roon", "popoutTab", idx);
            RoonService.popoutRequested();
            return "ok";
        }
        function open(): string {
            if (!RoonService.roonAppAvailable)
                return "Roon app not found (install it in Bottles)";
            return RoonService.openRoonApp() ? "focused" : "launched";
        }
        function browse(): string {
            if (browseModal.shouldBeVisible) {
                browseModal.close();
                return "closed";
            }
            RoonService.openBrowser();
            return "opened";
        }
        function restart(): string {
            RoonService.restartBridge();
            return "restarting";
        }
    }
}
