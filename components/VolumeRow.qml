import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// One output's volume: mute button, slider (or +/- for incremental
// controls) and the current value in the output's native unit.
Item {
    id: root

    required property var output
    readonly property var volume: output ? output.volume : null
    readonly property bool hasVolume: volume !== null && volume !== undefined
    readonly property bool incremental: hasVolume && volume.type === "incremental"
    readonly property real step: hasVolume && volume.step ? volume.step : 1
    readonly property bool muted: hasVolume && !!volume.isMuted
    readonly property string unit: hasVolume && volume.type === "db" ? " dB" : ""
    property bool _syncing: false

    implicitHeight: hasVolume ? controls.height : 24

    function fmt(v) {
        if (!hasVolume)
            return "";
        const n = Number(v);
        return (Number.isInteger(n) ? n : n.toFixed(1)) + unit;
    }

    Timer {
        id: sendTimer
        interval: 120
        onTriggered: {
            if (!root.hasVolume)
                return;
            RoonService.setVolume(root.output.outputId, slider.value * root.step);
        }
    }

    // Outputs without volume control (fixed-volume DACs) just show their name.
    Row {
        anchors.left: parent.left
        anchors.verticalCenter: parent.verticalCenter
        spacing: Theme.spacingS
        visible: !root.hasVolume

        DankIcon {
            anchors.verticalCenter: parent.verticalCenter
            name: "speaker"
            size: Theme.iconSize - 4
            color: Theme.surfaceVariantText
        }

        StyledText {
            anchors.verticalCenter: parent.verticalCenter
            text: (root.output ? root.output.name : "") + " · fixed volume"
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.surfaceVariantText
        }
    }

    Row {
        id: rowLayout
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        spacing: Theme.spacingS
        visible: root.hasVolume

        DankActionButton {
            anchors.verticalCenter: parent.verticalCenter
            iconName: root.muted ? "volume_off" : (root.hasVolume && !root.incremental && root.volume.value <= root.volume.min + (root.volume.max - root.volume.min) * 0.05 ? "volume_mute" : "volume_up")
            iconColor: root.muted ? Theme.error : Theme.surfaceText
            buttonSize: 32
            iconSize: Theme.iconSize - 4
            tooltipText: root.muted ? "Unmute" : "Mute"
            onClicked: RoonService.toggleMute(root.output.outputId)
        }

        Column {
            id: controls
            anchors.verticalCenter: parent.verticalCenter
            width: parent.width - 32 - Theme.spacingS
            height: labelRow.height + (root.incremental ? incRow.height : slider.height)
            spacing: 0

            Row {
                id: labelRow
                width: parent.width
                height: 18

                StyledText {
                    width: parent.width - valueLabel.width
                    text: root.output ? root.output.name : ""
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceVariantText
                    elide: Text.ElideRight
                }

                StyledText {
                    id: valueLabel
                    text: root.incremental ? "" : root.fmt(slider.isDragging ? slider.value * root.step : root.volume.value)
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.surfaceText
                }
            }

            DankSlider {
                id: slider
                width: parent.width
                visible: !root.incremental
                minimum: root.hasVolume && !root.incremental ? Math.round(root.volume.min / root.step) : 0
                maximum: root.hasVolume && !root.incremental ? Math.round(root.volume.max / root.step) : 100
                value: root.hasVolume && !root.incremental ? Math.round(root.volume.value / root.step) : 0
                showValue: false
                unit: ""
                opacity: root.muted ? 0.5 : 1
                onSliderValueChanged: newValue => {
                    if (!root.hasVolume || Math.round(root.volume.value / root.step) === newValue)
                        return;
                    sendTimer.restart();
                }
                onSliderDragFinished: finalValue => {
                    sendTimer.stop();
                    RoonService.setVolume(root.output.outputId, finalValue * root.step);
                }
            }

            Row {
                id: incRow
                visible: root.incremental
                height: 32
                spacing: Theme.spacingS

                DankActionButton {
                    iconName: "remove"
                    buttonSize: 28
                    onClicked: RoonService.volumeStep(root.output.outputId, -1)
                }

                DankActionButton {
                    iconName: "add"
                    buttonSize: 28
                    onClicked: RoonService.volumeStep(root.output.outputId, 1)
                }
            }
        }
    }
}
