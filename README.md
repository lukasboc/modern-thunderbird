# Modern Thunderbird – Theme für macOS

Thunderbird ab Version 128 (geprüft mit 159) wirkt auf macOS 14+ ruhig, hell und luftig: Systemschrift, Systemakzent, Flächen statt Linien, Light und Dark nach Systemeinstellung. Die Funktionen bleiben unverändert.

Zwei Teile:

- `theme/` – WebExtension-Theme mit den Basisfarben (Light und Dark).
- `chrome/` – `userChrome.css`/`userContent.css` für Layout, Radien, Abstände und Icons. Alle Werte stehen in `chrome/tokens.css`.

## Installation

1. Thunderbird beenden.
2. Profilpfad ermitteln: Thunderbird › Hilfe › Informationen zur Fehlerbehebung › Profilordner, z. B. `~/Library/Thunderbird/Profiles/xxxx.default-release`.
3. Stylesheets und Prefs installieren:
   ```bash
   scripts/install.sh ~/Library/Thunderbird/Profiles/xxxx.default-release
   ```
   Das **kopiert** `chrome/` ins Profil (Markierung `chrome/.mx-theme`) und schreibt einen markierten Block in `user.js`. Kein Symlink: Thunderbirds Content-Prozesse dürfen nur Dateien im Profil lesen, über einen Symlink ins Repo würde `userContent.css` nicht geladen. **Nach Änderungen in `chrome/` das Skript erneut ausführen**, es aktualisiert die Kopie. Ein fremder `chrome/`-Ordner (ohne Markierung) wird nicht angetastet; das Skript bricht dann ab. Ein alter Symlink dieses Themes wird durch die Kopie ersetzt.
4. Theme bauen und installieren:
   ```bash
   scripts/build-theme.sh
   ```
   Thunderbird starten › Add-ons und Themes › Zahnrad › „Add-on aus Datei installieren…“ › `dist/modern-thunderbird-theme.xpi`.
5. Einstellungen › Darstellung › Akzentfarbe auf „System“ lassen (setzt `user.js` bereits).
6. Toolbar anpassen (Rechtsklick auf die Toolbar › Anpassen): Antworten, Allen antworten, Weiterleiten, Löschen hinzufügen. Die Buttons im Nachrichtenkopf bleiben als Icons erhalten, damit Nachrichten in eigenen Tabs und Fenstern bedienbar bleiben.

7. Optional, Schnell-Löschen und Textvorschau in der Nachrichtenliste:
   ```bash
   scripts/build-addon.sh
   ```
   Dann `dist/modern-thunderbird-actions.xpi` genauso wie das Theme installieren. Beim Überfahren einer Karte erscheint neben dem Stern ein Papierkorb; ein Klick löscht diese Mail (bei zugeklapptem Thread den ganzen Thread) nach den Papierkorb-Regeln des Kontos, ohne die Auswahl zu ändern. Rückgängig wie gewohnt. Die dritte Kartenzeile zeigt außerdem die ersten Worte der Mail (graue Vorschauzeile).

### Schnell-Löschen und Textvorschau (`addon/`)

Ein kleines Add-on mit **Experiment-APIs**, also privilegiertem JavaScript. Das geht über die ursprüngliche Spec hinaus, die keine neuen Funktionen vorsah; die Spec nennt es als optionale Stufe.

- `experiments/cardDelete/implementation.js` fügt den Knopf in Thunderbirds Kartenvorlage (`#threadPaneCardTemplate`) ein und meldet Klicks; gelöscht wird in `background.js` über die stabile API `messages.delete`.
- `experiments/cardPreview/implementation.js` fügt der Kartenvorlage eine Vorschauzeile (`.mx-card-preview`) hinzu und füllt sie bei jedem Neuzeichnen der Karte (`fillRow`). Der Text ist Thunderbirds eigene Vorschau (`preview`-Eigenschaft der Nachricht, max. ~200 Zeichen ohne HTML). Fehlt sie, wird sie einmal per `fetchMsgPreviewText` angefordert: lokal und offline sofort, bei IMAP ohne Offline-Kopie lädt Thunderbird den Anfang der Nachricht vom Server (nur für sichtbare Karten). Die Zeile nutzt den Platz, den Thunderbird bei `rowcount` 3 ohnehin reserviert; die Kartenhöhe bleibt gleich. Verschlüsselte Mails haben keine Vorschau.
- Die Optik kommt aus `chrome/threadpane.css` (`.mx-card-delete`, `.mx-card-preview`); ohne die Stylesheets erscheinen Knopf und Vorschau ungestylt.
- Nach jedem Thunderbird-Major-Update mitprüfen (Checkliste D-01 bis D-05, P-01 bis P-07). Deinstallation über Add-ons und Themes.

### Gesetzte Prefs (`prefs/user.js`)

| Pref | Wert | Zweck |
|---|---|---|
| `toolkit.legacyUserProfileCustomizations.stylesheets` | true | lädt `chrome/` |
| `mail.tabs.autoHide`, `mail.tabs.drawInTitlebar` | true | Tableiste erst ab 2 Tabs |
| `mail.uidensity` | 2 | höhere Listenzeilen (Kartenhöhe rechnet Thunderbird in JS) |
| `mail.threadpane.listview` / `mail.threadpane.cardsview.rowcount` | 0 / 3 | Kartenansicht |
| `mail.appearance.accentColor` | `accent-color` | Akzent folgt macOS |
| `layout.css.prefers-reduced-transparency.enabled` | true | „Transparenz reduzieren“ erreicht CSS |
| `svg.context-properties.content.enabled` | true | die eigenen Icons (`file:`-URLs) dürfen Akzent- und Textfarbe übernehmen; Nebenwirkung: auch Webinhalte dürfen SVG-Context-Paint nutzen |

Einmalig gesetzt (`prefs/defaults.js`, nur wenn das Profil noch keinen Wert hat, danach frei änderbar):

| Pref | Wert | Zweck |
|---|---|---|
| `mail.uifontsize` | 14 | UI-Schrift 14 px statt der macOS-Systemgröße 13 px; alle Theme-Größen und Thunderbirds Kartenhöhen wachsen mit. Ändern über ≡ › Schriftgröße. |

Hinweis: Werte in `user.js` setzt Thunderbird bei jedem Start neu. Wer z. B. die Dichte in den Einstellungen ändert, muss sie in `prefs/user.js` ändern und neu installieren.

## Deinstallation

1. Thunderbird beenden.
2. `scripts/uninstall.sh <profilpfad>` – entfernt die kopierte `chrome/` (nur mit Markierung), nur den markierten Block aus `user.js` und die Theme-Prefs aus `prefs.js` (Sicherung: `prefs.js.mx-bak`). Prefs, die du vorher selbst auf denselben Namen gesetzt hattest (z. B. eine eigene Dichte), stehen danach auf dem Thunderbird-Standard. Beide Skripte brechen ab, solange Thunderbird läuft.
3. Theme in Add-ons und Themes deaktivieren oder entfernen.

Notfall ohne Skript: `chrome/` im Profil umbenennen.

## Bekannte Grenzen

- **Textvorschau nur mit Add-on.** Thunderbird 159 zeigt in der Kartenansicht keinen Vorschautext; die einzeilige Vorschau kommt aus dem optionalen Add-on (`addon/`). Zwei Vorschauzeilen gehen nicht, weil Thunderbird die Kartenhöhe auf 3 Zeilen begrenzt.
- **Ordnername nicht in der Fensterleiste.** Er steht im Kopf der Nachrichtenliste; CSS kann keinen Text zwischen Dokumenten verschieben.
- **Keine echte Vibrancy.** Die Ordnerleiste ist deckend (`#F6F6F6` / `#282828`); macOS-Transparenz ist aus User-Stylesheets nicht verlässlich erreichbar.
- **Kartenabstände.** Die Kartenhöhe berechnet Thunderbird selbst; vertikale Innenabstände folgen der Dichte-Einstellung, nicht exakt den 10 px der Spec.
- **Dark Mode für HTML-Mails** überschreibt deren Farben (gewollt). Hintergrundbilder und transparente Logos können auf Dunkel schlecht sichtbar sein. Abhilfe pro Nachricht: Thunderbirds Schalter „Dunkelmodus aus“ im Nachrichtenkopf, das Theme folgt ihm (`mail.dark-reader.enabled`). Drucken nutzt die Originalfarben.
- **Kontrast:** Gegenüber der Spec sind `--mx-label-secondary` (Light 0,55 statt 0,50) und das Markierungs-Icon (`--mx-flag-icon`) abgedunkelt. Auswahlflächen, Akzent-Text und Akzent-Icons begrenzen die OKLCH-Helligkeit des Systemakzents (`oklch(from …)`), damit jede macOS-Akzentfarbe – auch Gelb und Graphit – 4,5:1 bzw. 3:1 erreicht. Die Auswahl ist daher etwas dunkler als das System-Blau; Text darauf ist immer weiß.
- **Updates:** Selektoren können mit jedem Thunderbird-Major brechen. Ablauf: `docs/selectors.md` gegen die neue Version prüfen, `npm test`, dann `docs/checklist.md`.

## Entwicklung

```bash
npm test   # Tokens, Kontrast, Literal- und !important-Lint, Variablen, Icons, Manifest, Install-Skripte
```

- Bereichsdateien (`layout`, `folderpane`, `threadpane`, `messagepane`, `compose`, `preferences`, `content`) verwenden nur `var(--mx-*)` und jede Deklaration mit `!important` – `userChrome.css` ist ein User-Stylesheet und verliert sonst gegen Thunderbirds eigene Styles.
- Selektoren nur aus `docs/selectors.md`.
- Größen sind Spec-Pixel × `--mx-unit` (`calc(1rem / 13)`): Thunderbirds Wurzelschrift ist die macOS-Systemgröße von 13 px. So entspricht ein Wert bei Standard-Schriftgröße genau einem Pixel und wächst mit Einstellungen › Schriftgröße mit.
- `about:preferences` ist ein Content-Dokument: `preferences.css` wird aus `userContent.css` importiert, alles andere aus `userChrome.css`.

## Lizenz

Icons: [Lucide](https://lucide.dev) 0.460.0, ISC-Lizenz (`chrome/icons/LICENSE`). Keine Grafiken oder Icon-Dateien Dritter außer Lucide.
