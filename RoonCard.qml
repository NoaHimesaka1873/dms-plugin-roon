import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins
import qs.Modules.DankDash
import "./services"
import "./components"

// Dash overview card: the selected zone's track with art, seek bar and
// transport. Looks and resizes like the built-in media card; clicking it
// opens the Roon tab.
DashCardComponent {
    id: root

    readonly property bool compact: height < DashMetrics.heightForRows(2)
    readonly property bool narrow: width - pad * 2 < DashMetrics.overviewTransportWidth
    readonly property bool tiny: compact && width - pad * 2 < DashMetrics.overviewTransportWidth + Theme.iconButtonSize
    readonly property bool showArtwork: !compact && !narrow && (options.showArt ?? true)
    readonly property bool showProgress: !tiny && (options.showProgress ?? true)
    readonly property bool hasTrack: RoonService.paired && RoonService.hasTrack
    readonly property bool ticking: live && visible && hasTrack && showProgress

    clickable: true
    pad: Theme.spacingM
    tone: options.tone ?? ""

    onTickingChanged: ticking ? RoonService.acquire() : RoonService.release()
    Component.onDestruction: {
        if (ticking)
            RoonService.release();
    }

    function handleKeyEvent(event) {
        if (!hasTrack)
            return false;
        switch (event.key) {
        case Qt.Key_Space:
            RoonService.playPause();
            return true;
        case Qt.Key_Left:
            RoonService.previous();
            return true;
        case Qt.Key_Right:
            RoonService.next();
            return true;
        }
        return false;
    }

    Column {
        anchors.centerIn: parent
        width: parent.width
        spacing: Theme.spacingXS
        visible: !root.hasTrack

        RoonGlyph {
            anchors.horizontalCenter: parent.horizontalCenter
            size: Theme.iconSizeLarge
            color: root.accentColor
        }

        StyledText {
            width: parent.width
            horizontalAlignment: Text.AlignHCenter
            text: !RoonService.paired ? (RoonService.statusMessage || "Not connected") : (RoonService.selectedZone ? RoonService.selectedZone.name + " is idle" : "No zone")
            font.pixelSize: Theme.fontSizeSmall
            color: root.mutedColor
            elide: Text.ElideRight
            wrapMode: Text.NoWrap
            maximumLineCount: 1
        }
    }

    Item {
        id: content
        anchors.fill: parent
        visible: root.hasTrack
        enabled: root.interactive

        RoonArt {
            id: artwork
            anchors.right: parent.right
            anchors.top: parent.top
            width: root.showArtwork ? Math.max(0, Math.min(DashMetrics.overviewArtHero, parent.width / 3, (root.showProgress ? progress.y : transport.y) - Theme.spacingM)) : 0
            height: width
            radius: Theme.cornerRadius
            visible: root.showArtwork && width > 0
            source: root.showArtwork ? RoonService.nowPlayingArtUrl(256) : ""
        }

        Column {
            id: trackText
            anchors.left: parent.left
            anchors.right: artwork.visible ? artwork.left : (root.compact && !root.tiny ? transport.left : parent.right)
            anchors.rightMargin: artwork.visible || (root.compact && !root.tiny) ? Theme.spacingM : 0
            anchors.top: root.compact ? undefined : parent.top
            anchors.verticalCenter: root.compact ? parent.verticalCenter : undefined
            spacing: Theme.spacingXXS
            visible: !root.tiny

            StyledText {
                width: parent.width
                text: root.compact && RoonService.artist ? RoonService.title + " · " + RoonService.artist : RoonService.title
                font.pixelSize: root.compact ? Theme.fontSizeMedium : Theme.fontSizeLarge
                font.weight: Theme.fontWeightMedium
                color: root.contentColor
                elide: Text.ElideRight
                maximumLineCount: root.showArtwork ? 2 : 1
                wrapMode: root.showArtwork ? Text.WrapAtWordBoundaryOrAnywhere : Text.NoWrap
            }

            StyledText {
                width: parent.width
                visible: !root.compact && text.length > 0
                text: RoonService.artist
                font.pixelSize: Theme.fontSizeSmall
                color: root.mutedColor
                elide: Text.ElideRight
                wrapMode: Text.NoWrap
                maximumLineCount: 1
            }

            StyledText {
                width: parent.width
                visible: !root.compact && RoonService.selectedZone !== null && root.height >= DashMetrics.heightForRows(3)
                text: RoonService.selectedZone ? RoonService.selectedZone.name : ""
                font.pixelSize: Theme.fontSizeSmall
                color: root.mutedColor
                elide: Text.ElideRight
                wrapMode: Text.NoWrap
                maximumLineCount: 1
            }
        }

        SeekBar {
            id: progress
            anchors.left: parent.left
            anchors.right: parent.right
            y: transport.y - height - Theme.spacingS
            visible: root.showProgress && !root.compact
            showTimes: false
            waveHeight: 20
            accentColor: root.tinted ? root.accentColor : RoonService.accent
            labelColor: root.mutedColor
        }

        Item {
            id: transport

            readonly property bool stacked: root.narrow && !root.tiny
            readonly property bool medium: !root.compact && width >= Theme.buttonHeightM * 4
            readonly property real buttonHeight: medium ? Theme.buttonHeightM : Theme.buttonHeightS
            readonly property real spacing: root.compact || stacked ? Theme.spacingXS : Theme.spacingS

            anchors.right: parent.right
            width: root.tiny ? parent.width : (root.compact ? DashMetrics.overviewTransportWidth : parent.width)
            height: stacked ? buttonHeight * 2 + spacing : buttonHeight
            y: root.tiny || root.compact ? (parent.height - height) / 2 : parent.height - height

            DankIconButton {
                id: playButton
                x: 0
                anchors.top: parent.top
                size: transport.medium ? "m" : "s"
                width: {
                    if (root.tiny || transport.stacked)
                        return parent.width;
                    if (root.compact)
                        return DashMetrics.overviewPlayWidth;
                    return (parent.width - transport.spacing * 2) / 2;
                }
                variant: "filled"
                round: false
                iconName: RoonService.isPlaying ? "pause" : "play_arrow"
                checkable: true
                checked: RoonService.isPlaying
                iconFilled: false
                radius: Theme.buttonRadius(width, height, buttonSize, pressed, checked)
                containerColor: root.tinted ? root.accentColor : RoonService.accentContainer
                contentColor: root.tinted ? root.containerColor : RoonService.onAccentContainer
                enabled: RoonService.canPlay || RoonService.canPause
                Accessible.name: RoonService.isPlaying ? "Pause" : "Play"
                onClicked: RoonService.playPause()
            }

            DankIconButton {
                id: previousButton
                x: transport.stacked ? 0 : playButton.width + transport.spacing
                anchors.bottom: parent.bottom
                size: transport.medium ? "m" : "s"
                width: transport.stacked ? (parent.width - transport.spacing) / 2 : (parent.width - playButton.width - transport.spacing * 2) / 2
                iconName: "skip_previous"
                iconColor: root.contentColor
                enabled: RoonService.canPrevious
                visible: !root.tiny
                Accessible.name: "Previous"
                onClicked: RoonService.previous()
            }

            DankIconButton {
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                size: previousButton.size
                width: previousButton.width
                iconName: "skip_next"
                iconColor: root.contentColor
                enabled: RoonService.canNext
                visible: !root.tiny
                Accessible.name: "Next"
                onClicked: RoonService.next()
            }
        }
    }
}
