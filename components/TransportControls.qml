import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// shuffle · previous · play/pause · next · loop
Item {
    id: root

    property int playSize: 56
    property int sideSize: 40
    property bool showModes: true
    readonly property bool enabled_: RoonService.paired && RoonService.selectedZone !== null

    implicitHeight: playSize
    implicitWidth: row.implicitWidth

    Row {
        id: row
        anchors.centerIn: parent
        spacing: Theme.spacingM

        DankActionButton {
            anchors.verticalCenter: parent.verticalCenter
            visible: root.showModes
            iconName: "shuffle"
            buttonSize: root.sideSize
            iconSize: Theme.iconSize - 4
            iconColor: RoonService.shuffle ? Theme.primary : Theme.surfaceVariantText
            tooltipText: RoonService.shuffle ? "Shuffle on" : "Shuffle off"
            enabled: root.enabled_
            onClicked: RoonService.setShuffle(!RoonService.shuffle)
        }

        DankActionButton {
            anchors.verticalCenter: parent.verticalCenter
            iconName: "skip_previous"
            buttonSize: root.sideSize
            iconSize: Theme.iconSize
            iconColor: Theme.surfaceText
            opacity: RoonService.canPrevious ? 1 : 0.35
            enabled: root.enabled_ && RoonService.canPrevious
            onClicked: RoonService.previous()
        }

        Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            width: root.playSize
            height: root.playSize
            radius: root.playSize / 2
            color: playArea.pressed ? Qt.darker(Theme.primary, 1.15) : (playArea.containsMouse ? Qt.lighter(Theme.primary, 1.08) : Theme.primary)
            opacity: root.enabled_ ? 1 : 0.4

            Behavior on color {
                ColorAnimation {
                    duration: Theme.shortDuration
                }
            }

            DankIcon {
                anchors.centerIn: parent
                name: RoonService.isPlaying ? "pause" : "play_arrow"
                size: root.playSize * 0.55
                color: Theme.onPrimary
            }

            MouseArea {
                id: playArea
                anchors.fill: parent
                hoverEnabled: true
                enabled: root.enabled_
                cursorShape: Qt.PointingHandCursor
                onClicked: RoonService.playPause()
            }
        }

        DankActionButton {
            anchors.verticalCenter: parent.verticalCenter
            iconName: "skip_next"
            buttonSize: root.sideSize
            iconSize: Theme.iconSize
            iconColor: Theme.surfaceText
            opacity: RoonService.canNext ? 1 : 0.35
            enabled: root.enabled_ && RoonService.canNext
            onClicked: RoonService.next()
        }

        DankActionButton {
            anchors.verticalCenter: parent.verticalCenter
            visible: root.showModes
            iconName: RoonService.loop === "loop_one" ? "repeat_one" : "repeat"
            buttonSize: root.sideSize
            iconSize: Theme.iconSize - 4
            iconColor: RoonService.loop !== "disabled" ? Theme.primary : Theme.surfaceVariantText
            tooltipText: RoonService.loop === "loop_one" ? "Repeat one" : (RoonService.loop === "loop" ? "Repeat all" : "Repeat off")
            enabled: root.enabled_
            onClicked: RoonService.cycleLoop()
        }
    }
}
