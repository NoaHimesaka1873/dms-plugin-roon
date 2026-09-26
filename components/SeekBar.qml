import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Seek bar driven by RoonService.position (interpolated). Dragging previews
// the target and seeks on release. Three looks (plugin setting "Seek bar
// style"): flat and wavy match the built-in media widget, spectrum draws
// Roon's loudness outline for the track like Roon's own now playing screen
// and falls back to wavy when Roon has no waveform for it.
Item {
    id: root

    property bool showTimes: true
    property string style: RoonService.seekStyle
    property real waveHeight: 32
    property color accentColor: RoonService.accent
    property color trackColor: Theme.withAlpha(accentColor, 0.28)
    property color labelColor: Theme.surfaceVariantText

    readonly property real length: RoonService.length
    readonly property bool seekable: RoonService.canSeek && length > 0
    property bool dragging: false
    property real dragValue: 0
    readonly property real shown: dragging ? dragValue : RoonService.position
    readonly property real fraction: length > 0 ? Math.max(0, Math.min(1, shown / length)) : 0

    readonly property var wave: RoonService.waveform
    readonly property string effectiveStyle: style === "spectrum" && !(wave.length > 0 && length > 0) ? "wavy" : style
    // One 1px bar every 2px, each a point sample, the way Roon's display draws it.
    readonly property var bars: {
        if (effectiveStyle !== "spectrum")
            return [];
        const n = Math.max(1, Math.floor(width / 2));
        const out = [];
        for (let i = 0; i < n; i++)
            out.push(wave[Math.min(wave.length - 1, Math.round(i / n * wave.length))] || 0);
        return out;
    }

    implicitHeight: showTimes ? track.height + startLabel.implicitHeight + 2 : track.height
    Component.onCompleted: RoonService.acquire()
    Component.onDestruction: RoonService.release()

    Item {
        id: track
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        height: root.effectiveStyle === "spectrum" ? root.waveHeight : 20

        // Flat: the built-in widget's line with a playhead.
        Item {
            anchors.fill: parent
            visible: root.effectiveStyle === "flat"

            Rectangle {
                width: parent.width
                height: 3
                anchors.verticalCenter: parent.verticalCenter
                radius: 1.5
                color: root.trackColor
            }

            Rectangle {
                width: parent.width * root.fraction
                height: 3
                anchors.verticalCenter: parent.verticalCenter
                radius: 1.5
                color: root.accentColor
            }
        }

        // Wavy: the built-in widget's Material 3 expressive wave.
        Loader {
            anchors.fill: parent
            active: root.effectiveStyle === "wavy"
            sourceComponent: M3WaveProgress {
                value: root.fraction
                fillColor: root.accentColor
                playheadColor: root.accentColor
                trackColor: root.trackColor
                isPlaying: RoonService.isPlaying && !root.dragging
            }
        }

        // Spectrum: Roon's waveform.
        Row {
            anchors.verticalCenter: parent.verticalCenter
            spacing: 1
            visible: root.effectiveStyle === "spectrum"

            Repeater {
                model: root.bars

                Rectangle {
                    required property real modelData
                    required property int index
                    anchors.verticalCenter: parent.verticalCenter
                    width: 1
                    height: Math.max(1, modelData * root.waveHeight)
                    color: (index + 0.5) / root.bars.length <= root.fraction ? root.accentColor : root.trackColor
                }
            }
        }

        // Playhead for flat and spectrum (the wave draws its own).
        Rectangle {
            visible: root.seekable && root.effectiveStyle !== "wavy"
            x: Math.max(0, Math.min(parent.width, parent.width * root.fraction)) - width / 2
            anchors.verticalCenter: parent.verticalCenter
            width: 3
            height: root.effectiveStyle === "spectrum" ? parent.height + 4 : 14
            radius: 1.5
            color: root.accentColor
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
        color: root.labelColor
        visible: root.showTimes
    }

    StyledText {
        anchors.right: parent.right
        anchors.top: track.bottom
        anchors.topMargin: 2
        text: root.length > 0 ? RoonService.formatTime(root.length) : (RoonService.hasTrack ? "LIVE" : "")
        font.pixelSize: Theme.fontSizeSmall
        color: root.labelColor
        visible: root.showTimes
    }
}
