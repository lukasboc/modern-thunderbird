# Selektor-Inventar – Thunderbird 159.0 (macOS)

Geprüft am 2026-11-04 gegen `/Applications/Thunderbird.app/Contents/Resources/omni.ja` (Quell-XHTML/CSS/JS).
Laufzeitfragen, die nur im laufenden Programm beantwortbar sind, stehen unter „Machbarkeit“ als **offen** mit dem gewählten Standardverhalten.

## Dokumente (`@-moz-document`)

| Dokument | URL |
|---|---|
| Hauptfenster | `chrome://messenger/content/messenger.xhtml` |
| 3-Pane | `about:3pane` |
| Nachricht | `about:message` |
| Composer | `chrome://messenger/content/messengercompose/messengercompose.xhtml` |
| Einstellungen | `about:preferences` |
| Composer-Editor | `about:blank?compose` |
| Nachrichteninhalt | `url-prefix("imap:")`, `url-prefix("mailbox:")`, `url-prefix("news:")`, `url-prefix("snews:")` |

## Thunderbird-Variablen (Hooks)

| Zweck | Variable |
|---|---|
| Flächen | `--layout-background-0` (Inhalt) … `--layout-background-4`, `--layout-color-0..3`, `--layout-border-0..2` |
| Seitenleiste | `--sidebar-background`, `--sidebar-background-color`, `--sidebar-color`, `--sidebar-text-color`, `--sidebar-border-color` |
| Toolbar | `--toolbar-background-color`, `--toolbar-text-color`, `--toolbar-field-background-color`, `--toolbar-field-color`, `--toolbar-field-border-color`, `--toolbar-button-hover-background-color`, `--toolbar-button-active-background-color`, `--toolbarbutton-icon-fill` |
| Auswahl allgemein | `--selected-item-color`, `--selected-item-text-color` |
| Ordnerbaum | `--treeitem-background-selected`, `--treeitem-background-hover`, `--treeitem-background-active`, `--treeitem-text-active`, `--folderpane-unread-count-background`, `--folderpane-unread-count-text`, `--icon-color` |
| Karten | `--tree-card-background`, `--tree-card-background-selected`, `--tree-card-background-selected-current`, `--tree-card-background-current`, `--tree-card-background-selected-unfocused`, `--tree-card-background-selected-current-unfocused`, `--tree-card-border`, `--tree-card-border-selected`, `--tree-card-border-hover`, `--tree-card-border-focus`, `--tree-pane-background`, `--tree-card-inline`, `--new-subject-color`, `--thread-card-content-gap` |
| Liste | `--tree-view-bg`, `--tree-view-color`, `--listbox-selected-bg`, `--listbox-selected-color`, `--listbox-hover` |

## Selektoren je Bereich

| Bereich | Element | Selektor |
|---|---|---|
| Hauptfenster | Titelzeile | `#titlebar` |
| | Tableiste | `#tabs-toolbar`, `#tabmail-tabs` |
| | Unified Toolbar | `#unifiedToolbarContainer`, `#unifiedToolbar`, `#unifiedToolbarContent`, Buttons `.unified-toolbar-button`, Icon `.button-icon` (Icon per `content: var(--icon-…)` je Button-Klasse, z. B. `.reply .button-icon`) |
| | Suche | `global-search-bar` / `#unifiedToolbarContent .search-bar` |
| | Spaces | `#spacesToolbar`, Buttons `.spaces-toolbar-button` |
| | Benachrichtigungen | `notification-message`, `#messenger-notification-bottom` |
| | Panels | `panel`, `menupopup` (nicht-native), `.popup-panel` |
| about:3pane | Ordnerleiste | `#folderPane`, Kopf `#folderPaneHeaderBar` |
| | Ordnerbaum | `#folderTree`, Zeile `li > .container`, Icon `.container > .icon`, Name `.name`, Zähler `.unread-count`, `.total-count` (`.folder-count-badge`), Gruppe `li[data-mode] > .mode-container > .mode-name` |
| | Ordnertypen | `li[data-folder-type="inbox|sent|drafts|archive|trash|junk|templates|outbox|virtual"]`, Server `li[data-server-type]` |
| | Listenkopf | `#threadPaneHeaderBar`, Titel `#threadPaneFolderName` (`.list-header-title`), Zahl `#threadPaneFolderCount` |
| | Liste | `#threadTree[rows="thread-card"]`, Karte `tr[is="thread-card"]`, Inhalt `.card-container`, Spalten `.thread-card-column`, Zeile 1 `.thread-card-row` (`.sender`, `.date`), Zeile 2 `.thread-card-dynamic-row` (`.subject`, `.thread-card-button` mit `.thread-replies`), Status `.read-status`, Flag `.tree-button-flag` |
| | Zustände | `tr.selected`, `tr.current`, `tr.unread`, `tr.new`, `tr.flagged`, `#threadTree:focus-within` |
| | Schnellfilter | `#quickFilterBarContainer` |
| about:message | Kopf | `#messageHeader`, Betreff `#expandedsubjectBox`, Absender `#expandedfromRow`, Datum `#dateLabel`, Buttons `#header-view-toolbar`, Avatar `.recipient-avatar` |
| | Anhänge | `#attachmentView`, `#attachmentBar`, `#attachmentList` |
| | Inhalt | `browser#messagepane` |
| Composer | Toolbar | `#composeToolbar2`, Senden `#button-send` |
| | Kopfbereich | `#MsgHeadersToolbar`, `#recipientsContainer`, `#msgSubject` |
| | Format | `#FormatToolbar` |
| | Editor | `#messageEditor` |
| about:preferences | Kategorien | `#categories` |
| | Inhalt | `#paneDeck`, Gruppen `html|fieldset`, `.subcategory` |

## Machbarkeit

| # | Frage | Ergebnis |
|---|---|---|
| M1 | userChrome greift in about:3pane/about:message/about:preferences/Composer | about:3pane, about:message, Composer: Chrome-Dokumente → `userChrome.css`. **about:preferences nicht**: läuft in einem `type="content"`-Browser (`specialTabs.js`, `contentTabBaseType`) → `preferences.css` wird aus `userContent.css` importiert. Wirkung zur Laufzeit offen. |
| M2 | Kartenhöhe per CSS | **nein**. `about3Pane.js` `densityChange()` berechnet `ThreadCard.ROW_HEIGHT` in JS aus Schriftgröße, `mail.uidensity` und Zeilenzahl; der virtualisierte Baum nutzt diesen Wert. CSS-Höhen würden Überlappungen erzeugen. → `mail.uidensity = 2` (Touch: +6 px Zeilenabstand, +12 px Innenabstand), innen nur Abstände verteilen. |
| M3 | Prefs Karten/Zeilen | `mail.threadpane.listview` (0 = Karten, 1 = Tabelle), `mail.threadpane.cardsview.rowcount` (2 oder 3, Standard 3). **Keine Textvorschau**: Die Kartenvorlage (`#threadPaneCardTemplate`) enthält nur Absender, Datum, Betreff, Thread-Zähler, Tags. 2 Zeilen Vorschau sind ohne JS nicht machbar → Grenze. |
| M4 | Tabs ab 2 | `mail.tabs.autoHide` (Standard in TB 159: true), `mail.tabs.drawInTitlebar` (Standard true). Lage der Toolbar neben den Ampel-Buttons: **offen (Laufzeit)**. |
| M5 | Vibrancy | Keine Thunderbird-CSS nutzt `-moz-sidebar`-Appearance. **offen (Laufzeit)** → Standard: deckendes `--mx-bg-sidebar-opaque`. |
| M6 | `prefers-reduced-transparency` | Gecko-Pref `layout.css.prefers-reduced-transparency.enabled`. **offen (Laufzeit)**. Da Standard deckend (M5), ohne Wirkung auf das Ergebnis. |
| M7 | `AccentColor` folgt macOS | **offen (Laufzeit)**. TB 159 hat eine eigene Akzent-Option (Einstellungen › Darstellung › `accent-color-os`), die auf „System“ stehen muss. |
| M8 | rem skaliert | **ja**. `UIFontSize.sys.mjs` setzt `font-size` auf `documentElement` jedes registrierten Fensters. |
| M9 | `dark_theme` / `color_scheme` im Manifest | **offen (Laufzeit)**; Gecko ≥ 106 kennt beides. |
| M10 | URL-Präfixe | siehe Dokumente. EWS/Graph-Nachrichten-URLs nicht verifiziert → offen. |
| M11 | Anhänge als Kacheln | keine Pref gefunden → reines CSS auf `#attachmentList`. |
| M12 | Toolbar-Icons | `content: var(--icon-…)` auf `.button-icon`, gefärbt über `-moz-context-properties: fill, stroke`. Eigene Icons sind `file:`-URLs: Context-Paint nur mit `svg.context-properties.content.enabled = true` (in `prefs/user.js`). |

## Weitere Befunde

- TB 159 hat einen eingebauten Dark Reader für Nachrichten: `mail.dark-reader.enabled` (Standard true), Styles in `messageBody.css` unter `@media (prefers-color-scheme: dark) and -moz-pref("mail.dark-reader.enabled")`.
- Die Ordnerleisten-Hintergrundfarbe kommt aus `--sidebar-background`, die Icon-Farbe je Ordnertyp aus `--icon-color` (`--folder-color-*`).
