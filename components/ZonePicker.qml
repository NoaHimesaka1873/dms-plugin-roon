import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Zone list with state chips. Click selects; hover reveals transfer / group.
Item {
    id: root

    readonly property real contentHeight: RoonService.zones.length > 0 ? list.contentHeight : 120

    DankListView {
        id: list
        anchors.fill: parent
        clip: true
        spacing: Theme.spacingXS
        model: RoonService.zones

        delegate: Rectangle {
            id: row
            required property var modelData
            readonly property bool selected: modelData.zoneId === RoonService.selectedZoneId
            readonly property string stateText: modelData.state === "playing" ? "Playing" : (modelData.state === "paused" ? "Paused" : (modelData.state === "loading" ? "Loading" : "Stopped"))

            width: list.width
            height: 60
            radius: Theme.cornerRadius
            color: selected ? Theme.primaryContainer : (rowArea.containsMouse ? Theme.surfaceContainerHighest : Theme.surfaceContainerHigh)

            Behavior on color {
                ColorAnimation {
                    duration: Theme.shortDuration
                }
            }

            Row {
                anchors.fill: parent
                anchors.margins: Theme.spacingS
                spacing: Theme.spacingS

                RoonArt {
                    anchors.verticalCenter: parent.verticalCenter
                    width: 44
                    height: 44
                    radius: (Theme.cornerRadius / 2)
                    fallbackIcon: "speaker"
                    source: row.modelData.nowPlaying ? RoonService.artUrl(row.modelData.nowPlaying.imageKey, 128) : ""
                }

                Column {
                    anchors.verticalCenter: parent.verticalCenter
                    width: parent.width - 44 - Theme.spacingS - actions.width - Theme.spacingS
                    spacing: 2

                    Row {
                        spacing: Theme.spacingXS

                        StyledText {
                            text: row.modelData.name
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: row.selected ? Font.Bold : Font.Medium
                            color: Theme.surfaceText
                            elide: Text.ElideRight
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                        }

                        Rectangle {
                            anchors.verticalCenter: parent.verticalCenter
                            width: chip.implicitWidth + Theme.spacingS
                            height: 16
                            radius: 8
                            color: row.modelData.state === "playing" ? Theme.primary : Theme.surfaceVariant

                            StyledText {
                                id: chip
                                anchors.centerIn: parent
                                text: row.stateText
                                font.pixelSize: Theme.fontSizeSmall - 2
                                color: row.modelData.state === "playing" ? Theme.onPrimary : Theme.surfaceVariantText
                            }
                        }
                    }

                    StyledText {
                        width: parent.width
                        text: row.modelData.nowPlaying ? (row.modelData.nowPlaying.title + (row.modelData.nowPlaying.artist ? " • " + RoonService.formatArtists(row.modelData.nowPlaying.artist) : "")) : (row.modelData.outputs.map(o => o.name).join(", "))
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                        elide: Text.ElideRight
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                    }
                }

                Row {
                    id: actions
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: 0
                    visible: rowArea.containsMouse && !row.selected && RoonService.selectedZone !== null
                    width: visible ? implicitWidth : 0

                    DankActionButton {
                        iconName: "move_down"
                        buttonSize: 28
                        iconSize: Theme.iconSizeSmall
                        tooltipText: "Transfer playback here"
                        onClicked: RoonService.transferTo(row.modelData.zoneId)
                    }

                    DankActionButton {
                        iconName: "speaker_group"
                        buttonSize: 28
                        iconSize: Theme.iconSizeSmall
                        tooltipText: "Group with selected zone"
                        onClicked: {
                            const ids = RoonService.outputs.map(o => o.outputId).concat(row.modelData.outputs.map(o => o.outputId));
                            RoonService.groupOutputs(ids);
                        }
                    }
                }
            }

            MouseArea {
                id: rowArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                z: -1
                onClicked: RoonService.selectZone(row.modelData.zoneId)
            }
        }
    }

    StyledText {
        anchors.centerIn: parent
        visible: RoonService.zones.length === 0
        text: "No zones"
        color: Theme.surfaceVariantText
    }
}
