import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Seek bar driven by RoonService.position (interpolated). Dragging previews
// the target and seeks on release.
Item {
    id: root

    property bool showTimes: true
    readonly property real length: RoonService.length
    readonly property bool seekable: RoonService.canSeek && length > 0
    property bool dragging: false
    property real dragValue: 0
    readonly property real shown: dragging ? dragValue : RoonService.position
    readonly property real fraction: length > 0 ? Math.max(0, Math.min(1, shown / length)) : 0

    implicitHeight: showTimes ? track.height + startLabel.implicitHeight + 2 : track.height
    Component.onCompleted: RoonService.acquire()
    Component.onDestruction: RoonService.release()

    Item {
        id: track
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        height: 16

        Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            width: parent.width
            height: 4
            radius: 2
            color: Theme.surfaceVariant
        }

        Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            width: parent.width * root.fraction
            height: 4
            radius: 2
            color: root.seekable ? Theme.primary : Theme.surfaceVariantText

            Behavior on width {
                enabled: !root.dragging
                NumberAnimation {
                    duration: 200
                    easing.type: Easing.OutQuad
                }
            }
        }

        Rectangle {
            x: parent.width * root.fraction - width / 2
            anchors.verticalCenter: parent.verticalCenter
            width: seekArea.containsMouse || root.dragging ? 14 : 10
            height: width
            radius: width / 2
            color: Theme.primary
            visible: root.seekable

            Behavior on width {
                NumberAnimation {
                    duration: Theme.shortDuration
                }
            }
        }

        MouseArea {
            id: seekArea
            anchors.fill: parent
            anchors.topMargin: -4
            anchors.bottomMargin: -4
            enabled: root.seekable
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onPressed: mouse => {
                root.dragging = true;
                root.dragValue = Math.max(0, Math.min(1, mouse.x / width)) * root.length;
            }
            onPositionChanged: mouse => {
                if (root.dragging)
                    root.dragValue = Math.max(0, Math.min(1, mouse.x / width)) * root.length;
            }
            onReleased: {
                if (!root.dragging)
                    return;
                root.dragging = false;
                RoonService.seek(root.dragValue);
            }
            onCanceled: root.dragging = false
        }
    }

    StyledText {
        id: startLabel
        anchors.left: parent.left
        anchors.top: track.bottom
        anchors.topMargin: 2
        text: RoonService.formatTime(root.shown)
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.surfaceVariantText
        visible: root.showTimes
    }

    StyledText {
        anchors.right: parent.right
        anchors.top: track.bottom
        anchors.topMargin: 2
        text: root.length > 0 ? RoonService.formatTime(root.length) : (RoonService.hasTrack ? "LIVE" : "")
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.surfaceVariantText
        visible: root.showTimes
    }
}
