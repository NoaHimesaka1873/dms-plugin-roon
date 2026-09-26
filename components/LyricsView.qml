import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.DankDash
import "../services"

// Lyrics for the selected zone: Roon's synced lyrics, else DMS's own lookup.
// Follows the dash Media tab's lyrics view (LyricsOverlay/LyricsVocal):
// centered lines at one lead size, the current one in the lyrics accent,
// neighbours scaled down and faded. Line heights snap and only the text scale
// animates, so following never fights a moving layout. Scrolling by hand
// shows every line; "Follow playback" goes back.
Item {
    id: root

    property bool live: true
    property color textColor: Theme.surfaceText
    property color mutedColor: Theme.onSurfaceVariant
    property color accentColor: Theme.primary
    property color lyricsColor: RoonService.lyricsAccent

    readonly property var lines: RoonService.lyricLines
    readonly property bool synced: RoonService.lyricsSynced
    readonly property bool wanting: live && visible
    readonly property bool animationsEnabled: !SettingsData.reduceMotion && Theme.currentAnimationSpeed !== SettingsData.AnimationSpeed.None
    // Same sizing rule as the Media tab (DashMetrics lyricsLead*Divisor).
    readonly property real leadFontSize: Math.round(Math.max(Theme.fontSizeXLarge, Math.min(Theme.fontSizeDisplay, list.height / 12, list.width / 11)))

    property int currentIndex: -1
    property bool following: true
    property bool followSnap: false
    property Item followedItem: null
    property real followedY: 0
    readonly property bool userScrolling: list.isUserScrolling || list.dragging
    readonly property real currentLineY: list.currentItem?.y ?? 0

    onWantingChanged: {
        if (!wanting) {
            RoonService.releaseLyrics();
            return;
        }
        RoonService.acquireLyrics();
        sync();
        snapToCurrent();
        // The tab was hidden, so the list may not be laid out yet; snap again once it is.
        settleSnap.restart();
    }
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

    function browse() {
        following = false;
        followMotion.stop();
    }

    function snapToCurrent() {
        followSnap = true;
        followTimer.restart();
    }

    // DankListView sets isUserScrolling on every wheel event but only clears it
    // when a drag/flick ends, so after a wheel scroll it would stay true and the
    // next scroll would never register. Clear it whenever following resumes.
    function resume() {
        list.stopMomentum();
        list.isUserScrolling = false;
        following = true;
        sync();
        followTimer.restart();
    }

    // Work out where the list has to be with the current line centered (on the
    // final layout), then animate there from where it is now.
    function followCurrent() {
        const snap = followSnap;
        followSnap = false;
        if (!synced || !following || list.count === 0)
            return;
        followMotion.stop();
        list.stopMomentum();
        list.isUserScrolling = false;
        const previous = list.contentY;
        list.currentIndex = Math.max(0, currentIndex);
        list.forceLayout();
        list.positionViewAtIndex(list.currentIndex, ListView.Center);
        if (list.currentItem && list.currentItem.height > list.height)
            list.positionViewAtIndex(list.currentIndex, ListView.Beginning);
        const target = Math.round(list.contentY);
        followedItem = list.currentItem;
        followedY = followedItem?.y ?? 0;
        if (snap || !animationsEnabled || Math.abs(target - previous) > list.height)
            return;
        list.contentY = previous;
        followMotion.from = previous;
        followMotion.to = target;
        followMotion.restart();
    }

    onCurrentIndexChanged: followTimer.restart()
    onSyncedChanged: followTimer.restart()
    onWidthChanged: snapToCurrent()
    onHeightChanged: snapToCurrent()
    onUserScrollingChanged: {
        if (userScrolling && synced)
            browse();
    }
    onLinesChanged: {
        following = true;
        followMotion.stop();
        list.stopMomentum();
        list.isUserScrolling = false;
        // DankListView jumps back to its last user-scroll position on a model change.
        list.savedY = 0;
        list.positionViewAtBeginning();
        sync();
        snapToCurrent();
    }
    // A line above the current one changed size: keep the current line where it is.
    onCurrentLineYChanged: {
        if (!followedItem || list.currentItem !== followedItem || list.currentIndex !== Math.max(0, currentIndex))
            return;
        const shift = currentLineY - followedY;
        followedY = currentLineY;
        if (shift === 0 || !following)
            return;
        if (followMotion.running) {
            followTimer.restart();
            return;
        }
        list.contentY = Math.max(list.originY, Math.min(list.maximumContentY, list.contentY + shift));
    }

    Timer {
        id: settleSnap
        interval: 150
        onTriggered: root.snapToCurrent()
    }

    Timer {
        id: followTimer
        interval: 0
        onTriggered: root.followCurrent()
    }

    Timer {
        interval: 100
        repeat: true
        running: root.wanting && root.synced && RoonService.isPlaying
        onTriggered: root.sync()
    }

    Connections {
        target: RoonService
        enabled: root.wanting && root.synced
        function onPositionChanged() {
            root.sync();
        }
    }

    NumberAnimation {
        id: followMotion
        target: list
        property: "contentY"
        duration: Theme.expressiveDurations.expressiveDefaultSpatial
        easing.type: Easing.BezierSpline
        easing.bezierCurve: Theme.expressiveCurves.expressiveEffects
    }

    StyledText {
        id: heading
        anchors.top: parent.top
        width: parent.width
        horizontalAlignment: Text.AlignHCenter
        visible: root.lines.length > 0 && !root.synced && root.height >= Theme.listItemTwoLineHeight * 2
        text: "Unsynced"
        font.pixelSize: Theme.fontSizeSmall
        color: root.mutedColor
    }

    DankListView {
        id: list
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: heading.visible ? heading.bottom : parent.top
        anchors.topMargin: heading.visible ? Theme.spacingS : 0
        anchors.bottom: followButton.visible ? followButton.top : parent.bottom
        anchors.bottomMargin: followButton.visible ? Theme.spacingS : 0
        clip: true
        visible: root.lines.length > 0
        reuseItems: true
        spacing: Theme.spacingXXS
        model: root.lines
        add: null
        remove: null
        displaced: null
        move: null
        onCountChanged: followTimer.restart()
        onHeightChanged: root.snapToCurrent()
        onVisibleChanged: {
            if (visible)
                root.snapToCurrent();
        }
        header: Item {
            width: list.width
            height: root.synced ? list.height / 3 : Theme.spacingS
        }
        footer: Item {
            width: list.width
            height: Math.max(root.synced ? list.height / 3 : Theme.spacingS, credit.implicitHeight + Theme.spacingM * 2)

            StyledText {
                id: credit
                anchors.top: parent.top
                anchors.topMargin: Theme.spacingM
                anchors.horizontalCenter: parent.horizontalCenter
                width: Math.min(implicitWidth, parent.width)
                visible: RoonService.lyricsSource !== "" && RoonService.lyricsSource !== "Roon"
                text: RoonService.lyricsSource
                color: Theme.outline
                font.pixelSize: Theme.fontSizeSmall
                elide: Text.ElideRight
            }
        }

        delegate: Item {
            id: lyric
            required property var modelData
            required property int index
            readonly property int distance: Math.abs(index - Math.max(0, root.currentIndex))
            readonly property bool highlighted: root.synced && index === root.currentIndex
            readonly property bool emphasize: root.synced && root.following
            readonly property int reach: distance === 0 ? 0 : Math.max(1, distance)
            readonly property real textScale: reach === 0 || !emphasize ? 1 : reach === 1 ? (Theme.fontSizeMedium + Theme.fontSizeLarge) / (Theme.fontSizeXLarge * 2) : Theme.fontSizeSmall / Theme.fontSizeXLarge

            width: list.width
            height: Math.ceil(line.implicitHeight * textScale) + Theme.spacingS
            opacity: reach === 0 || !emphasize ? 1 : reach === 1 ? DashMetrics.lyricsNearOpacity : reach === 2 ? DashMetrics.lyricsFarOpacity : 0

            Behavior on opacity {
                enabled: root.animationsEnabled
                NumberAnimation {
                    duration: Theme.expressiveDurations.expressiveEffects
                    easing.type: Easing.BezierSpline
                    easing.bezierCurve: Theme.expressiveCurves.expressiveEffects
                }
            }

            StyledText {
                id: line
                anchors.centerIn: parent
                width: parent.width
                text: lyric.modelData.text || " "
                color: lyric.highlighted ? root.lyricsColor : root.mutedColor
                font.pixelSize: !lyric.emphasize ? Math.round(root.leadFontSize * Theme.fontSizeLarge / Theme.fontSizeXLarge) : root.leadFontSize
                font.weight: root.synced ? Theme.fontWeightBold : Theme.fontWeightMedium
                scale: lyric.textScale
                transformOrigin: Item.Center
                lineHeight: DashMetrics.lyricsLineHeight
                horizontalAlignment: Text.AlignHCenter
                wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                elide: Text.ElideNone

                Behavior on color {
                    enabled: root.animationsEnabled
                    ColorAnimation {
                        duration: Theme.expressiveDurations.expressiveEffects
                        easing.type: Easing.BezierSpline
                        easing.bezierCurve: Theme.expressiveCurves.expressiveEffects
                    }
                }
                Behavior on scale {
                    enabled: root.animationsEnabled
                    NumberAnimation {
                        duration: Theme.expressiveDurations.expressiveDefaultSpatial
                        easing.type: Easing.BezierSpline
                        easing.bezierCurve: Theme.expressiveCurves.expressiveDefaultSpatial
                    }
                }
            }

            MouseArea {
                anchors.fill: parent
                enabled: root.synced && RoonService.canSeek && lyric.modelData.time >= 0
                cursorShape: enabled ? Qt.PointingHandCursor : Qt.ArrowCursor
                onClicked: {
                    RoonService.seek(lyric.modelData.time);
                    root.resume();
                }
            }
        }
    }

    DankButton {
        id: followButton
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        buttonHeight: Theme.buttonHeightXS
        visible: root.synced && !root.following && root.lines.length > 0
        text: root.width >= 220 ? "Follow playback" : ""
        tooltipText: root.width >= 220 ? "" : "Follow playback"
        iconName: "my_location"
        backgroundColor: Theme.chipSurface
        textColor: root.lyricsColor
        onClicked: root.resume()
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
}
