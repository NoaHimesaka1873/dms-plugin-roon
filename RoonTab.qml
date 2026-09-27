import QtQuick
import qs.Common
import qs.Widgets
import qs.Modules.Plugins
import qs.Modules.DankDash
import qs.Modules.DankDash.Overview
import "./services"
import "./components"

// Dash tab: the popout's sections as dash widgets the user can move, resize,
// hide and add back (Now playing, Lyrics, Queue, Zones, Volume, Browse).
DashTabComponent {
    id: root

    widgetGrid: grid
    focusTarget: grid.focusTarget
    implicitHeight: RoonService.paired ? grid.implicitHeight : DashMetrics.tabMinHeight

    menuActions: [
        {
            label: "Open Roon",
            iconName: "open_in_new",
            visible: RoonService.roonAppAvailable,
            action: () => RoonService.openRoonApp()
        },
        {
            label: "Plugin settings",
            iconName: "settings",
            action: () => PopoutService.openSettingsWithTab("plugins")
        }
    ]

    function handleKeyEvent(event) {
        if (grid.handleKeyEvent(event))
            return true;
        if (editMode || !RoonService.paired)
            return false;
        if (event.key === Qt.Key_Space && !(event.modifiers & Qt.ControlModifier)) {
            RoonService.playPause();
            return true;
        }
        return false;
    }

    ConnectionState {
        anchors.fill: parent
        visible: !RoonService.paired
    }

    DashWidgetGrid {
        id: grid
        width: parent.width
        visible: RoonService.paired
        entryId: root.entryId
        live: root.live
        editMode: root.editMode
        definitions: [
            {
                id: "nowPlaying",
                text: "Now playing",
                icon: "play_circle",
                component: nowPlayingWidget,
                w: 2,
                h: 3,
                minW: 2,
                minH: 3,
                maxW: 4,
                maxH: 5
            },
            {
                id: "lyrics",
                text: "Lyrics",
                icon: "lyrics",
                component: lyricsWidget,
                w: 2,
                h: 3,
                minW: 1,
                minH: 2,
                maxW: 4,
                maxH: 6
            },
            {
                id: "queue",
                text: "Queue",
                icon: "queue_music",
                component: queueWidget,
                w: 2,
                h: 3,
                minW: 2,
                minH: 2,
                maxW: 4,
                maxH: 6
            },
            {
                id: "zones",
                text: "Zones",
                icon: "speaker_group",
                component: zonesWidget,
                w: 2,
                h: 2,
                minW: 2,
                minH: 2,
                maxW: 4,
                maxH: 5
            },
            {
                id: "volume",
                text: "Volume",
                icon: "volume_up",
                component: volumeWidget,
                w: 2,
                h: 1,
                minW: 2,
                minH: 1,
                maxW: 4,
                maxH: 3
            },
            {
                id: "browse",
                text: "Browse",
                icon: "library_music",
                component: browseWidget,
                w: 4,
                h: 4,
                minW: 2,
                minH: 3,
                maxW: 4,
                maxH: 6,
                enabled: false
            }
        ]
    }

    Component {
        id: nowPlayingWidget

        Card {
            id: npCard
            property bool live: false
            readonly property bool ticking: live && visible && RoonService.hasTrack

            onTickingChanged: ticking ? RoonService.acquire() : RoonService.release()
            Component.onDestruction: {
                if (ticking)
                    RoonService.release();
            }

            ArtBackdrop {
                anchors.fill: parent
                anchors.margins: -npCard.pad
                radius: npCard.radius
                visible: RoonService.hasTrack && npCard.live
                source: npCard.live ? RoonService.nowPlayingArtUrl(512) : ""
            }

            NowPlayingPanel {
                anchors.fill: parent
                textColor: npCard.contentColor
                mutedColor: npCard.mutedColor
            }
        }
    }

    Component {
        id: lyricsWidget

        Card {
            id: lyricsCard
            property bool live: false
            pad: 0

            RoonLyrics {
                anchors.fill: parent
                live: lyricsCard.live
                radius: lyricsCard.radius
            }
        }
    }

    Component {
        id: queueWidget

        Card {
            title: "Queue"
            pad: Theme.spacingS

            QueueList {
                anchors.fill: parent
            }
        }
    }

    Component {
        id: zonesWidget

        Card {
            title: "Zones"
            pad: Theme.spacingS

            ZonePicker {
                anchors.fill: parent
            }
        }
    }

    Component {
        id: volumeWidget

        Card {
            id: volumeCard

            Flickable {
                anchors.fill: parent
                contentHeight: volumeColumn.implicitHeight
                clip: true
                boundsBehavior: Flickable.StopAtBounds

                Column {
                    id: volumeColumn
                    width: parent.width
                    y: Math.max(0, (volumeCard.height - volumeCard.pad * 2 - implicitHeight) / 2)
                    spacing: Theme.spacingS

                    Repeater {
                        model: RoonService.outputs

                        VolumeRow {
                            required property var modelData
                            width: volumeColumn.width
                            output: modelData
                        }
                    }

                    StyledText {
                        width: parent.width
                        visible: RoonService.outputs.length === 0
                        horizontalAlignment: Text.AlignHCenter
                        text: "No outputs"
                        font.pixelSize: Theme.fontSizeSmall
                        color: volumeCard.mutedColor
                    }
                }
            }
        }
    }

    Component {
        id: browseWidget

        Card {
            pad: Theme.spacingS

            BrowserView {
                anchors.fill: parent
            }
        }
    }
}
