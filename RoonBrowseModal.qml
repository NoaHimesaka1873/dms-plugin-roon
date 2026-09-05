import QtQuick
import Quickshell
import qs.Common
import qs.Modals.Common
import qs.Widgets
import "./services"
import "./components"

// Centered library browser, opened from launcher results or `dms ipc call roon browse`.
DankModal {
    id: root

    layerNamespace: "dms:plugins:roon-browse"
    modalWidth: 560
    modalHeight: 680
    shouldBeVisible: false
    onBackgroundClicked: close()

    content: Component {
        Item {
            anchors.fill: parent

            ArtBackdrop {
                anchors.fill: parent
                radius: root.cornerRadius
                visible: RoonService.paired && RoonService.hasTrack
                source: RoonService.nowPlayingArtUrl(512)
            }

            Column {
                anchors.fill: parent
                anchors.margins: Theme.spacingM
                spacing: Theme.spacingM

                Item {
                    id: header
                    width: parent.width
                    height: 36

                    RoonGlyph {
                        anchors.left: parent.left
                        anchors.verticalCenter: parent.verticalCenter
                        cropped: true
                        size: 18
                        color: Theme.surfaceText
                    }

                    StyledText {
                        anchors.centerIn: parent
                        text: RoonService.selectedZone ? RoonService.selectedZone.name : ""
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                    }

                    DankActionButton {
                        anchors.right: parent.right
                        anchors.verticalCenter: parent.verticalCenter
                        iconName: "close"
                        buttonSize: 32
                        iconSize: Theme.iconSize - 4
                        onClicked: root.close()
                    }
                }

                BrowserView {
                    width: parent.width
                    height: parent.height - header.height - Theme.spacingM
                }
            }
        }
    }
}
