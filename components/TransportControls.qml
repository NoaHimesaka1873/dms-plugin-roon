import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// shuffle · previous · play/pause · next · repeat, as Material 3 icon buttons
// like the built-in media card: a filled pill for play, standard buttons
// around it, shuffle and repeat as toggles.
Item {
    id: root

    property int playSize: 56
    property int sideSize: 40
    property bool showModes: true
    property color containerColor: RoonService.accentContainer
    property color onContainerColor: RoonService.onAccentContainer
    property color contentColor: Theme.surfaceText
    property color accentColor: RoonService.accent
    readonly property bool enabled_: RoonService.paired && RoonService.selectedZone !== null
    readonly property bool medium: playSize >= 52

    implicitHeight: medium ? Theme.buttonHeightM : Theme.buttonHeightS
    implicitWidth: row.implicitWidth

    Row {
        id: row
        anchors.centerIn: parent
        spacing: root.medium ? Theme.spacingS : Theme.spacingXS

        DankIconButton {
            anchors.verticalCenter: parent.verticalCenter
            visible: root.showModes
            size: root.medium ? "m" : "s"
            widthMode: "narrow"
            iconName: "shuffle"
            checkable: true
            checked: RoonService.shuffle
            containerColor: root.containerColor
            contentColor: root.onContainerColor
            iconColor: checked ? root.onContainerColor : root.contentColor
            enabled: root.enabled_
            tooltipText: RoonService.shuffle ? "Shuffle on" : "Shuffle off"
            Accessible.name: "Shuffle"
            onClicked: RoonService.setShuffle(!RoonService.shuffle)
        }

        DankIconButton {
            anchors.verticalCenter: parent.verticalCenter
            size: root.medium ? "m" : "s"
            iconName: "skip_previous"
            iconColor: root.contentColor
            enabled: root.enabled_ && RoonService.canPrevious
            opacity: enabled ? 1 : 0.38
            Accessible.name: "Previous"
            onClicked: RoonService.previous()
        }

        DankIconButton {
            anchors.verticalCenter: parent.verticalCenter
            size: root.medium ? "m" : "s"
            width: root.medium ? 96 : 72
            variant: "filled"
            round: false
            checkable: true
            checked: RoonService.isPlaying
            iconFilled: false
            radius: Theme.buttonRadius(width, height, buttonSize, pressed, checked)
            iconName: RoonService.isPlaying ? "pause" : "play_arrow"
            containerColor: root.containerColor
            contentColor: root.onContainerColor
            enabled: root.enabled_
            Accessible.name: RoonService.isPlaying ? "Pause" : "Play"
            onClicked: RoonService.playPause()
        }

        DankIconButton {
            anchors.verticalCenter: parent.verticalCenter
            size: root.medium ? "m" : "s"
            iconName: "skip_next"
            iconColor: root.contentColor
            enabled: root.enabled_ && RoonService.canNext
            opacity: enabled ? 1 : 0.38
            Accessible.name: "Next"
            onClicked: RoonService.next()
        }

        DankIconButton {
            anchors.verticalCenter: parent.verticalCenter
            visible: root.showModes
            size: root.medium ? "m" : "s"
            widthMode: "narrow"
            iconName: RoonService.loop === "loop_one" ? "repeat_one" : "repeat"
            checkable: true
            checked: RoonService.loop !== "disabled"
            containerColor: root.containerColor
            contentColor: root.onContainerColor
            iconColor: checked ? root.onContainerColor : root.contentColor
            enabled: root.enabled_
            tooltipText: RoonService.loop === "loop_one" ? "Repeat one" : (RoonService.loop === "loop" ? "Repeat all" : "Repeat off")
            Accessible.name: "Repeat"
            onClicked: RoonService.cycleLoop()
        }
    }
}
