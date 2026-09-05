import QtQuick
import QtQuick.Layouts
import Quickshell
import qs.Common
import qs.Services
import qs.Widgets
import qs.Modules.Plugins
import "./services"
import "./components"

// Bar widget: now-playing pill, zone-control popout and control-center tile.
PluginComponent {
    id: root

    layerNamespacePlugin: "roon"
    popoutWidth: 420
    popoutHeight: 600

    property var popoutService: null
    property var widgetData: null
    property string variantId: ""
    property var variantData: null
    property int requestedTab: 0
    signal showTab(int index)

    Connections {
        target: PluginService
        function onPluginDataChanged(changedPluginId) {
            if (changedPluginId === root.pluginId && root.variantId)
                root.variantData = PluginService.getPluginVariantData(root.pluginId, root.variantId);
        }
    }

    // Size scale matches the built-in media widget: 0 = icon + controls only,
    // 1 = 120px text, 2 = 180px, 3 = 240px. Resolution order: variant config,
    // the bar entry's mediaSize, then the plugin-wide setting.
    readonly property int pillSize: {
        if (variantData && variantData.pillSize !== undefined)
            return Number(variantData.pillSize);
        if (widgetData && widgetData.mediaSize !== undefined)
            return Number(widgetData.mediaSize);
        return pluginData.pillSize !== undefined ? Number(pluginData.pillSize) : 2;
    }
    // Leading pill icon: "none" | "note" | "logo" | "art"
    readonly property string pillIcon: pluginData.pillIcon ?? "logo"
    readonly property bool showArt: pillIcon !== "none"
    readonly property bool showWhenIdle: pluginData.pillShowWhenIdle ?? false
    readonly property int maxTextWidth: [0, 120, 180, 240][Math.max(0, Math.min(3, pillSize))]
    readonly property bool active: RoonService.paired && (RoonService.hasTrack || showWhenIdle)
    readonly property bool pillVisible: active || showWhenIdle
    readonly property string pillText: RoonService.pillText()

    property real scrollAccumulatorY: 0

    Connections {
        target: RoonService
        function onPopoutRequested() {
            // Bars get recreated on theme/settings changes; a stale instance without a
            // window would position the popout at the screen corner.
            if (!root.Window.window || !root.visible)
                return;
            const t = PluginService.getGlobalVar("roon", "popoutTab", -1);
            if (t >= 0) {
                root.requestedTab = t;
                PluginService.setGlobalVar("roon", "popoutTab", -1);
                root.showTab(t);
            }
            root.triggerPopout();
        }
    }

    function handleWheel(wheelEvent) {
        const mode = SettingsData.audioScrollMode;
        if (mode === "nothing")
            return;
        wheelEvent.accepted = true;
        const deltaY = wheelEvent.angleDelta.y;
        const isMouseWheel = Math.abs(deltaY) >= 120 && (Math.abs(deltaY) % 120) === 0;
        let dir = 0;
        if (isMouseWheel) {
            dir = deltaY > 0 ? 1 : -1;
        } else {
            scrollAccumulatorY += deltaY;
            if (Math.abs(scrollAccumulatorY) >= 100) {
                dir = scrollAccumulatorY > 0 ? 1 : -1;
                scrollAccumulatorY = 0;
            }
        }
        if (dir === 0)
            return;
        if (mode === "song") {
            if (dir > 0)
                RoonService.previous();
            else
                RoonService.next();
            return;
        }
        const out = RoonService.primaryOutput;
        if (out)
            RoonService.volumeStep(out.outputId, dir);
    }

    // --- Control Center tile --------------------------------------------------
    ccWidgetIcon: RoonService.isPlaying ? "pause_circle" : "play_circle"
    ccWidgetPrimaryText: "Roon"
    ccWidgetSecondaryText: {
        if (!RoonService.paired)
            return RoonService.statusMessage || "Not connected";
        if (RoonService.hasTrack)
            return RoonService.pillText();
        return RoonService.selectedZone ? RoonService.selectedZone.name + " • idle" : "No zone";
    }
    ccWidgetIsActive: RoonService.isPlaying
    ccWidgetIsToggle: true
    onCcWidgetToggled: RoonService.playPause()
    ccDetailHeight: 250
    ccDetailContent: Component {
        Column {
            width: parent.width
            spacing: Theme.spacingS

            NowPlayingCard {
                width: parent.width
                compact: true
                artSize: 64
            }

            TransportControls {
                width: parent.width
                playSize: 44
                sideSize: 36
            }

            VolumeRow {
                width: parent.width
                output: RoonService.primaryOutput
            }

            Row {
                width: parent.width
                spacing: Theme.spacingS

                DankDropdown {
                    anchors.verticalCenter: parent.verticalCenter
                    width: parent.width - 36 - Theme.spacingS
                    compactMode: true
                    options: RoonService.zones.map(z => z.name)
                    currentValue: RoonService.selectedZone ? RoonService.selectedZone.name : ""
                    onValueChanged: value => {
                        const z = RoonService.zones.find(zz => zz.name === value);
                        if (z)
                            RoonService.selectZone(z.zoneId);
                    }
                }

                DankActionButton {
                    anchors.verticalCenter: parent.verticalCenter
                    iconName: "open_in_new"
                    buttonSize: 36
                    visible: RoonService.roonAppAvailable
                    tooltipText: "Open Roon"
                    onClicked: RoonService.openRoonApp()
                }
            }
        }
    }

    // --- Bar pills ------------------------------------------------------------------
    horizontalBarPill: Component {
        Item {
            id: pill
            readonly property real textWidth: {
                if (!root.pillVisible || root.maxTextWidth <= 0 || root.pillText.length === 0)
                    return 0;
                if (!SettingsData.mediaAdaptiveWidthEnabled)
                    return root.maxTextWidth;
                const raw = pillLabel.implicitTextWidth;
                return Math.min(root.maxTextWidth, Math.ceil(raw));
            }
            readonly property real artWidth: root.pillIcon === "logo" ? pillGlyph.implicitWidth : (root.showArt ? 20 : 0)
            readonly property real controlsWidth: 20 + Theme.spacingXS + 24 + Theme.spacingXS + 20

            implicitWidth: root.pillVisible ? artWidth + (artWidth > 0 ? Theme.spacingXS : 0) + (textWidth > 0 ? textWidth + Theme.spacingXS : 0) + controlsWidth : 0
            implicitHeight: root.widgetThickness
            opacity: root.pillVisible ? 1 : 0
            clip: true

            Behavior on implicitWidth {
                NumberAnimation {
                    duration: Theme.mediumDuration
                    easing.type: Theme.standardEasing
                }
            }

            Row {
                anchors.verticalCenter: parent.verticalCenter
                spacing: Theme.spacingXS

                Item {
                    width: pill.artWidth
                    height: 22
                    anchors.verticalCenter: parent.verticalCenter
                    visible: root.showArt

                    RoonGlyph {
                        id: pillGlyph
                        size: 22
                        anchors.centerIn: parent
                        visible: root.pillIcon === "logo"
                        color: RoonService.isPlaying ? Theme.primary : Theme.widgetTextColor
                    }

                    DankIcon {
                        anchors.centerIn: parent
                        visible: root.pillIcon === "note"
                        name: "music_note"
                        size: 20
                        color: Theme.primary
                    }

                    RoonArt {
                        anchors.centerIn: parent
                        width: 20
                        height: 20
                        radius: 4
                        visible: root.pillIcon === "art"
                        fallbackIcon: "album"
                        source: root.pillIcon === "art" ? RoonService.nowPlayingArtUrl(64) : ""
                    }
                }

                Rectangle {
                    width: pill.textWidth
                    height: root.widgetThickness
                    anchors.verticalCenter: parent.verticalCenter
                    visible: pill.textWidth > 0
                    clip: true
                    color: "transparent"

                    Behavior on width {
                        NumberAnimation {
                            duration: Theme.mediumDuration
                            easing.type: Theme.standardEasing
                        }
                    }

                    // Own marquee instead of ScrollingText: never elides, scrolls with
                    // holds at both ends, resets when the text changes.
                    Item {
                        id: pillLabel
                        anchors.fill: parent
                        readonly property real implicitTextWidth: marqueeText.implicitWidth
                        readonly property real overflow: Math.max(0, marqueeText.implicitWidth - width)
                        readonly property bool scrolling: overflow > 0 && RoonService.isPlaying && SettingsData.scrollTitleEnabled && visible
                        property real offset: 0
                        property int direction: 1
                        property real holdMs: 2000

                        function reset() {
                            offset = 0;
                            direction = 1;
                            holdMs = 2000;
                        }

                        onScrollingChanged: reset()
                        onOverflowChanged: reset()

                        StyledText {
                            id: marqueeText
                            x: -Math.round(pillLabel.offset)
                            anchors.verticalCenter: parent.verticalCenter
                            width: implicitWidth
                            elide: Text.ElideNone
                            wrapMode: Text.NoWrap
                            text: root.pillText
                            color: Theme.widgetTextColor
                            font.pixelSize: Theme.barTextSize(root.barThickness, root.barConfig?.fontScale, root.barConfig?.maximizeWidgetText)
                            onTextChanged: pillLabel.reset()
                        }

                        Timer {
                            interval: 40
                            repeat: true
                            running: pillLabel.scrolling
                            onTriggered: {
                                if (pillLabel.holdMs > 0) {
                                    pillLabel.holdMs -= interval;
                                    return;
                                }
                                const max = pillLabel.overflow + 4;
                                const next = pillLabel.offset + pillLabel.direction * interval / 60;
                                if (next >= max) {
                                    pillLabel.offset = max;
                                    pillLabel.direction = -1;
                                    pillLabel.holdMs = 2000;
                                } else if (next <= 0) {
                                    pillLabel.offset = 0;
                                    pillLabel.direction = 1;
                                    pillLabel.holdMs = 2000;
                                } else {
                                    pillLabel.offset = next;
                                }
                            }
                        }
                    }
                }

                Rectangle {
                    width: 20
                    height: 20
                    radius: 10
                    anchors.verticalCenter: parent.verticalCenter
                    color: prevArea.containsMouse ? Theme.withAlpha(Theme.surfaceText, 0.12) : "transparent"
                    opacity: RoonService.canPrevious ? 1 : 0.3

                    DankIcon {
                        anchors.centerIn: parent
                        name: "skip_previous"
                        size: 12
                        color: Theme.widgetTextColor
                    }

                    MouseArea {
                        id: prevArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: RoonService.previous()
                    }
                }

                Rectangle {
                    width: 24
                    height: 24
                    radius: 12
                    anchors.verticalCenter: parent.verticalCenter
                    color: RoonService.isPlaying ? Theme.primary : Theme.primaryHover

                    DankIcon {
                        anchors.centerIn: parent
                        name: RoonService.isPlaying ? "pause" : "play_arrow"
                        size: 14
                        color: RoonService.isPlaying ? Theme.background : Theme.primary
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: RoonService.playPause()
                    }
                }

                Rectangle {
                    width: 20
                    height: 20
                    radius: 10
                    anchors.verticalCenter: parent.verticalCenter
                    color: nextArea.containsMouse ? Theme.withAlpha(Theme.surfaceText, 0.12) : "transparent"
                    opacity: RoonService.canNext ? 1 : 0.3

                    DankIcon {
                        anchors.centerIn: parent
                        name: "skip_next"
                        size: 12
                        color: Theme.widgetTextColor
                    }

                    MouseArea {
                        id: nextArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: RoonService.next()
                    }
                }
            }

            // Art + text area: left click opens the popout, middle click toggles playback, wheel = volume.
            MouseArea {
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                width: pill.artWidth + (pill.artWidth > 0 ? Theme.spacingXS : 0) + pill.textWidth
                acceptedButtons: Qt.LeftButton | Qt.MiddleButton
                cursorShape: Qt.PointingHandCursor
                onClicked: mouse => {
                    if (mouse.button === Qt.MiddleButton)
                        RoonService.playPause();
                    else
                        root.triggerPopout();
                }
                onWheel: wheelEvent => root.handleWheel(wheelEvent)
            }
        }
    }

    verticalBarPill: Component {
        Column {
            spacing: Theme.spacingXS
            visible: root.pillVisible

            Item {
                width: 20
                height: 20
                anchors.horizontalCenter: parent.horizontalCenter
                visible: root.showArt

                RoonGlyph {
                    anchors.centerIn: parent
                    size: 20
                    visible: root.pillIcon === "logo"
                    color: RoonService.isPlaying ? Theme.primary : Theme.widgetTextColor
                }

                DankIcon {
                    anchors.centerIn: parent
                    visible: root.pillIcon === "note"
                    name: "music_note"
                    size: 20
                    color: Theme.primary
                }

                RoonArt {
                    anchors.fill: parent
                    radius: 4
                    visible: root.pillIcon === "art"
                    fallbackIcon: "album"
                    source: root.pillIcon === "art" ? RoonService.nowPlayingArtUrl(64) : ""
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.triggerPopout()
                    onWheel: wheelEvent => root.handleWheel(wheelEvent)
                }
            }

            Rectangle {
                width: 24
                height: 24
                radius: 12
                anchors.horizontalCenter: parent.horizontalCenter
                color: RoonService.isPlaying ? Theme.primary : Theme.primaryHover

                DankIcon {
                    anchors.centerIn: parent
                    name: RoonService.isPlaying ? "pause" : "play_arrow"
                    size: 14
                    color: RoonService.isPlaying ? Theme.background : Theme.primary
                }

                MouseArea {
                    anchors.fill: parent
                    acceptedButtons: Qt.LeftButton | Qt.MiddleButton | Qt.RightButton
                    cursorShape: Qt.PointingHandCursor
                    onClicked: mouse => {
                        if (mouse.button === Qt.LeftButton)
                            RoonService.playPause();
                        else if (mouse.button === Qt.MiddleButton)
                            RoonService.previous();
                        else
                            RoonService.next();
                    }
                }
            }
        }
    }

    // --- Popout ------------------------------------------------------------------------
    popoutContent: Component {
        Item {
            id: popoutRoot

            property var closePopout: null
            property var parentPopout: null

            implicitHeight: popoutColumn.implicitHeight

            ArtBackdrop {
                anchors.fill: parent
                anchors.margins: -Theme.spacingS
                visible: RoonService.paired && RoonService.hasTrack
                source: RoonService.nowPlayingArtUrl(512)
            }

            // Wordmark in place of the header title text.
            RoonGlyph {
                x: Theme.spacingS
                y: (popoutColumn.headerHeight - height) / 2
                z: 2
                cropped: true
                size: 20
                color: Theme.surfaceText
            }

        PopoutComponent {
            id: popoutColumn

            width: parent.width
            headerText: " "
            showCloseButton: true
            closePopout: popoutRoot.closePopout

            property int currentTab: root.requestedTab

            Connections {
                target: root
                function onShowTab(index) {
                    popoutColumn.currentTab = index;
                }
            }

            headerActions: Component {
                Row {
                spacing: Theme.spacingXS

                DankActionButton {
                    anchors.verticalCenter: parent.verticalCenter
                    iconName: "open_in_new"
                    buttonSize: 32
                    iconSize: Theme.iconSize - 4
                    visible: RoonService.roonAppAvailable
                    tooltipText: "Open Roon"
                    onClicked: RoonService.openRoonApp()
                }
                }
            }

            Item {
                width: parent.width
                implicitHeight: RoonService.paired ? contentColumn.implicitHeight : 340

                ConnectionState {
                    anchors.fill: parent
                    visible: !RoonService.paired
                }

                Column {
                    id: contentColumn
                    width: parent.width
                    visible: RoonService.paired
                    spacing: Theme.spacingM
                    topPadding: Theme.spacingS

                    DankTabBar {
                        id: tabs
                        width: parent.width
                        tabHeight: 56
                        currentIndex: popoutColumn.currentTab
                        model: [
                            { text: "Playing", icon: "play_circle" },
                            { text: "Queue", icon: "queue_music" },
                            { text: "Browse", icon: "library_music" },
                            { text: "Zones", icon: "speaker_group" }
                        ]
                        onTabClicked: index => popoutColumn.currentTab = index
                    }

                    Loader {
                        id: tabLoader
                        width: parent.width
                        sourceComponent: {
                            switch (popoutColumn.currentTab) {
                            case 1:
                                return queueTab;
                            case 2:
                                return browseTab;
                            case 3:
                                return zonesTab;
                            default:
                                return nowPlayingTab;
                            }
                        }
                    }
                }
            }

            Component {
                id: nowPlayingTab

                Item {
                    implicitHeight: Math.min(npColumn.implicitHeight, 720)

                    Flickable {
                        anchors.fill: parent
                        contentHeight: npColumn.implicitHeight
                        clip: true
                        boundsBehavior: Flickable.StopAtBounds

                        Column {
                            id: npColumn
                            width: parent.width
                            spacing: Theme.spacingL
                            topPadding: Theme.spacingM
                            bottomPadding: Theme.spacingM

                            NowPlayingCard {
                                width: parent.width
                                artSize: 200
                            }

                            Column {
                                width: parent.width - Theme.spacingL * 2
                                anchors.horizontalCenter: parent.horizontalCenter
                                spacing: Theme.spacingM

                                SeekBar {
                                    width: parent.width
                                }

                                TransportControls {
                                    width: parent.width
                                }

                                Row {
                                    anchors.horizontalCenter: parent.horizontalCenter
                                    spacing: Theme.spacingS

                                    Rectangle {
                                        width: radioRow.implicitWidth + Theme.spacingM * 2
                                        height: 28
                                        radius: 14
                                        color: RoonService.autoRadio ? Theme.primaryContainer : Theme.surfaceContainerHigh
                                        border.width: 1
                                        border.color: RoonService.autoRadio ? Theme.primary : Theme.withAlpha(Theme.outline, 0.25)

                                        Row {
                                            id: radioRow
                                            anchors.centerIn: parent
                                            spacing: Theme.spacingXS

                                            DankIcon {
                                                anchors.verticalCenter: parent.verticalCenter
                                                name: "radio"
                                                size: Theme.iconSizeSmall
                                                color: RoonService.autoRadio ? Theme.primary : Theme.surfaceVariantText
                                            }

                                            StyledText {
                                                anchors.verticalCenter: parent.verticalCenter
                                                text: "Roon Radio"
                                                font.pixelSize: Theme.fontSizeSmall
                                                color: RoonService.autoRadio ? Theme.primary : Theme.surfaceVariantText
                                            }
                                        }

                                        MouseArea {
                                            anchors.fill: parent
                                            cursorShape: Qt.PointingHandCursor
                                            onClicked: RoonService.setRadio(!RoonService.autoRadio)
                                        }
                                    }

                                    Rectangle {
                                        width: queueChip.implicitWidth + Theme.spacingM * 2
                                        height: 28
                                        radius: 14
                                        color: Theme.surfaceContainerHigh
                                        border.width: 1
                                        border.color: Theme.withAlpha(Theme.outline, 0.25)
                                        visible: RoonService.queueItemsRemaining > 0

                                        StyledText {
                                            id: queueChip
                                            anchors.centerIn: parent
                                            text: RoonService.queueItemsRemaining + " in queue"
                                            font.pixelSize: Theme.fontSizeSmall
                                            color: Theme.surfaceVariantText
                                        }

                                        MouseArea {
                                            anchors.fill: parent
                                            cursorShape: Qt.PointingHandCursor
                                            onClicked: popoutColumn.currentTab = 1
                                        }
                                    }
                                }
                            }

                            Column {
                                width: parent.width - Theme.spacingL * 2
                                anchors.horizontalCenter: parent.horizontalCenter
                                spacing: Theme.spacingS
                                visible: RoonService.outputs.length > 0

                                Rectangle {
                                    width: parent.width
                                    height: 1
                                    color: Theme.withAlpha(Theme.outline, 0.2)
                                }

                                Repeater {
                                    model: RoonService.outputs

                                    VolumeRow {
                                        required property var modelData
                                        width: parent.width
                                        output: modelData
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Component {
                id: queueTab
                Item {
                    implicitHeight: Math.max(180, Math.min(520, queueView.contentHeight + Theme.spacingM + Theme.spacingS))

                    QueueList {
                        id: queueView
                        anchors.fill: parent
                        anchors.topMargin: Theme.spacingM
                        anchors.leftMargin: Theme.spacingS
                        anchors.rightMargin: Theme.spacingS
                        anchors.bottomMargin: Theme.spacingS
                    }
                }
            }

            Component {
                id: browseTab
                Item {
                    implicitHeight: Math.max(180, Math.min(520, browseView.contentHeight + Theme.spacingM + Theme.spacingS))

                    BrowserView {
                        id: browseView
                        anchors.fill: parent
                        anchors.topMargin: Theme.spacingM
                        anchors.leftMargin: Theme.spacingS
                        anchors.rightMargin: Theme.spacingS
                        anchors.bottomMargin: Theme.spacingS
                    }
                }
            }

            Component {
                id: zonesTab
                Item {
                    implicitHeight: Math.max(180, Math.min(520, zonesView.contentHeight + Theme.spacingM + Theme.spacingS))

                    ZonePicker {
                        id: zonesView
                        anchors.fill: parent
                        anchors.topMargin: Theme.spacingM
                        anchors.leftMargin: Theme.spacingS
                        anchors.rightMargin: Theme.spacingS
                        anchors.bottomMargin: Theme.spacingS
                    }
                }
            }
        }
        }
    }
}
