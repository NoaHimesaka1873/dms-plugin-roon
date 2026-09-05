import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Album art plus title / artist / album (full or compact layout).
Item {
    id: root

    property int artSize: 160
    property bool compact: false
    readonly property string artUrl: RoonService.nowPlayingArtUrl(compact ? 256 : 512)

    implicitHeight: compact ? artSize : artSize + Theme.spacingM + textColumn.implicitHeight
    clip: false

    Row {
        anchors.fill: parent
        spacing: Theme.spacingM
        visible: root.compact

        RoonArt {
            id: compactArt
            width: root.artSize
            height: root.artSize
            radius: Theme.cornerRadius
            source: root.artUrl
        }

        Column {
            width: parent.width - compactArt.width - Theme.spacingM
            anchors.verticalCenter: parent.verticalCenter
            spacing: 2

            StyledText {
                width: parent.width
                text: RoonService.hasTrack ? RoonService.title : "Nothing playing"
                font.pixelSize: Theme.fontSizeMedium
                font.weight: Font.Medium
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

            StyledText {
                width: parent.width
                text: RoonService.album
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.surfaceVariantText
                elide: Text.ElideRight
            }
        }
    }

    Column {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.top
        width: parent.width
        spacing: Theme.spacingM
        visible: !root.compact

        RoonArt {
            id: art
            width: root.artSize
            height: root.artSize
            anchors.horizontalCenter: parent.horizontalCenter
            radius: (Theme.cornerRadius + 4)
            source: root.artUrl
        }

        Column {
            id: textColumn
            width: parent.width
            spacing: 2

            StyledText {
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: RoonService.hasTrack ? RoonService.title : (RoonService.selectedZone ? "Nothing playing" : "No zone selected")
                font.pixelSize: Theme.fontSizeLarge
                font.weight: Font.Bold
                color: Theme.surfaceText
                elide: Text.ElideRight
            }

            StyledText {
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: RoonService.artist
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceText
                elide: Text.ElideRight
            }

            StyledText {
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: RoonService.album
                visible: text.length > 0
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.surfaceVariantText
                elide: Text.ElideRight
            }
        }
    }
}
