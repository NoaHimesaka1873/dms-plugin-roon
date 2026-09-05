import QtQuick
import Quickshell.Widgets
import qs.Common
import qs.Widgets

// Rounded album art with an icon placeholder. Keeps the previous image on
// screen until the new one has decoded so track changes don't flash.
Item {
    id: root

    property string source: ""
    property real radius: Theme.cornerRadius
    property string fallbackIcon: "album"
    property color fallbackColor: Theme.surfaceVariantText
    property color placeholderColor: Theme.surfaceContainerHigh
    readonly property bool ready: front.status === Image.Ready

    property string _frontSource: ""
    property string _backSource: ""

    onSourceChanged: {
        if (source === _frontSource)
            return;
        if (front.status === Image.Ready && _frontSource !== "")
            _backSource = _frontSource;
        _frontSource = source;
    }

    ClippingRectangle {
        anchors.fill: parent
        radius: root.radius
        color: root.placeholderColor

        DankIcon {
            anchors.centerIn: parent
            name: root.fallbackIcon
            size: Math.max(12, Math.min(parent.width, parent.height) * 0.5)
            color: root.fallbackColor
            visible: front.status !== Image.Ready && back.status !== Image.Ready
        }

        Image {
            id: back
            anchors.fill: parent
            source: root._backSource
            fillMode: Image.PreserveAspectCrop
            asynchronous: true
            cache: true
            visible: front.status !== Image.Ready && status === Image.Ready
        }

        Image {
            id: front
            anchors.fill: parent
            source: root._frontSource
            fillMode: Image.PreserveAspectCrop
            asynchronous: true
            cache: true
            smooth: true
            opacity: status === Image.Ready ? 1 : 0

            Behavior on opacity {
                NumberAnimation {
                    duration: Theme.shortDuration
                    easing.type: Theme.standardEasing
                }
            }

            onStatusChanged: {
                if (status === Image.Ready)
                    root._backSource = "";
            }
        }
    }
}
