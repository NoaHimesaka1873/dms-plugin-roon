import QtQuick
import QtQuick.Effects
import Quickshell.Widgets
import qs.Common

// Blurred album art filling its container, fading toward the surface colour
// at the bottom so controls stay legible in both light and dark themes.
ClippingRectangle {
    id: root

    property string source: ""
    property real artOpacity: 0.32

    radius: Theme.cornerRadius
    color: "transparent"
    antialiasing: true

    Image {
        id: img
        anchors.centerIn: parent
        width: Math.max(parent.width, parent.height) * 1.15
        height: width
        source: root.source
        sourceSize.width: 256
        sourceSize.height: 256
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
        visible: false
    }

    MultiEffect {
        anchors.fill: img
        source: img
        blurEnabled: true
        blurMax: 64
        blur: 1.0
        saturation: 0.15
        opacity: img.status === Image.Ready ? root.artOpacity : 0

        Behavior on opacity {
            NumberAnimation {
                duration: 400
                easing.type: Easing.InOutQuad
            }
        }
    }

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop {
                position: 0.0
                color: Theme.withAlpha(Theme.surface, 0.0)
            }
            GradientStop {
                position: 1.0
                color: Theme.withAlpha(Theme.surface, 0.6)
            }
        }
    }
}
