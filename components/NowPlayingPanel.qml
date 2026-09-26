import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Now playing for a resizable area (the dash tab widget). The seek bar always
// runs full width along the bottom. Above it, either the art sits on the left
// with text and transport beside it, or art, text and transport stack like
// Roon's own now playing screen, whichever leaves the bigger art.
Item {
    id: root

    property color textColor: Theme.surfaceText
    property color mutedColor: Theme.surfaceVariantText
    property color accentColor: RoonService.accent

    readonly property real gap: Theme.spacingM
    readonly property real sideMinWidth: 220
    readonly property real playSize: Math.min(width, height) >= 300 ? 56 : 40
    readonly property bool medium: playSize >= 52
    readonly property real topHeight: height - seek.implicitHeight - gap
    // Text height for a one-line title, so the choice doesn't depend on the layout it picks.
    readonly property real infoEstimate: (Theme.fontSizeXLarge + Theme.fontSizeMedium + Theme.fontSizeSmall * 2) * 1.35 + Theme.spacingXS + Theme.spacingXXS * 3
    readonly property real stackedArt: Math.min(width, topHeight - infoEstimate - transport.implicitHeight - gap * 2)
    readonly property real besideArt: Math.min(topHeight, width - sideMinWidth - gap * 1.5)
    readonly property bool vertical: stackedArt > besideArt
    readonly property real artSize: {
        if (!RoonService.hasTrack)
            return 0;
        const s = vertical ? Math.min(stackedArt, topHeight - info.implicitHeight - transport.implicitHeight - gap * 2) : besideArt;
        return s >= 96 ? Math.floor(s) : 0;
    }
    // Height the content actually needs; any leftover is split above and below.
    readonly property real contentHeight: {
        const seekPart = seek.implicitHeight + gap;
        if (vertical)
            return (art.visible ? artSize + gap : 0) + info.implicitHeight + gap + transport.implicitHeight + seekPart;
        return Math.max(artSize, info.implicitHeight + gap + transport.implicitHeight) + seekPart;
    }
    readonly property real contentTop: Math.max(0, (height - contentHeight) / 2)

    RoonArt {
        id: art
        x: root.vertical ? (root.width - width) / 2 : 0
        y: root.contentTop
        width: root.artSize
        height: width
        radius: Theme.cornerRadius + 4
        visible: width > 0
        source: RoonService.nowPlayingArtUrl(root.artSize > 256 ? 800 : 512)
    }

    Item {
        id: side
        x: root.vertical || !art.visible ? 0 : art.width + root.gap * 1.5
        y: root.vertical ? root.contentTop + (art.visible ? art.height + root.gap : 0) : root.contentTop
        width: root.width - x
        height: root.vertical ? info.implicitHeight + root.gap + transport.implicitHeight : Math.max(root.artSize, info.implicitHeight + root.gap + transport.implicitHeight)

        Column {
            id: info
            width: parent.width
            spacing: Theme.spacingXXS

            StyledText {
                width: parent.width
                horizontalAlignment: root.vertical ? Text.AlignHCenter : Text.AlignLeft
                text: RoonService.hasTrack ? RoonService.title : (RoonService.selectedZone ? "Nothing playing" : "No zone selected")
                font.pixelSize: root.vertical ? Theme.fontSizeXLarge : Theme.fontSizeXXLarge
                font.weight: Font.Bold
                color: root.textColor
                elide: Text.ElideRight
                wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                maximumLineCount: 2
            }

            StyledText {
                width: parent.width
                horizontalAlignment: root.vertical ? Text.AlignHCenter : Text.AlignLeft
                text: RoonService.artist
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeLarge
                color: root.textColor
                elide: Text.ElideRight
                wrapMode: Text.NoWrap
                maximumLineCount: 1
            }

            StyledText {
                width: parent.width
                horizontalAlignment: root.vertical ? Text.AlignHCenter : Text.AlignLeft
                text: RoonService.album
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeMedium
                color: root.mutedColor
                elide: Text.ElideRight
                wrapMode: Text.NoWrap
                maximumLineCount: 1
            }

            Row {
                x: root.vertical ? (parent.width - width) / 2 : 0
                topPadding: Theme.spacingXS
                spacing: Theme.spacingXS
                visible: RoonService.selectedZone !== null

                DankIcon {
                    anchors.verticalCenter: parent.verticalCenter
                    name: "speaker"
                    size: Theme.iconSizeSmall
                    color: root.accentColor
                }

                StyledText {
                    anchors.verticalCenter: parent.verticalCenter
                    text: RoonService.selectedZone ? RoonService.selectedZone.name : ""
                    font.pixelSize: Theme.fontSizeSmall
                    color: root.accentColor
                    wrapMode: Text.NoWrap
                }
            }
        }

        // Beside the art: pinned to the art's bottom edge. Stacked: under the text.
        TransportControls {
            id: transport
            width: parent.width
            y: parent.height - height
            playSize: root.playSize
            contentColor: root.textColor
            showModes: width >= (root.medium ? 330 : 250)
        }
    }

    SeekBar {
        id: seek
        width: parent.width
        y: side.y + side.height + root.gap
        waveHeight: 32
        accentColor: root.accentColor
        labelColor: root.mutedColor
    }
}
