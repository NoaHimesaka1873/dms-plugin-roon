import QtQuick
import qs.Common
import qs.Modules.Plugins
import qs.Widgets
import "./services"

PluginSettings {
    id: root
    pluginId: "roon"

    readonly property var sizeOptions: [
        { label: "Small", value: "0" },
        { label: "Medium", value: "1" },
        { label: "Large", value: "2" },
        { label: "Largest", value: "3" }
    ]

    function sizeLabel(v) {
        const o = sizeOptions.find(x => x.value === String(v));
        return o ? o.label : "Large";
    }

    Component.onCompleted: RoonService.detectRoonApp()

    // ---- Connection --------------------------------------------------------------
    StyledText {
        width: parent.width
        text: "Connection"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    StyledText {
        width: parent.width
        text: {
            const s = RoonService.connectionState;
            if (s === "paired")
                return "Connected to " + RoonService.coreName + " (" + RoonService.coreHost + ":" + RoonService.coreHttpPort + ")";
            if (s === "unauthorized")
                return "Found " + RoonService.coreName + " — enable \"DMS Roon\" in Roon → Settings → Extensions";
            if (s === "discovering")
                return "Looking for Roon Server…";
            if (RoonService.bridgeState === "crashed")
                return "Bridge crashed — check the shell log";
            return "Disconnected";
        }
        font.pixelSize: Theme.fontSizeSmall
        color: RoonService.connectionState === "paired" ? Theme.primary : Theme.surfaceVariantText
        wrapMode: Text.WordWrap
    }

    Row {
        spacing: Theme.spacingS

        DankButton {
            text: "Restart bridge"
            iconName: "restart_alt"
            onClicked: RoonService.restartBridge()
        }

        DankButton {
            text: "Re-pair"
            iconName: "link_off"
            onClicked: RoonService.forgetCore()
        }
    }

    SelectionSetting {
        settingKey: "connectionMode"
        label: "Connection mode"
        description: "Discovery finds Roon Server on the LAN; manual connects to a host directly"
        options: [
            { label: "Auto-discover", value: "discovery" },
            { label: "Manual host", value: "manual" }
        ]
        defaultValue: "discovery"
    }

    StringSetting {
        settingKey: "manualHost"
        label: "Manual host"
        description: "Roon Server IP or hostname (manual mode only)"
        placeholder: "192.168.0.10"
        defaultValue: ""
    }

    StringSetting {
        settingKey: "manualPort"
        label: "Manual port"
        description: "Roon Server API port (usually 9330)"
        placeholder: "9330"
        defaultValue: "9330"
    }

    StringSetting {
        settingKey: "defaultZoneName"
        label: "Preferred zone"
        description: "Zone to select at startup (empty: remember the last one)"
        placeholder: "Living Room"
        defaultValue: ""
    }

    ToggleSetting {
        settingKey: "mprisEnabled"
        label: "MPRIS bridge"
        description: "Expose the selected zone as an MPRIS player (media keys, playerctl, DMS media widget)"
        defaultValue: true
    }

    // ---- Lyrics --------------------------------------------------------------------
    StyledText {
        width: parent.width
        topPadding: Theme.spacingM
        text: "Lyrics"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    ToggleSetting {
        settingKey: "lyricsDisplayZone"
        label: "Lyrics from Roon"
        description: "Connects as a Roon web display (it shows up in Roon → Settings → Displays) so Roon sends the lyrics of what's playing. They show up in the dash Media tab through the MPRIS bridge, and in the Roon dash tab. Toggling restarts the bridge."
        defaultValue: true
    }

    StyledText {
        width: parent.width
        visible: RoonService.lyricsDisplayEnabled && RoonService.paired
        text: RoonService.lyrics ? "Receiving lyrics for " + (RoonService.selectedZone ? RoonService.selectedZone.name : "the selected zone") : "Roon has no lyrics for the current track"
        font.pixelSize: Theme.fontSizeSmall
        color: RoonService.lyrics ? Theme.primary : Theme.surfaceVariantText
        wrapMode: Text.WordWrap
    }

    // ---- Now playing ---------------------------------------------------------------
    StyledText {
        width: parent.width
        topPadding: Theme.spacingM
        text: "Now playing"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    SelectionSetting {
        settingKey: "seekStyle"
        label: "Seek bar style"
        description: "Spectrum draws Roon's waveform of the track (needs Lyrics from Roon, falls back to Wavy)"
        options: [
            { label: "Flat", value: "flat" },
            { label: "Wavy", value: "wavy" },
            { label: "Spectrum", value: "spectrum" }
        ]
        defaultValue: "spectrum"
    }

    // ---- Bar widget --------------------------------------------------------------
    StyledText {
        width: parent.width
        topPadding: Theme.spacingM
        text: "Bar widget"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    SelectionSetting {
        settingKey: "pillSize"
        label: "Size"
        description: "Text width of the plain Roon widget (same scale as the built-in media widget)"
        options: root.sizeOptions
        defaultValue: "2"
    }

    SelectionSetting {
        settingKey: "pillClickOpens"
        label: "Click opens"
        description: "What clicking the widget opens"
        options: [
            { label: "Popout", value: "popout" },
            { label: "Roon dash tab", value: "dash" }
        ]
        defaultValue: "popout"
    }

    ToggleSetting {
        settingKey: "pillAdaptiveWidth"
        label: "Fit to title"
        description: "Shrink the widget when the title is shorter than the size limit"
        defaultValue: true
    }

    SelectionSetting {
        settingKey: "pillFormat"
        label: "Text format"
        options: [
            { label: "Title • Artist", value: "title-artist" },
            { label: "Artist – Title", value: "artist-title" },
            { label: "Title only", value: "title" }
        ]
        defaultValue: "title-artist"
    }

    SelectionSetting {
        settingKey: "pillIcon"
        label: "Bar icon"
        description: "Icon shown at the start of the pill"
        options: [
            { label: "None", value: "none" },
            { label: "Note", value: "note" },
            { label: "Roon logo", value: "logo" },
            { label: "Album art", value: "art" }
        ]
        defaultValue: "logo"
    }

    ToggleSetting {
        settingKey: "pillShowWhenIdle"
        label: "Show when idle"
        description: "Keep the widget visible while nothing is playing or Roon is unreachable"
        defaultValue: false
    }

    SelectionSetting {
        settingKey: "pillScrollMode"
        label: "Scroll action"
        description: "What the mouse wheel does over the widget"
        options: [
            { label: "Volume", value: "volume" },
            { label: "Change track", value: "song" },
            { label: "Nothing", value: "nothing" }
        ]
        defaultValue: "volume"
    }

    SliderSetting {
        settingKey: "wheelVolumeStep"
        label: "Scroll volume step"
        description: "Volume steps per mouse-wheel notch"
        defaultValue: 2
        minimum: 1
        maximum: 10
        unit: ""
    }

    // Sized variants: each becomes its own bar widget ("Roon: <name>") so
    // different bars can use different sizes, like the built-in media widget.
    StyledText {
        width: parent.width
        topPadding: Theme.spacingS
        text: "Sized variants"
        font.pixelSize: Theme.fontSizeMedium
        font.weight: Font.Medium
        color: Theme.surfaceText
    }

    StyledText {
        width: parent.width
        text: "Add a variant to get an extra \"Roon: <name>\" widget in the DankBar widget list with its own size."
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.surfaceVariantText
        wrapMode: Text.WordWrap
    }

    Column {
        width: parent.width
        spacing: Theme.spacingXS

        Repeater {
            model: root.variantsModel

            delegate: Rectangle {
                required property var model
                width: parent.width
                height: 40
                radius: Theme.cornerRadius
                color: Theme.surfaceContainerHigh

                Row {
                    anchors.fill: parent
                    anchors.leftMargin: Theme.spacingM
                    anchors.rightMargin: Theme.spacingXS
                    spacing: Theme.spacingS

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        width: parent.width - 120 - 32 - Theme.spacingS * 2
                        text: "Roon: " + model.name
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceText
                        elide: Text.ElideRight
                    }

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        width: 120
                        horizontalAlignment: Text.AlignRight
                        text: root.sizeLabel(model.pillSize)
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                    }

                    DankActionButton {
                        anchors.verticalCenter: parent.verticalCenter
                        iconName: "delete"
                        buttonSize: 32
                        iconSize: Theme.iconSize - 4
                        onClicked: root.removeVariant(model.id)
                    }
                }
            }
        }
    }

    Row {
        width: parent.width
        spacing: Theme.spacingS

        Rectangle {
            width: parent.width - sizePicker.width - addButton.width - Theme.spacingS * 2
            height: 40
            radius: Theme.cornerRadius
            color: Theme.surfaceContainerHigh
            border.width: nameInput.activeFocus ? 2 : 1
            border.color: nameInput.activeFocus ? Theme.primary : Theme.withAlpha(Theme.outline, 0.3)

            TextInput {
                id: nameInput
                anchors.fill: parent
                anchors.leftMargin: Theme.spacingM
                anchors.rightMargin: Theme.spacingM
                verticalAlignment: TextInput.AlignVCenter
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceText
                selectionColor: Theme.primary
                selectedTextColor: Theme.onPrimary
                clip: true

                StyledText {
                    anchors.verticalCenter: parent.verticalCenter
                    text: "Variant name (e.g. Compact)"
                    visible: nameInput.text.length === 0 && !nameInput.activeFocus
                    font.pixelSize: Theme.fontSizeMedium
                    color: Theme.surfaceVariantText
                }
            }
        }

        DankDropdown {
            id: sizePicker
            anchors.verticalCenter: parent.verticalCenter
            property string sizeValue: "0"
            compactMode: true
            dropdownWidth: 130
            options: root.sizeOptions.map(o => o.label)
            currentValue: root.sizeLabel(sizeValue)
            onValueChanged: value => {
                const o = root.sizeOptions.find(x => x.label === value);
                if (o)
                    sizeValue = o.value;
            }
        }

        DankButton {
            id: addButton
            anchors.verticalCenter: parent.verticalCenter
            text: "Add"
            iconName: "add"
            onClicked: {
                const name = nameInput.text.trim() || root.sizeLabel(sizePicker.sizeValue);
                root.createVariant(name, { pillSize: sizePicker.sizeValue });
                nameInput.text = "";
            }
        }
    }

    // ---- Desktop widget ----------------------------------------------------------
    StyledText {
        width: parent.width
        topPadding: Theme.spacingM
        text: "Desktop widget"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    SliderSetting {
        settingKey: "desktopOpacity"
        label: "Background opacity"
        defaultValue: 80
        minimum: 0
        maximum: 100
        unit: "%"
    }

    ToggleSetting {
        settingKey: "desktopForceSquare"
        label: "Album art only"
        description: "Show just the album art as a tile"
        defaultValue: false
    }

    // ---- Roon app ------------------------------------------------------------------
    StyledText {
        width: parent.width
        topPadding: Theme.spacingM
        text: "Roon app"
        font.pixelSize: Theme.fontSizeLarge
        font.weight: Font.Bold
        color: Theme.surfaceText
    }

    StyledText {
        width: parent.width
        text: {
            if (RoonService.roonInstalled)
                return "Roon desktop app found in Bottles" + (RoonService.bottlesKind === "flatpak" ? " (Flatpak)" : "") + ". \"Open in Roon\" focuses or launches it.";
            if (RoonService.bottlesKind !== "none")
                return "Bottles is installed but no Roon bottle was found. \"Set up Roon in Bottles\" creates the bottle and opens Bottles, where Install Programs → Roon applies the official Roon installer manifest (.NET Desktop 10 + Roon).";
            return "Bottles is not installed, so \"Open in Roon\" is hidden. Install Bottles (Flatpak or native) and Roon into a bottle named \"Roon\" to enable it.";
        }
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.surfaceVariantText
        wrapMode: Text.WordWrap
    }

    Row {
        spacing: Theme.spacingS

        DankButton {
            visible: RoonService.roonAppAvailable
            text: "Open Roon"
            iconName: "open_in_new"
            onClicked: RoonService.openRoonApp()
        }

        DankButton {
            visible: RoonService.bottlesKind !== "none" && !RoonService.roonInstalled
            text: "Set up Roon in Bottles"
            iconName: "download"
            onClicked: RoonService.installRoonApp()
        }

        DankButton {
            text: "Re-detect"
            iconName: "refresh"
            onClicked: RoonService.detectRoonApp()
        }
    }

    StringSetting {
        settingKey: "roonWindowTitle"
        label: "Roon window title"
        description: "\"Open in Roon\" focuses the window with this title if it exists"
        placeholder: "Roon"
        defaultValue: "Roon"
    }

    StringSetting {
        settingKey: "roonAppCommand"
        label: "Launch command override"
        description: "Leave empty to use Bottles (auto-detected)"
        placeholder: "bottles-cli run -p Roon -b Roon"
        defaultValue: ""
    }
}
