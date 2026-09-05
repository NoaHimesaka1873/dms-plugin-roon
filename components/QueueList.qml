import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Play queue of the selected zone (subscribed while visible).
Item {
    id: root

    readonly property real contentHeight: RoonService.queue.length > 0 ? list.contentHeight : 140

    Component.onCompleted: RoonService.subscribeQueue()
    Component.onDestruction: RoonService.unsubscribeQueue()

    DankListView {
        id: list
        anchors.fill: parent
        clip: true
        spacing: 2
        model: RoonService.queue

        delegate: Rectangle {
            id: row
            required property var modelData
            required property int index

            width: list.width
            height: 52
            radius: Theme.cornerRadius
            color: rowArea.containsMouse ? Theme.surfaceContainerHighest : "transparent"

            Row {
                anchors.fill: parent
                anchors.margins: Theme.spacingXS
                spacing: Theme.spacingS

                RoonArt {
                    anchors.verticalCenter: parent.verticalCenter
                    width: 40
                    height: 40
                    radius: (Theme.cornerRadius / 2)
                    fallbackIcon: "music_note"
                    source: row.modelData.artUrl || RoonService.artUrl(row.modelData.imageKey, 128)
                }

                Column {
                    anchors.verticalCenter: parent.verticalCenter
                    width: parent.width - 40 - Theme.spacingS * 2 - lengthLabel.width
                    spacing: 1

                    StyledText {
                        width: parent.width
                        text: row.modelData.title
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceText
                        elide: Text.ElideRight
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                    }

                    StyledText {
                        width: parent.width
                        text: RoonService.formatArtists(row.modelData.subtitle) + (row.modelData.album ? " • " + row.modelData.album : "")
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                        elide: Text.ElideRight
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                    }
                }

                StyledText {
                    id: lengthLabel
                    anchors.verticalCenter: parent.verticalCenter
                    text: row.modelData.length ? RoonService.formatTime(row.modelData.length) : ""
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                }
            }

            MouseArea {
                id: rowArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: RoonService.playFromHere(row.modelData.queueItemId)
            }
        }
    }

    Column {
        anchors.centerIn: parent
        spacing: Theme.spacingS
        visible: RoonService.queue.length === 0

        DankIcon {
            anchors.horizontalCenter: parent.horizontalCenter
            name: "queue_music"
            size: 40
            color: Theme.surfaceVariantText
        }

        StyledText {
            anchors.horizontalCenter: parent.horizontalCenter
            text: RoonService.selectedZone ? "Queue is empty" : "No zone selected"
            color: Theme.surfaceVariantText
        }
    }
}
