import QtQuick
import qs.Common
import qs.Widgets
import "../services"

// Library browser: home / back / breadcrumb, search field, paged item list.
Item {
    id: root

    property string pendingInputKey: ""
    readonly property real contentHeight: navRow.height + searchBox.height + Theme.spacingS * 2 + (RoonService.browseItems.length > 0 ? list.contentHeight : 140)

    Component.onCompleted: {
        if (RoonService.browseItems.length === 0 && RoonService.paired)
            RoonService.browseHome();
    }

    Connections {
        target: RoonService
        function onCoreConnected() {
            RoonService.browseHome();
        }
    }

    // Icons for Roon's well-known sections and actions; anything else falls back by kind.
    readonly property var titleIcons: [
        [/^library$/i, "library_music"],
        [/^explore$/i, "explore"],
        [/^artists?$/i, "person"],
        [/^albums?$/i, "album"],
        [/^tracks?$/i, "music_note"],
        [/^composers?$/i, "piano"],
        [/^genres?$/i, "category"],
        [/^tags?$/i, "sell"],
        [/^playlists?$/i, "queue_music"],
        [/radio$/i, "radio"],
        [/^tidal$/i, "waves"],
        [/^qobuz$/i, "graphic_eq"],
        [/^kkbox$/i, "graphic_eq"],
        [/^settings$/i, "settings"],
        [/^search/i, "search"],
        [/^history$/i, "history"],
        [/^(recent|new)/i, "schedule"],
        [/^(favou?rites?|bookmarks?)$/i, "favorite"],
        [/^(works?|compositions?)$/i, "music_note"],
        [/^play (album|artist|now|playlist|track|composer|genre|tag)/i, "play_arrow"],
        [/^shuffle/i, "shuffle"],
        [/^queue$/i, "playlist_add"],
        [/^add next$/i, "playlist_play"],
        [/^start radio$/i, "radio"]
    ]

    function iconForTitle(title) {
        for (const [re, icon] of titleIcons)
            if (re.test(title))
                return icon;
        return "";
    }

    function activate(item) {
        if (!item || !item.itemKey)
            return;
        if (item.hint === "header")
            return;
        if (item.inputPrompt) {
            root.pendingInputKey = item.itemKey;
            searchField.placeholder = item.inputPrompt.prompt || "Search";
            searchField.forceActiveFocus();
            return;
        }
        RoonService.browseItem(item.itemKey);
    }

    Column {
        anchors.fill: parent
        spacing: Theme.spacingS

        Row {
            id: navRow
            width: parent.width
            spacing: Theme.spacingXS

            DankActionButton {
                anchors.verticalCenter: parent.verticalCenter
                iconName: "home"
                buttonSize: 32
                iconSize: Theme.iconSize - 4
                tooltipText: "Library home"
                onClicked: RoonService.browseHome()
            }

            DankActionButton {
                anchors.verticalCenter: parent.verticalCenter
                iconName: "arrow_back"
                buttonSize: 32
                iconSize: Theme.iconSize - 4
                enabled: RoonService.browseBreadcrumbs.length > 1
                opacity: enabled ? 1 : 0.35
                tooltipText: "Back"
                onClicked: RoonService.browseBack()
            }

            StyledText {
                anchors.verticalCenter: parent.verticalCenter
                width: parent.width - 32 * 3 - Theme.spacingXS * 3
                text: {
                    const c = RoonService.browseBreadcrumbs;
                    if (c.length === 0)
                        return "Library";
                    return c.length > 2 ? "… › " + c.slice(-2).join(" › ") : c.join(" › ");
                }
                font.pixelSize: Theme.fontSizeMedium
                font.weight: Font.Medium
                color: Theme.surfaceText
                elide: Text.ElideLeft
            }

            DankActionButton {
                anchors.verticalCenter: parent.verticalCenter
                iconName: "refresh"
                buttonSize: 32
                iconSize: Theme.iconSize - 4
                tooltipText: "Refresh"
                onClicked: RoonService.browseRefresh()
            }
        }

        Rectangle {
            id: searchBox
            width: parent.width
            height: 36
            radius: Theme.cornerRadius
            color: Theme.surfaceContainerHigh
            border.width: searchField.activeFocus ? 2 : 1
            border.color: searchField.activeFocus ? Theme.primary : Theme.withAlpha(Theme.outline, 0.3)

            Row {
                anchors.fill: parent
                anchors.leftMargin: Theme.spacingS
                anchors.rightMargin: Theme.spacingXS
                spacing: Theme.spacingXS

                DankIcon {
                    anchors.verticalCenter: parent.verticalCenter
                    name: "search"
                    size: Theme.iconSize - 4
                    color: Theme.surfaceVariantText
                }

                TextInput {
                    id: searchField
                    property string placeholder: "Search Roon library"
                    anchors.verticalCenter: parent.verticalCenter
                    width: parent.width - (Theme.iconSize - 4) - 28 - Theme.spacingXS * 2
                    font.pixelSize: Theme.fontSizeMedium
                    color: Theme.surfaceText
                    selectionColor: Theme.primary
                    selectedTextColor: Theme.onPrimary
                    clip: true
                    onAccepted: {
                        const q = text.trim();
                        if (!q)
                            return;
                        if (root.pendingInputKey) {
                            RoonService.browseInput(root.pendingInputKey, q);
                            root.pendingInputKey = "";
                        } else {
                            RoonService.browseSearch(q);
                        }
                    }

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: searchField.placeholder
                        visible: searchField.text.length === 0 && !searchField.activeFocus
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceVariantText
                    }
                }

                DankActionButton {
                    anchors.verticalCenter: parent.verticalCenter
                    iconName: "close"
                    buttonSize: 28
                    iconSize: Theme.iconSizeSmall
                    visible: searchField.text.length > 0
                    onClicked: {
                        searchField.text = "";
                        root.pendingInputKey = "";
                        searchField.placeholder = "Search Roon library";
                    }
                }
            }
        }

        Item {
            width: parent.width
            height: parent.height - navRow.height - searchBox.height - Theme.spacingS * 2

            DankListView {
                id: list
                anchors.fill: parent
                clip: true
                spacing: 2
                model: RoonService.browseItems
                onContentYChanged: {
                    if (contentHeight - (contentY + height) < 200)
                        RoonService.loadMore();
                }

                delegate: Rectangle {
                    id: row
                    required property var modelData
                    readonly property bool isHeader: modelData.hint === "header"
                    readonly property bool isAction: modelData.hint === "action"
                    readonly property bool isPlayable: modelData.hint === "action" || modelData.hint === "action_list"
                    readonly property bool isPlayVerb: /^(play|queue|add|start|shuffle)\b/i.test(modelData.title || "")
                    readonly property bool isTrack: modelData.hint === "action_list" && !isPlayVerb
                    readonly property bool isList: modelData.hint === "list" || modelData.hint === null
                    readonly property string kindIcon: {
                        if (modelData.inputPrompt)
                            return "search";
                        const named = root.iconForTitle(modelData.title || "");
                        if (named)
                            return named;
                        if (isPlayVerb)
                            return "play_arrow";
                        if (isTrack)
                            return "music_note";
                        if (isList)
                            return "folder";
                        return "play_arrow";
                    }

                    width: list.width
                    height: isHeader ? 32 : 48
                    radius: Theme.cornerRadius
                    color: !isHeader && rowArea.containsMouse ? Theme.surfaceContainerHighest : "transparent"

                    Row {
                        anchors.fill: parent
                        anchors.leftMargin: Theme.spacingXS
                        anchors.rightMargin: Theme.spacingXS
                        spacing: Theme.spacingS

                        RoonArt {
                            anchors.verticalCenter: parent.verticalCenter
                            width: 36
                            height: 36
                            radius: (Theme.cornerRadius / 2)
                            visible: !row.isHeader
                            fallbackIcon: row.kindIcon
                            fallbackColor: row.isPlayVerb ? Theme.primary : Theme.surfaceVariantText
                            placeholderColor: row.isPlayVerb ? Theme.primaryContainer : Theme.surfaceContainerHigh
                            source: row.modelData.artUrl || RoonService.artUrl(row.modelData.imageKey, 96)
                        }

                        Column {
                            anchors.verticalCenter: parent.verticalCenter
                            width: parent.width - (row.isHeader ? 0 : 36 + Theme.spacingS) - trailing.width - Theme.spacingS
                            spacing: 1

                            StyledText {
                                width: parent.width
                                text: row.modelData.title
                                font.pixelSize: row.isHeader ? Theme.fontSizeSmall : Theme.fontSizeMedium
                                font.weight: row.isHeader ? Font.Bold : Font.Normal
                                color: row.isHeader ? Theme.primary : Theme.surfaceText
                                elide: Text.ElideRight
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                            }

                            StyledText {
                                width: parent.width
                                text: row.modelData.subtitle
                                visible: text.length > 0 && !row.isHeader
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                                elide: Text.ElideRight
                                wrapMode: Text.NoWrap
                                maximumLineCount: 1
                            }
                        }

                        Item {
                            id: trailing
                            anchors.verticalCenter: parent.verticalCenter
                            width: row.isHeader ? 0 : 28
                            height: 28

                            DankIcon {
                                anchors.centerIn: parent
                                name: row.isPlayable ? "play_arrow" : (row.modelData.inputPrompt ? "keyboard" : "chevron_right")
                                size: Theme.iconSize - 4
                                color: row.isPlayable ? Theme.primary : Theme.surfaceVariantText
                                visible: !row.isHeader
                            }
                        }
                    }

                    MouseArea {
                        id: rowArea
                        anchors.fill: parent
                        hoverEnabled: !row.isHeader
                        enabled: !row.isHeader
                        cursorShape: Qt.PointingHandCursor
                        acceptedButtons: Qt.LeftButton | Qt.RightButton
                        onClicked: mouse => {
                            if (mouse.button === Qt.RightButton && row.modelData.itemKey && !row.isAction) {
                                RoonService.playBrowseItem(row.modelData.itemKey, "play_now");
                                return;
                            }
                            root.activate(row.modelData);
                        }
                    }
                }
            }

            Column {
                anchors.centerIn: parent
                spacing: Theme.spacingS
                visible: RoonService.browseItems.length === 0 && !RoonService.browseLoading

                DankIcon {
                    anchors.horizontalCenter: parent.horizontalCenter
                    name: "library_music"
                    size: 40
                    color: Theme.surfaceVariantText
                }

                StyledText {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: RoonService.browseList ? "Nothing here" : "Browse your Roon library"
                    color: Theme.surfaceVariantText
                }
            }

            DankIcon {
                anchors.centerIn: parent
                name: "hourglass_top"
                size: 32
                color: Theme.primary
                visible: RoonService.browseLoading && RoonService.browseItems.length === 0
            }
        }
    }
}
