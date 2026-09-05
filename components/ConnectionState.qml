import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Shown instead of the player while the bridge is not paired with a core.
Item {
    id: root

    readonly property string state_: RoonService.connectionState
    readonly property bool crashed: RoonService.bridgeState === "crashed" || RoonService.bridgeState === "stopped"

    readonly property string icon: {
        if (crashed)
            return "error";
        if (state_ === "unauthorized")
            return "extension";
        if (state_ === "discovering" || state_ === "starting")
            return "radar";
        return "cloud_off";
    }

    readonly property string headline: {
        if (crashed)
            return "Roon bridge is not running";
        if (state_ === "unauthorized")
            return "Enable DMS Roon in Roon";
        if (state_ === "discovering" || state_ === "starting")
            return "Looking for Roon Server…";
        return "Roon Server is offline";
    }

    readonly property string detail: {
        if (crashed)
            return "Check the shell log, then restart the bridge.";
        if (state_ === "unauthorized")
            return "Found " + RoonService.coreName + ". Open Roon → Settings → Extensions and press Enable next to \"DMS Roon\".";
        if (state_ === "discovering" || state_ === "starting")
            return "Waiting for a Roon Server on the local network.";
        return "Retrying automatically. Start Roon Server, or check the manual host in the plugin settings.";
    }

    Column {
        anchors.centerIn: parent
        width: parent.width - Theme.spacingXL * 2
        spacing: Theme.spacingM

        DankIcon {
            anchors.horizontalCenter: parent.horizontalCenter
            name: root.icon
            size: 48
            color: root.crashed ? Theme.error : Theme.primary
        }

        StyledText {
            width: parent.width
            horizontalAlignment: Text.AlignHCenter
            text: root.headline
            font.pixelSize: Theme.fontSizeLarge
            font.weight: Font.Medium
            color: Theme.surfaceText
            wrapMode: Text.WordWrap
        }

        StyledText {
            width: parent.width
            horizontalAlignment: Text.AlignHCenter
            text: root.detail
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.surfaceVariantText
            wrapMode: Text.WordWrap
        }

        Row {
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: Theme.spacingS

            DankButton {
                visible: root.state_ === "unauthorized" && RoonService.roonAppAvailable
                text: "Open Roon"
                iconName: "open_in_new"
                onClicked: RoonService.openRoonApp()
            }

            DankButton {
                text: root.crashed ? "Start bridge" : "Retry"
                iconName: "refresh"
                onClicked: RoonService.restartBridge()
            }
        }
    }
}
