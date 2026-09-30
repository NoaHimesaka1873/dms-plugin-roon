import QtQuick
import qs.Common
import qs.Services
import qs.Widgets
import qs.Modules.DankDash.Media
import "../services"

// Lyrics for the selected zone, through DMS's own lyrics engine and view
// (LyricsController + LyricsOverlay, DMS 1.7), from the user's enabled lyrics
// providers in their order. Roon's own lyrics are one of them: the plugin's
// "Roon" provider (lyrics-provider.js).
Item {
    id: root

    property bool live: true
    property real radius: Theme.cornerRadius

    // Roon reports its position in whole seconds as each second ticks; the
    // controller interpolates between reports on its own.
    QtObject {
        id: roonClock
        readonly property real position: RoonService._seekBase
    }

    LyricsController {
        id: roonLyrics
        enabled: available && root.live && root.visible && RoonService.hasTrack
        track: RoonService.hasTrack ? {
            key: RoonService.selectedZoneId,
            title: RoonService.title,
            artist: RoonService.rawArtist.split(" / ")[0],
            album: RoonService.album,
            length: RoonService.length
        } : null
        player: roonClock
        playing: RoonService.isPlaying
        stopped: !RoonService.hasTrack || RoonService.state === "stopped"
    }

    // Roon has only unsynced lyrics, which it keeps to its own app, and no
    // provider found any: say that instead of a bare "No results".
    readonly property bool unsyncedOnly: RoonService.roonUnsyncedOnly && (roonLyrics.state === "none" || roonLyrics.state === "error")

    LyricsOverlay {
        anchors.fill: parent
        visible: !root.unsyncedOnly
        lyrics: roonLyrics
        radius: root.radius
    }

    Column {
        anchors.centerIn: parent
        width: parent.width - Theme.spacingL * 2
        spacing: Theme.spacingS
        visible: root.unsyncedOnly

        DankIcon {
            anchors.horizontalCenter: parent.horizontalCenter
            name: "lyrics"
            size: Theme.iconSizeLarge
            color: Theme.onSurfaceVariant
        }

        StyledText {
            width: parent.width
            horizontalAlignment: Text.AlignHCenter
            wrapMode: Text.WordWrap
            text: "Roon only has unsynced lyrics for this track, and it keeps those to its own app."
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.onSurfaceVariant
        }
    }
}
