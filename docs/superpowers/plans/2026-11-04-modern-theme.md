# Modern Thunderbird – Theme für macOS – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thunderbird (Release-Kanal, ab 128, Supernova) wirkt auf macOS 14+ in Light und Dark ruhig, hell und luftig, mit Systemschrift und Systemakzent. Funktionen bleiben unverändert.

**Architecture:** Zwei Stufen. Stufe 1 ist ein statisches WebExtension-Theme (`theme/`) für die Basisfarben und `color_scheme: system`. Stufe 2 ist ein `chrome/`-Ordner mit `userChrome.css`/`userContent.css`, der modulare Teildateien importiert. Alle Werte kommen aus `tokens.css`. Jede Bereichsdatei ist per `@-moz-document` auf ihr Dokument begrenzt (messenger.xhtml, about:3pane, about:message, Composer, about:preferences). Automatisch getestet werden Tokens, Kontrast, Literal-Freiheit, Manifest und Install-Skripte. Die Optik wird manuell gegen eine Checkliste geprüft.

**Tech Stack:** CSS (Gecko-Chrome, User-Sheets), WebExtension-Theme (Manifest V2), Bash, Node ≥ 20 (`node --test`, keine Abhängigkeiten), Lucide-Icons (ISC).

**Spec:** https://claude.ai/artifact/51b49uV4DQjKPXewm7jjhP (Theme-Spec, Stand 2026-11-04)

## Global Constraints

- Ziel: Thunderbird Release-Kanal, Version ≥ 128 (Supernova/Nebula), macOS 14 oder neuer, Light und Dark.
- Kein Scope: Kalender, Aufgaben, Adressbuch (Phase 2), Windows/Linux, Funktionsänderungen, neue Features, Tastaturkürzel, Veröffentlichung auf ATN. Spätere Veröffentlichung auf GitHub ist möglich, deshalb gilt die Lizenzhygiene trotzdem.
- Keine Icons oder Grafiken Dritter. Nur freie Icons (Lucide, Lizenz ISC, nicht MIT wie in der Spec steht) oder eigene.
- Alle Farben, Schriftgrößen, Abstände, Radien, Dauern nur als `--mx-*`-Tokens aus `chrome/tokens.css`. In Bereichsdateien stehen keine Literale.
- Schrift: `system-ui`, keine Webfonts. Größen in `rem`.
- Raster 4/8/12/16/24 px. Radien sm 6 px, md 8 px, lg 10 px. Popup-Schatten `0 8px 24px rgba(0,0,0,0.18)`. Animation 150–200 ms ease-out, aus bei `prefers-reduced-motion`.
- Höchstens 1 px Trennlinie, und nur in `--mx-separator`.
- Kontrast: Text ≥ 4,5:1, Icons/Bedienelemente ≥ 3:1, jeweils in Light und Dark.
- Native macOS-Menüs bleiben nativ.
- `layout.css.prefers-color-scheme` bzw. „Website-Darstellung“ bleibt auf „System“.
- Rückbaubar: Theme aus und `chrome/` umbenennen ergibt wieder den vollständigen Standard.
- Selektoren nur auf stabile IDs und Thunderbird-Variablen (`--layout-*`, `--color-*`), keine tiefen DOM-Pfade.

## Spec-Abweichungen (vor Start bestätigen)

1. **Kontrast-Konflikt in den Spec-Werten.** `--mx-label-secondary` Light `rgba(0,0,0,0.50)` auf Weiß ergibt 3,95:1. Weißer Text auf `#007AFF` ergibt 4,02:1, auf `#0A84FF` 3,65:1. Links in `#007AFF` auf Weiß ergeben 4,02:1. Das verfehlt die eigene 4,5:1-Regel der Spec. **Vorschlag:**
   - `--mx-label-secondary` Light auf `rgba(0,0,0,0.55)` ändern (4,74:1 auf Weiß, 4,65:1 auf `#F6F6F6`).
   - Neuer Token `--mx-accent-selection: color-mix(in srgb, var(--mx-accent) 85%, black)` für Listen-Auswahl und Primärbuttons (5,27:1 Light, 4,86:1 Dark).
   - Neuer Token `--mx-accent-text`: Light = derselbe 85-%-Mix, Dark = `var(--mx-accent)` (4,58:1 auf `#1E1E1E`).
   - `--mx-label-tertiary` gilt als „deaktiviert“ und ist damit von der Kontrastregel ausgenommen.
2. **Ordnertitel in der Fensterleiste ist mit CSS nicht machbar.** Der Ordnername liegt in about:3pane, die Toolbar in messenger.xhtml, und CSS kann keinen Text zwischen Dokumenten verschieben. Ersatz: Die Kopfzeile der Nachrichtenliste (`#threadPaneHeaderBar`) zeigt Ordner (13/600) und Ungelesen-Zahl (12, sekundär), direkt über der Liste.
3. **Aktionen „nur in der Toolbar“.** Antworten, Weiterleiten und Löschen kommen per Unified-Toolbar-Anpassung in die Toolbar (im README dokumentiert). Im Nachrichtenkopf bleiben sie als reine Icons sichtbar, weil about:message in separaten Tabs und Fenstern sonst keine Aktionen hätte. Die Spec verlangt „keine Funktion verliert Bedienbarkeit“.
4. **Ein paar Spec-Punkte werden über Prefs in `user.js` umgesetzt, nicht über CSS.** Tabs erst ab 2 (`mail.tabs.autoHide`), Kartenansicht und 3-zeilige Karten, höhere Listenzeilen (`mail.uidensity`). Das ist Konfiguration, keine Funktionsänderung.
5. **Einstellungen bekommen eine eigene Datei `preferences.css`.** Die Dateiliste der Spec nennt dafür keine.

---

## Dateistruktur

```
package.json                 # "test": "node --test" (findet tests/*.test.mjs selbst)
theme/manifest.json          # Stufe 1: theme + dark_theme, color_scheme system
chrome/userChrome.css        # nur @import-Zeilen
chrome/userContent.css       # @import tokens.css + content.css
chrome/tokens.css            # einzige Quelle aller Werte (Light, Dark, Media-Overrides)
chrome/layout.css            # messenger.xhtml: Fensterleiste, Toolbar, Tabs, Spaces, Panels, Benachrichtigungen, Zustände
chrome/folderpane.css        # about:3pane: #folderPane/#folderTree
chrome/threadpane.css        # about:3pane: #threadPane, Karten, Kopfzeile, Schnellfilter
chrome/messagepane.css       # about:message: Kopf, Avatar, Anhänge
chrome/compose.css           # Composer-Fenster
chrome/preferences.css       # about:preferences
chrome/content.css           # Nachrichteninhalt + Composer-Editor (Content-Dokumente)
chrome/icons/*.svg           # Lucide-basiert, context-stroke
chrome/icons/LICENSE         # ISC-Text von Lucide
prefs/user.js                # Prefs, die install.sh ins Profil schreibt
scripts/install.sh           # <profilpfad>: chrome/-Symlink + user.js-Block
scripts/uninstall.sh         # <profilpfad>: macht install.sh vollständig rückgängig
scripts/build-theme.sh       # theme/ → dist/modern-thunderbird-theme.xpi
tests/lib/tokens.mjs         # parseTokens()
tests/lib/color.mjs          # parseColor(), composite(), contrast(), mixBlack()
tests/*.test.mjs
docs/selectors.md            # Ergebnis aus Task 1, Quelle aller Selektoren
docs/checklist.md            # manuelle Abnahme- und Regressionscheckliste
README.md
```

## Review Focus

1. **IMAP-Mails ohne Offline-Kopie haben keine Vorschau.** Die Karte muss trotzdem 3 Zeilen hoch bleiben. Es darf keinen Höhensprung und keine Überlappung im virtualisierten Scrollen geben. → Task 7, Checkliste C-07.
2. **Drucken im Dark Mode.** Die erzwungenen Dark-Farben würden hellgrauen Text auf weißem Papier drucken. Das Dark-Override steht deshalb nur in `@media screen`. → Task 9, Checkliste M-06.
3. **Lange Absender, lange Betreffe, Emoji, RTL.** Absender und Betreff werden einzeilig mit Ellipse gekürzt, das Datum wird nie verdrängt. → Task 7, Checkliste C-08.
4. **Systemakzent nicht blau (Gelb, Graphit).** Weiß auf Gelb ist unlesbar. Text auf Akzentflächen nutzt `--mx-on-accent` (`AccentColorText`) und die Fläche `--mx-accent-selection`. → Task 2 (Token-Test) und Task 7, Checkliste C-09.
5. **Newsletter mit festen Tabellen von 600–800 px.** `max-width: 720px` darf den Inhalt nicht abschneiden. Horizontales Scrollen bleibt möglich, Bilder werden nicht verzerrt. → Task 9, Checkliste M-07.

---

### Task 1: Spike – Selektor-Inventar und Machbarkeit

Ohne dieses Inventar kann kein Bereichs-Task Selektoren festlegen. Ergebnis ist ein Dokument, kein Code.

**Files:**
- Create: `docs/selectors.md`

**Interfaces:**
- Produces: `docs/selectors.md` mit einer Tabelle je Dokument (Bereich · Element · Selektor · TB-Variable · geprüft in Version) und einem Abschnitt „Machbarkeit“ mit Ja/Nein und Notiz je Frage unten. Die Tasks 6–11 nehmen ihre Selektoren nur aus dieser Datei.

- [ ] **Step 1:** Thunderbird-Version notieren (`Hilfe › Über`). Browser Toolbox öffnen (`devtools.chrome.enabled`, `devtools.debugger.remote-enabled` = true; Extras › Entwicklerwerkzeuge › Entwickler-Werkzeugkasten).
- [ ] **Step 2:** Je Dokument die Selektoren für alle Zeilen der Spec-Tabelle „UI-Bereiche“ erfassen: messenger.xhtml (`#unifiedToolbar`, `#tabs-toolbar`, `#spacesToolbar`, Benachrichtigungen), about:3pane (`#folderPane`, `#folderTree`, Folder-Icons je `data-folder-type`, `#threadPane`, `#threadPaneHeaderBar`, Kartenzeile und ihre Kinder, `#quickFilterBar`), about:message (Kopf, `.recipient-avatar`, Header-Buttons, Anhangsliste), Composer (Adresszeilen, Betreff, `#button-send`, `#FormatToolbar`), about:preferences (Kategorien, Gruppen). Dazu jeweils die TB-eigenen Variablen, die die Farbe/Höhe heute setzen.
- [ ] **Step 3:** Machbarkeitsfragen mit einer Wegwerf-`userChrome.css` prüfen und das Ergebnis eintragen:
  - M1: Greift `userChrome.css` in about:3pane, about:message, about:preferences und im Composer? Geht `@-moz-document url("about:3pane")`?
  - M2: Lässt sich die Kartenhöhe per CSS ändern, ohne das virtualisierte Scrollen zu brechen? Falls nein: Welche Höhe liefern `mail.uidensity` = 2 und 3-zeilige Karten (Pref-Name notieren)?
  - M3: Pref-Namen für Karten- vs. Tabellenansicht und für 3-zeilige Karten.
  - M4: Blendet `mail.tabs.autoHide` die Tableiste aus, und rückt die Unified Toolbar dann neben die Ampel-Buttons?
  - M5: Vibrancy: Wirkt `appearance: -moz-sidebar` oder ein `-moz-window-*`-Wert aus einem User-Sheet auf `#folderPane`?
  - M6: `prefers-reduced-transparency`: Geht es mit `layout.css.prefers-reduced-transparency.enabled` = true, und folgt es der macOS-Einstellung?
  - M7: Folgt `AccentColor`/`AccentColorText` der macOS-Akzentfarbe zur Laufzeit?
  - M8: Skaliert `rem` in about:3pane mit der Schriftgrößen-Einstellung von Thunderbird?
  - M9: Unterstützt Thunderbird im Theme-Manifest `dark_theme` und `properties.color_scheme: "system"`?
  - M10: Wie heißen die URL-Präfixe der Nachrichtendokumente (`imap:`, `mailbox:`, `news:`, EWS?) und die URL des Composer-Editors?
  - M11: Anhänge als Kacheln: Gibt es eine Pref oder Kontextmenü-Ansicht dafür, oder ist das reines CSS?
  - M12: Wie werden Toolbar-Icons der Unified Toolbar gesetzt (Variable, `list-style-image`, `<img>`)?
- [ ] **Step 4:** Commit `docs: selector inventory and feasibility for TB <version>`.

Steht bei M1 „nein“, wird der Plan vor Task 6 angepasst. Bei M2, M5 oder M6 „nein“ gilt der jeweils dort genannte Fallback.

---

### Task 2: Gerüst und Tokens

**Files:**
- Create: `package.json`, `tests/lib/tokens.mjs`, `tests/lib/color.mjs`, `tests/tokens.test.mjs`, `chrome/tokens.css`

**Interfaces:**
- Produces:
  - `parseTokens(css: string): { light: Map<string,string>, dark: Map<string,string> }`. `light` enthält Deklarationen `--mx-*` in `:root{}` außerhalb jeder At-Regel, `dark` die in `@media (prefers-color-scheme: dark) { :root{} }`. Werte werden getrimmt und unverändert übernommen.
  - `parseColor(s: string): {r,g,b,a}` für `#RGB`, `#RRGGBB`, `#RRGGBBAA`, `rgb()`, `rgba()`.
  - `composite(fg, bg): {r,g,b,a:1}`, `mixBlack(c, pct: number)` (Nachbau von `color-mix(in srgb, c pct%, black)`), `contrast(fg, bg): number` nach WCAG 2.x.
  - Token-Namen, die alle späteren Tasks verwenden:
    - Farben: `--mx-accent`, `--mx-accent-selection`, `--mx-accent-text`, `--mx-on-accent`, `--mx-accent-tint` (Akzent 12 %), `--mx-focus-ring` (Akzent 50 %), `--mx-bg-window`, `--mx-bg-sidebar`, `--mx-bg-sidebar-opaque`, `--mx-bg-toolbar`, `--mx-label`, `--mx-label-secondary`, `--mx-label-tertiary`, `--mx-separator`, `--mx-selection-sidebar`, `--mx-pressed`, `--mx-selection-inactive`, `--mx-flag`, `--mx-danger`, `--mx-capsule` (Thread-Zähler)
    - Schrift: `--mx-font-family`, `--mx-font-{title,headline,body,caption,section}-{size,weight}`
    - Abstände: `--mx-space-{1..5}` (= 4/8/12/16/24 px als rem)
    - Radien: `--mx-radius-{sm,md,lg}`
    - Effekte: `--mx-shadow-popup`, `--mx-duration`, `--mx-ease`, `--mx-hairline`, `--mx-focus-width`
    - Maße: `--mx-toolbar-height` (52 px), `--mx-search-height` (28 px), `--mx-folder-row` (28 px), `--mx-icon-sm` (16 px), `--mx-icon-md` (18 px), `--mx-avatar` (40 px), `--mx-unread-dot` (8 px), `--mx-message-max` (720 px), `--mx-card-pad-y` (10 px), `--mx-card-pad-x` (16 px), `--mx-card-inset` (6 px)

- [ ] **Step 1: Failing Test schreiben** – `tests/tokens.test.mjs`

```js
const SPEC = { // [light, dark], Spec-Tabelle „Farben“ (+ Abweichung 1)
  '--mx-bg-window': ['#FFFFFF', '#1E1E1E'],
  '--mx-bg-sidebar': ['rgba(246,246,246,0.85)', 'rgba(40,40,40,0.85)'],
  '--mx-bg-sidebar-opaque': ['#F6F6F6', '#282828'],
  '--mx-bg-toolbar': ['#F6F6F6', '#2B2B2B'],
  '--mx-accent': ['#007AFF', '#0A84FF'],
  '--mx-label': ['rgba(0,0,0,0.85)', 'rgba(255,255,255,0.85)'],
  '--mx-label-secondary': ['rgba(0,0,0,0.55)', 'rgba(255,255,255,0.55)'],
  '--mx-label-tertiary': ['rgba(0,0,0,0.26)', 'rgba(255,255,255,0.25)'],
  '--mx-separator': ['rgba(0,0,0,0.10)', 'rgba(255,255,255,0.10)'],
  '--mx-selection-sidebar': ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.10)'],
  '--mx-pressed': ['rgba(0,0,0,0.16)', 'rgba(255,255,255,0.20)'],
  '--mx-selection-inactive': ['#DCDCDC', '#3A3A3A'],
  '--mx-flag': ['#FF9500', '#FF9F0A'],
  '--mx-danger': ['#FF3B30', '#FF453A'],
};
test('every spec color token has exact light and dark value', …);
test('font tokens', () => { // rem bei 16 px Basis
  expect light['--mx-font-title-size']==='1.375rem' && weight '700';
  headline 0.8125rem/600; body 0.8125rem/400; caption 0.75rem/400; section 0.6875rem/600;
  '--mx-font-family' === 'system-ui, sans-serif';
});
test('spacing, radii, effects', () => { space-1..5 = 0.25rem,0.5rem,0.75rem,1rem,1.5rem;
  radius sm/md/lg = 0.375rem/0.5rem/0.625rem; shadow-popup = '0 8px 24px rgba(0,0,0,0.18)';
  duration '180ms'; ease 'ease-out'; hairline '1px'; focus-width '3px' });
test('derived accent tokens are color-mix expressions', () => {
  light['--mx-accent-selection'] === 'color-mix(in srgb, var(--mx-accent) 85%, black)';
  light['--mx-accent-text'] === 'color-mix(in srgb, var(--mx-accent) 85%, black)';
  dark['--mx-accent-text'] === 'var(--mx-accent)';
  light['--mx-accent-tint'] === 'color-mix(in srgb, var(--mx-accent) 12%, transparent)';
  light['--mx-focus-ring'] === 'color-mix(in srgb, var(--mx-accent) 50%, transparent)';
  light['--mx-on-accent'] === '#FFFFFF';
});
test('system overrides exist', () => { css matches
  /@supports \(color: AccentColor\)\s*{\s*:root\s*{[^}]*--mx-accent:\s*AccentColor;[^}]*--mx-on-accent:\s*AccentColorText;/
  and the @supports block comes AFTER the dark media block (indexOf);
  /@media \(prefers-reduced-motion: reduce\)[^@]*--mx-duration:\s*0ms/;
  /@media \(prefers-contrast: more\)[^@]*--mx-separator:\s*rgba\(0,0,0,0\.25\)/ (+ dark variant 255,255,255,0.25; sidebar = opaque);
  /@media \(prefers-reduced-transparency: reduce\)[^@]*--mx-bg-sidebar:\s*var\(--mx-bg-sidebar-opaque\)/;
});
```

- [ ] **Step 2:** `npm test`. Erwartet: FAIL (`tokens.css` fehlt).
- [ ] **Step 3:** `tests/lib/*.mjs` und `chrome/tokens.css` implementieren. Reihenfolge in der Datei: `:root` (Light) → `@media (prefers-color-scheme: dark)` → `prefers-contrast` → `prefers-reduced-transparency` → `prefers-reduced-motion` → `@supports (color: AccentColor)` als letzter Block. Nur so gewinnt der Systemakzent in beiden Modi. Fallback, falls M6 negativ war: Der `prefers-reduced-transparency`-Block bleibt drin (schadet nicht), und das README nennt die Grenze.
- [ ] **Step 4:** `npm test`. Erwartet: PASS.
- [ ] **Step 5:** Commit `feat: design tokens with light/dark and system overrides`.

---

### Task 3: Kontrast- und Literal-Lint

**Files:**
- Create: `tests/contrast.test.mjs`, `tests/lint.test.mjs`

**Interfaces:**
- Consumes: `parseTokens`, `parseColor`, `composite`, `mixBlack`, `contrast` aus Task 2.

- [ ] **Step 1: Failing Tests schreiben**

`tests/contrast.test.mjs` prüft je Modus und Paar (fg über bg, Alpha wird vorher über bg komponiert):

| Paar | Min |
|---|---|
| label auf bg-window, bg-toolbar, bg-sidebar-opaque, selection-inactive | 4.5 |
| label-secondary auf bg-window, bg-toolbar, bg-sidebar-opaque | 4.5 |
| on-accent auf accent-selection (= `mixBlack(accent, 85)`) | 4.5 |
| accent-text auf bg-window (Light `mixBlack`, Dark accent) | 4.5 |
| accent auf bg-sidebar-opaque (Ordner-Icons), accent auf bg-window (Ungelesen-Punkt) | 3 |
| label-secondary auf bg-toolbar (Toolbar-Icons) | 3 |
| flag, danger auf bg-window | 3 |
| label über pressed über bg-sidebar-opaque | 4.5 |

Testname je Paar: `` `${mode}: ${fg} on ${bg} >= ${min}` ``. `label-tertiary` ist bewusst nicht dabei (deaktiviert, Abweichung 1).

`tests/lint.test.mjs`:
- `test('area files contain no literals')`: Für jede `chrome/*.css` außer `tokens.css` gilt: Nach Entfernen von Kommentaren und `@import`/`@-moz-document`-Zeilen kein Treffer auf `/#[0-9a-fA-F]{3,8}\b/`, `/\b(rgba?|hsla?)\(/`, `/\b\d*\.?\d+(px|rem|em|ms|s)\b/`, `/\b(white|black)\b/`. Fehlermeldung: Datei:Zeile.
- `test('userChrome.css only imports')`: jede Nicht-Leer-/Nicht-Kommentarzeile ist `@import url("….css");`, und die erste ist `tokens.css`.
- `test('userChrome imports every area file')`: layout, folderpane, threadpane, messagepane, compose, preferences.
- `test('userContent imports tokens then content')`.

- [ ] **Step 2:** `npm test`. Erwartet: Kontrast PASS (Tokens aus Task 2), Lint FAIL (`userChrome.css` fehlt).
- [ ] **Step 3:** `chrome/userChrome.css` und `chrome/userContent.css` mit den Imports anlegen, dazu leere Bereichsdateien mit je einem `@-moz-document`-Rahmen aus `docs/selectors.md`.
- [ ] **Step 4:** `npm test`. Erwartet: PASS.
- [ ] **Step 5:** Commit `test: contrast and literal lint`.

---

### Task 4: Installation, Prefs und Rückbau

**Files:**
- Create: `prefs/user.js`, `scripts/install.sh`, `scripts/uninstall.sh`, `tests/install.test.mjs`

**Interfaces:**
- Produces: `scripts/install.sh <profilpfad>` und `scripts/uninstall.sh <profilpfad>`. Exit 1 mit Meldung, wenn der Pfad keine `prefs.js` enthält.

`prefs/user.js` enthält genau diese Prefs. Die Namen aus M2/M3/M6 kommen aus `docs/selectors.md`:
```
toolkit.legacyUserProfileCustomizations.stylesheets = true
mail.tabs.autoHide = true
mail.tabs.drawInTitlebar = true
mail.uidensity = 2                       // nur falls M2 = CSS-Höhe nicht möglich
<cards-view-pref> = <cards>              // M3
<cards-rowcount-pref> = 3                // M3
layout.css.prefers-reduced-transparency.enabled = true   // falls M6 positiv
```

- [ ] **Step 1: Failing Test** – `tests/install.test.mjs` mit temporärem Fake-Profil (`prefs.js`, bestehende `user.js` mit `user_pref("x", 1);`):
  - `install creates chrome symlink to repo chrome/`
  - `install appends block between "// >>> mx-theme" and "// <<< mx-theme" and keeps existing lines`
  - `install twice is idempotent` (genau ein Block)
  - `install refuses when profile/chrome exists and is not our symlink` (Exit 1, Ordner unverändert)
  - `uninstall restores user.js byte-identical and removes symlink`
  - `install without prefs.js exits 1`
- [ ] **Step 2:** `npm test`. Erwartet: FAIL.
- [ ] **Step 3:** Skripte implementieren (`set -euo pipefail`, nur POSIX/BSD-Tools). Ein eigener `chrome/`-Ordner des Nutzers wird nie überschrieben.
- [ ] **Step 4:** `npm test`. Erwartet: PASS.
- [ ] **Step 5:** Commit `feat: install/uninstall scripts with prefs block`.

---

### Task 5: WebExtension-Theme (Stufe 1)

**Files:**
- Create: `theme/manifest.json`, `scripts/build-theme.sh`, `tests/manifest.test.mjs`

**Interfaces:**
- Consumes: `parseTokens`.
- Produces: `dist/modern-thunderbird-theme.xpi` (die `manifest.json` liegt im Zip-Root). ID `modern-thunderbird-theme@local`, `strict_min_version` `"128.0"`.

Zuordnung (`theme.colors` → Light-Token, `dark_theme.colors` → Dark-Token):

| Theme-Key | Token |
|---|---|
| frame, toolbar | `--mx-bg-toolbar` |
| tab_background_text, toolbar_text, sidebar_text, popup_text, toolbar_field_text, sidebar_highlight_text | `--mx-label` |
| sidebar | `--mx-bg-sidebar-opaque` |
| sidebar_highlight | `--mx-selection-sidebar` |
| popup, toolbar_field | `--mx-bg-window` |
| popup_border, toolbar_bottom_separator | `--mx-separator` |
| tab_line | `--mx-accent` |

- [ ] **Step 1: Failing Test:** `test('theme colors equal tokens')` über die Tabelle (Vergleich normalisiert über `parseColor`), `test('color_scheme is system')`, `test('dark_theme present')`, `test('xpi has manifest at root')` (führt `build-theme.sh` aus und prüft per `unzip -l`).
- [ ] **Step 2:** `npm test`. Erwartet: FAIL.
- [ ] **Step 3:** Manifest und Build-Skript (`zip -r -X`) implementieren. Fallback bei M9 = nein: `dark_theme` entfällt. Dann setzt nur `color_scheme: system` den Dark-Look, die Farben kommen aus `chrome/`. Den Test entsprechend anpassen und den Fall in `docs/selectors.md` vermerken.
- [ ] **Step 4:** `npm test`. Erwartet: PASS. Danach manuell: xpi über Add-ons › Zahnrad › „Add-on aus Datei installieren“ einspielen, macOS-Erscheinungsbild umschalten. Scrollbars, Formularfelder und Menüs wechseln mit.
- [ ] **Step 5:** Commit `feat: static light/dark theme manifest`.

---

**Vorgehen für die Bereichs-Tasks 6–11.** Selektoren kommen nur aus `docs/selectors.md`. TB-Variablen werden zuerst auf Tokens umgebogen (z. B. `--layout-background-1: var(--mx-bg-window)`), eigene Regeln kommen erst danach. Jeder Task schreibt zuerst seine Zeilen in `docs/checklist.md` (ID, Prüfschritt, erwartetes Bild, Light/Dark). Danach wird implementiert, `npm test` muss grün sein (Lint). Dann `scripts/install.sh <profil>`, Thunderbird neu starten und jede eigene Checklistenzeile in Light und Dark abhaken. Abschluss mit Screenshot nach `docs/screenshots/<bereich>-{light,dark}.png` und Commit. Kann eine Checklistenzeile nicht erfüllt werden, wird sie mit Grund als „Grenze“ markiert und ins README übernommen. Ein stilles Weglassen gibt es nicht.

### Task 6: Icons

**Files:**
- Create: `chrome/icons/{inbox,send,drafts,archive,trash,junk,folder,smart-folder,reply,reply-all,forward,delete,flag,paperclip,compose,search,send-plane}.svg`, `chrome/icons/LICENSE`, `tests/icons.test.mjs`

**Interfaces:**
- Produces: `chrome/icons/<name>.svg`. Einbinden mit `-moz-context-properties: stroke; stroke: <token>;`.

- [ ] **Step 1: Failing Test** `tests/icons.test.mjs`: Jede Datei hat `viewBox="0 0 24 24"`, `fill="none"`, `stroke="context-stroke"`, `stroke-width="1.5"`, `vector-effect="non-scaling-stroke"` auf jedem Pfad (ergibt 1,5 px bei 16 und 18 px), `stroke-linecap="round"`, keine Farbliterale, alle 17 Namen sind vorhanden, `LICENSE` enthält „ISC“.
- [ ] **Step 2:** `npm test`. Erwartet: FAIL.
- [ ] **Step 3:** Lucide-Quellen übernehmen und anpassen (die Zuordnung Lucide-Name → Datei als Kommentar in die SVG schreiben).
- [ ] **Step 4:** `npm test`. Erwartet: PASS.
- [ ] **Step 5:** Commit `feat: monochrome icon set (Lucide, ISC)`.

### Task 7: Hauptfenster – Fensterleiste, Toolbar, Tabs, Spaces, Panels, Zustände

**Files:** Modify `chrome/layout.css`, `docs/checklist.md`

Soll-Werte: Toolbar eine Zeile mit `--mx-toolbar-height`, Hintergrund `--mx-bg-toolbar`. Icons rahmenlos in `--mx-icon-md` und `--mx-label-secondary`. Hover ist eine Fläche `--mx-selection-sidebar` mit `--mx-radius-sm`, gedrückt `--mx-pressed`. Suchfeld rechts, `--mx-search-height`, `--mx-radius-sm`. Tabs flach, der aktive Tab `--mx-bg-window`, ohne Rahmen. Spaces-Leiste schmal, nur Icons, flach. Eigene Panels (Filter, Schnellfilter, Anhänge) mit `--mx-radius-md`, `--mx-shadow-popup` und Hairline-Rand. Benachrichtigungsleisten als Kapsel mit `--mx-radius-md` und `--mx-accent-tint`, kein Gelb. Fokus nur `:focus-visible`, Ring `--mx-focus-width` in `--mx-focus-ring`. Fenster inaktiv (`:-moz-window-inactive`) heißt Auswahl `--mx-selection-inactive`. Übergänge `--mx-duration` `--mx-ease`. Globale Schrift `--mx-font-family`.

Checkliste: L-01 … L-10 (je Satz oben eine Zeile), dazu L-11 „Toolbar-Anpassung: Antworten/Weiterleiten/Löschen hinzugefügt, funktionieren“.

### Task 8: Ordnerleiste

**Files:** Modify `chrome/folderpane.css`, `docs/checklist.md`

Soll-Werte: Hintergrund `--mx-bg-sidebar` (Vibrancy nach M5, sonst `--mx-bg-sidebar-opaque`). Abschnittstitel „Favoriten“ und je Konto in `--mx-font-section-*` und `--mx-label-secondary`, ohne Konto-Icons. Zeilen `--mx-folder-row` hoch. Icon `--mx-icon-sm` in `--mx-accent`, je `data-folder-type` die Datei aus Task 6. Auswahl ist eine Pille `--mx-radius-sm` in `--mx-selection-sidebar`, der Text bleibt `--mx-label`. Zähler rechts in `--mx-font-caption-*` und `--mx-label-secondary`, ohne Badge-Hintergrund.

Checkliste F-01 … F-06, dazu F-07 „Drag & Drop von Mails auf Ordner und Ordner umsortieren funktioniert, Drop-Ziel ist sichtbar“.

### Task 9: Nachrichtenliste (Karten)

**Files:** Modify `chrome/threadpane.css`, `docs/checklist.md`

Soll-Werte: Kartenansicht mit 3 Zeilen (Prefs aus Task 4). Zeile 1: Absender `--mx-font-headline-*`, Datum rechts `--mx-font-caption-*` sekundär. Zeile 2: Betreff `--mx-font-body-*`. Danach 2 Zeilen Vorschau `--mx-font-caption-*` sekundär (`-webkit-line-clamp: 2`). Innenabstand `--mx-card-pad-y` × `--mx-card-pad-x`. Ungelesen ist ein Punkt `--mx-unread-dot` in `--mx-accent` links außerhalb der Textspalte. Markierung ist `flag.svg` in `--mx-flag`. Trennlinie Hairline `--mx-separator`, ab Textbeginn eingerückt. Auswahl: Fläche `--mx-accent-selection`, Text `--mx-on-accent`, `--mx-radius-md`, seitlich `--mx-card-inset`. Thread-Zähler als Kapsel `--mx-capsule`. Kopfzeile `#threadPaneHeaderBar`: Ordner `--mx-font-headline-*`, Zahl `--mx-font-caption-*` sekundär (Abweichung 2). Höhe nach M2: per CSS, wenn das sicher ist, sonst bleibt die von Thunderbird gelieferte Zeilenhöhe, und es werden nur die inneren Abstände verteilt.

Checkliste C-01 … C-06 sowie:
- C-07 „IMAP-Konto ohne Offline-Sync: Karten ohne Vorschau sind gleich hoch, 500+ Mails scrollen ohne Überlappung und ohne Lücken“
- C-08 „Absender und Betreff mit 200 Zeichen, Emoji, hebräischer Betreff: einzeilig mit Ellipse, Datum vollständig sichtbar“
- C-09 „macOS-Akzent Gelb und Graphit: ausgewählte Karte lesbar, Punkt und Icons in der Akzentfarbe“
- C-10 „Fenster inaktiv: Auswahl `--mx-selection-inactive`, Text primär“

### Task 10: Lesebereich und Nachrichteninhalt

**Files:** Modify `chrome/messagepane.css`, `chrome/content.css`, `docs/checklist.md`

Soll-Werte about:message: Kopf ohne Kasten. Betreff `--mx-font-title-*` steht über dem Absender. `.recipient-avatar` misst `--mx-avatar` und ist rund. Absender `--mx-font-headline-*`, An/Cc sekundär, Datum rechts. Header-Buttons nur als Icons (Abweichung 3). Anhänge als Kacheln (nach M11) mit Icons aus Task 6.

Soll-Werte `content.css`: begrenzt auf die Nachrichten-URL-Präfixe aus M10. Text höchstens `--mx-message-max` breit, zentriert, Innenabstand `--mx-space-5`. Links in `--mx-accent-text`. Für den Dark Mode gilt der Block `@media screen and (prefers-color-scheme: dark)`. Darin wird für alle Elemente der Hintergrund auf `transparent !important` gesetzt und die Farbe auf `--mx-label` `!important`, der Body bekommt `--mx-bg-window`. Bilder bleiben unverändert. Plaintext (`.moz-text-plain`, `.moz-text-flowed`, Zitatebenen) läuft über dieselben Tokens. Die Breitenbegrenzung gilt für einen Wrapper bzw. den Body mit `overflow-x: auto` und verkleinert keine Tabellen.

Checkliste M-01 … M-05 sowie:
- M-06 „Mail im Dark Mode drucken (PDF): schwarzer Text auf Weiß“
- M-07 „Newsletter mit 800-px-Tabelle: nichts abgeschnitten, horizontal scrollbar“
- M-08 „Plaintext-Mail und leerer Ordner im Dark Mode: kein heller Fleck“
- M-09 „Nachricht im eigenen Tab und Fenster: Antworten, Weiterleiten, Löschen erreichbar“

### Task 11: Composer und Einstellungen

**Files:** Modify `chrome/compose.css`, `chrome/preferences.css`, `chrome/content.css` (Editor-Block für die Editor-URL aus M10), `docs/checklist.md`

Soll-Werte Composer: Felder An/Cc/Betreff als Zeilen ohne Rahmen, nur Hairline. Senden ist `send-plane.svg` in `--mx-accent` oben links. Die Formatierungsleiste ist flach und lässt sich über die vorhandene Ansicht-Option ausblenden. Editorfläche `--mx-bg-window`. Composer-Felder mit `--mx-radius-lg`. Einstellungen: Seitenleiste wie die Ordnerleiste, Inhalte als gruppierte Karten mit `--mx-radius-lg`.

Checkliste K-01 … K-04, P-01 … P-02 sowie:
- K-05 „HTML-Mail im Dark Mode an sich selbst senden, Quelltext prüfen: kein `bgcolor`/`color`/`style` mit Dark-Werten im Body“
- K-06 „Composer offen, Erscheinungsbild wechseln: Fenster schaltet in ≤ 1 s um“

### Task 12: Abnahme, README, Lieferung

**Files:** Create `README.md`, Modify `docs/checklist.md`

- [ ] **Step 1:** Abschnitt „Abnahme“ in `docs/checklist.md` mit den 9 Akzeptanzkriterien der Spec als `A-01 … A-09` und Testplan-Punkt 4 als Matrix: inaktiv, Vollbild, 1280 × 800, Retina, externer Monitor.
- [ ] **Step 2:** Testprofil nach Spec anlegen: 3 Konten (IMAP, POP, lokal), 500+ Mails, Threads, Anhänge, HTML- und Plaintext-Mails. Die ganze Checkliste in Light und Dark durchgehen, dabei das Erscheinungsbild mehrfach zur Laufzeit wechseln. Ergebnis (Version, Datum, Fehlschläge) oben in der Checkliste vermerken.
- [ ] **Step 3:** Rückbau prüfen: `scripts/uninstall.sh` ausführen, Theme deaktivieren, neu starten. Danach Standardansicht wie vor der Installation (A-09).
- [ ] **Step 4:** `README.md` schreiben: Voraussetzungen, Installation (xpi + `install.sh`), Unified-Toolbar-Anpassung, Deinstallation, bekannte Grenzen (alle „Grenze“-Zeilen aus der Checkliste plus die Abweichungen 2–4), Regressionsablauf nach jedem Major-Update, Lizenz der Icons.
- [ ] **Step 5:** `CHANGELOG.md` anlegen, mit einem Abschnitt je Thunderbird-Major (Spec: „Changelog pro Thunderbird-Major“). Erster Eintrag: die geprüfte Version aus `docs/selectors.md`.
- [ ] **Step 6:** `npm test` grün. Screenshots Light/Dark je Bereich liegen unter `docs/screenshots/`. Commit `docs: README, changelog, acceptance run for TB <version>`.
