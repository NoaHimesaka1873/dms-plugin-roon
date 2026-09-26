import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Lyrics for the selected zone: Roon's synced lyrics, else DMS's own lookup.
// Synced lyrics follow playback and keep the current line centered; unsynced
// ones are a plain scrolling list.
Item {
    id: root

    property bool live: true
    property color textColor: Theme.surfaceText
    property color mutedColor: Theme.surfaceVariantText
    property color accentColor: Theme.primary
    property int fontSize: Theme.fontSizeLarge

    readonly property var lines: RoonService.lyricLines
    readonly property bool synced: RoonService.lyricsSynced
    property int currentIndex: -1
    readonly property bool wanting: live && visible

    onWantingChanged: wanting ? RoonService.acquireLyrics() : RoonService.releaseLyrics()
    Component.onDestruction: {
        if (wanting)
            RoonService.releaseLyrics();
    }

    function indexAt(t) {
        let lo = 0;
        let hi = lines.length - 1;
        let found = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (lines[mid].time <= t) {
                found = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return found;
    }

    function sync() {
        currentIndex = synced ? indexAt(RoonService.currentPosition() + 0.15) : -1;
    }

    // Center the current line, unless the user is scrolling by hand.
    function follow(animate) {
        if (!synced || currentIndex < 0 || list.moving)
            return;
        const item = list.itemAtIndex(currentIndex);
        if (!item) {
            list.positionViewAtIndex(currentIndex, ListView.Center);
            return;
        }
        const max = list.originY + Math.max(0, list.contentHeight - list.height);
        const target = Math.max(list.originY, Math.min(max, item.y + item.height / 2 - list.height / 2));
        scrollAnim.stop();
        if (!animate) {
            list.contentY = target;
            return;
        }
        scrollAnim.to = target;
        scrollAnim.start();
    }

    onLiveChanged: {
        if (!live)
            return;
        sync();
        Qt.callLater(() => root.follow(false));
    }
    onCurrentIndexChanged: follow(true)
    onHeightChanged: follow(false)
    onLinesChanged: {
        scrollAnim.stop();
        list.positionViewAtBeginning();
        sync();
        Qt.callLater(() => root.follow(false));
    }

    Timer {
        interval: 150
        repeat: true
        running: root.live && root.visible && root.synced && RoonService.isPlaying
        onTriggered: root.sync()
    }

    Connections {
        target: RoonService
        enabled: root.live && root.synced
        function onPositionChanged() {
            root.sync();
        }
    }

    NumberAnimation {
        id: scrollAnim
        target: list
        property: "contentY"
        duration: Theme.mediumDuration
        easing.type: Easing.OutCubic
    }

    ListView {
        id: list
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        anchors.bottom: sourceLabel.visible ? sourceLabel.top : parent.bottom
        anchors.bottomMargin: sourceLabel.visible ? Theme.spacingXS : 0
        clip: true
        visible: root.lines.length > 0
        model: root.lines
        spacing: Theme.spacingS
        boundsBehavior: Flickable.StopAtBounds
        onMovementEnded: root.follow(true)
        header: Item {
            width: list.width
            height: root.synced ? list.height / 2 - Theme.fontSizeLarge : 0
        }
        footer: Item {
            width: list.width
            height: root.synced ? list.height / 2 - Theme.fontSizeLarge : 0
        }

        delegate: StyledText {
            required property var modelData
            required property int index
            readonly property bool current: index === root.currentIndex
            readonly property bool past: root.synced && index < root.currentIndex

            width: list.width
            text: modelData.text || "♪"
            wrapMode: Text.WordWrap
            font.pixelSize: root.fontSize
            font.weight: current ? Font.Bold : Font.Medium
            color: current || !root.synced ? root.textColor : root.mutedColor
            opacity: past ? 0.6 : 1

            Behavior on color {
                ColorAnimation {
                    duration: Theme.shortDuration
                }
            }

            MouseArea {
                anchors.fill: parent
                enabled: root.synced && RoonService.canSeek
                cursorShape: enabled ? Qt.PointingHandCursor : Qt.ArrowCursor
                onClicked: RoonService.seek(parent.modelData.time)
            }
        }
    }

    Column {
        anchors.centerIn: parent
        width: parent.width - Theme.spacingL * 2
        spacing: Theme.spacingS
        visible: root.lines.length === 0

        DankIcon {
            anchors.horizontalCenter: parent.horizontalCenter
            name: RoonService.lyricsLoading ? "hourglass_empty" : "lyrics"
            size: Theme.iconSizeLarge
            color: root.accentColor
        }

        StyledText {
            width: parent.width
            horizontalAlignment: Text.AlignHCenter
            wrapMode: Text.WordWrap
            text: {
                if (!RoonService.hasTrack)
                    return "Nothing playing";
                if (RoonService.lyricsLoading)
                    return "Looking for lyrics…";
                if (RoonService.roonUnsyncedOnly)
                    return "Roon only has unsynced lyrics for this track, and it keeps those to its own app";
                return "No lyrics for this track";
            }
            font.pixelSize: Theme.fontSizeSmall
            color: root.mutedColor
        }
    }

    StyledText {
        id: sourceLabel
        anchors.bottom: parent.bottom
        width: parent.width
        visible: root.lines.length > 0 && RoonService.lyricsSource !== "" && RoonService.lyricsSource !== "Roon"
        text: "Lyrics from " + RoonService.lyricsSource
        font.pixelSize: Theme.fontSizeSmall
        color: root.mutedColor
        elide: Text.ElideRight
        wrapMode: Text.NoWrap
    }
}
