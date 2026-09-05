import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins
import "./services"
import "./components"

// Desktop-layer now-playing card.
DesktopPluginComponent {
    id: root

    minWidth: 160
    minHeight: 80
    // Newer DMS builds read these; older ones ignore them.
    property real defaultWidth: 360
    property real defaultHeight: 140
    property bool forceSquare: pluginData.desktopForceSquare ?? false

    readonly property real bgOpacity: (pluginData.desktopOpacity ?? 80) / 100
    readonly property bool artOnly: pluginData.desktopForceSquare ?? false
    readonly property bool wide: width > height * 1.6
    readonly property string artUrl: RoonService.nowPlayingArtUrl(512)

    Component.onCompleted: RoonService.acquire()
    Component.onDestruction: RoonService.release()

    Rectangle {
        anchors.fill: parent
        radius: (Theme.cornerRadius + 4)
        color: Theme.withAlpha(Theme.surfaceContainer, root.bgOpacity)
    }

    // Art-only tile
    RoonArt {
        anchors.fill: parent
        anchors.margins: Theme.spacingXS
        radius: (Theme.cornerRadius + 4)
        visible: root.artOnly
        source: root.artUrl
    }

    // Wide layout: art left, text + controls right
    Row {
        anchors.fill: parent
        anchors.margins: Theme.spacingS
        spacing: Theme.spacingM
        visible: !root.artOnly && root.wide

        RoonArt {
            id: wideArt
            width: parent.height
            height: parent.height
            radius: Theme.cornerRadius
            source: root.artUrl
        }

        Column {
            width: parent.width - wideArt.width - Theme.spacingM
            anchors.verticalCenter: parent.verticalCenter
            spacing: Theme.spacingXS

            StyledText {
                width: parent.width
                text: RoonService.hasTrack ? RoonService.title : "Roon · idle"
                font.pixelSize: Math.max(Theme.fontSizeMedium, Math.min(Theme.fontSizeXLarge, root.height * 0.16))
                font.weight: Font.Bold
                color: Theme.surfaceText
                elide: Text.ElideRight
            }

            StyledText {
                width: parent.width
                text: RoonService.artist + (RoonService.album ? " • " + RoonService.album : "")
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.surfaceVariantText
                elide: Text.ElideRight
            }

            Item {
                width: parent.width
                height: 4
                Rectangle {
                    anchors.fill: parent
                    radius: 2
                    color: Theme.surfaceVariant
                }
                Rectangle {
                    width: RoonService.length > 0 ? parent.width * Math.min(1, RoonService.position / RoonService.length) : 0
                    height: parent.height
                    radius: 2
                    color: Theme.primary
                }
            }

            Row {
                spacing: Theme.spacingXS

                TransportControls {
                    playSize: 32
                    sideSize: 28
                    showModes: false
                }

                StyledText {
                    anchors.verticalCenter: parent.verticalCenter
                    text: RoonService.selectedZone ? RoonService.selectedZone.name : ""
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                }
            }
        }
    }

    // Tall layout: art on top, text and controls below
    Column {
        anchors.fill: parent
        anchors.margins: Theme.spacingS
        spacing: Theme.spacingXS
        visible: !root.artOnly && !root.wide

        RoonArt {
            width: parent.width
            height: parent.height - textBlock.height - controls.height - Theme.spacingXS * 2
            radius: Theme.cornerRadius
            source: root.artUrl
        }

        Column {
            id: textBlock
            width: parent.width
            spacing: 1

            StyledText {
                width: parent.width
                text: RoonService.hasTrack ? RoonService.title : "Roon · idle"
                font.pixelSize: Theme.fontSizeMedium
                font.weight: Font.Bold
                color: Theme.surfaceText
                elide: Text.ElideRight
            }

            StyledText {
                width: parent.width
                text: RoonService.artist
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.surfaceVariantText
                elide: Text.ElideRight
            }
        }

        TransportControls {
            id: controls
            width: parent.width
            playSize: 32
            sideSize: 28
            showModes: false
        }
    }

    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.NoButton
        onWheel: wheelEvent => {
            const out = RoonService.primaryOutput;
            if (!out)
                return;
            wheelEvent.accepted = true;
            RoonService.volumeStep(out.outputId, wheelEvent.angleDelta.y > 0 ? 1 : -1);
        }
    }
}
