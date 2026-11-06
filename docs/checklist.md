# Abnahme- und Regressionscheckliste

Ablauf: `scripts/install.sh <profil>`, Theme-xpi installiert, Thunderbird neu starten. Jede Zeile in **Light und Dark** prüfen.
Ergebnis: ✅ erfüllt · ❌ Fehler (Issue) · ⚠️ Grenze (siehe README).

| Lauf | TB-Version | Datum | Fehlschläge |
|---|---|---|---|
| – | – | – | noch nicht durchgeführt |

## Theme (T)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| T-01 | xpi über Add-ons › Zahnrad › „Add-on aus Datei installieren“, dann Erscheinungsbild in macOS umschalten | Scrollbars, Formularfelder, Menüs wechseln mit; Toolbar `#F6F6F6` / `#2B2B2B` | | |

## Hauptfenster (L)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| L-01 | Hauptfenster mit einem Tab öffnen | Keine Tableiste; Toolbar eine Zeile, ca. 52 px, Ampel-Buttons links daneben (M4) | | |
| L-02 | Toolbar-Icons ansehen | rahmenlos, 18 px, grau (sekundär); eigene Linien-Icons für Verfassen/Antworten/Weiterleiten/Löschen/Archiv/Spam | | |
| L-03 | Maus über Toolbar-Button, dann klicken | Hover: graue 6-px-Fläche; gedrückt: doppelt so dunkel | | |
| L-04 | Suchfeld | rechts, abgerundet, 28 px hoch, gefüllt statt umrandet | | |
| L-05 | Zweiten Tab öffnen (Nachricht im Tab) | Tableiste erscheint; Tabs flach, aktiver Tab heller, kein Rahmen | | |
| L-06 | Spaces-Leiste | schmal, nur Icons, flach, aktiver Space als graue Fläche | | |
| L-07 | Schnellfilter-/Anhangs-Panel öffnen | 8 px Radius, weicher Schatten, 1 px Rand | | |
| L-08 | Benachrichtigung auslösen (z. B. „Externe Inhalte blockiert“) | Kapsel mit 8 px Radius, blasse Akzentfläche, kein Gelb | | |
| L-09 | Mit Tab durch die Toolbar navigieren | 3-px-Fokusring in Akzent 50 %, nur bei Tastatur | | |
| L-10 | Fenster in den Hintergrund (anderes App-Fenster aktiv) | Auswahlen werden grau (`#DCDCDC` / `#3A3A3A`), Text primär | | |
| L-11 | Toolbar anpassen: Antworten, Weiterleiten, Löschen hinzufügen und benutzen | Buttons erscheinen und funktionieren | | |

## Ordnerleiste (F)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| F-01 | Ordnerleiste ansehen | deckend `#F6F6F6` / `#282828`, 1 px Trennlinie rechts | | |
| F-02 | Gruppen „Favoriten“ und je Konto | 11 px / 600, grau, Konto ohne Icon | | |
| F-03 | Ordnerzeilen | 28 px hoch, Icon 16 px in Akzentfarbe, eigene Linien-Icons je Ordnertyp | | |
| F-04 | Ordner auswählen | graue 6-px-Pille, Text bleibt schwarz/weiß | | |
| F-05 | Ungelesen-Zähler | rechts, 12 px grau, kein Badge | | |
| F-06 | Ordner während Abruf / mit Fehler | Lade- bzw. Warn-Icon von Thunderbird bleibt sichtbar | | |
| F-07 | Mails auf Ordner ziehen, Ordner umsortieren | Drop-Ziel mit Akzentrand sichtbar, Aktion funktioniert | | |

## Nachrichtenliste (C)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| C-01 | Ordner mit 500+ Mails, Kartenansicht | Karten: Absender 13/600 + Datum rechts 12 grau; Betreff 13/400 | | |
| C-02 | Vorschau | ⚠️ Grenze: TB 159 liefert keinen Vorschautext in Karten (docs/selectors.md M3) | | |
| C-03 | Ungelesene Mail | 8-px-Punkt in Akzentfarbe links der Textspalte | | |
| C-04 | Markierte Mail | Markierungs-Icon in Orange (`--mx-flag-icon`) | | |
| C-05 | Trennlinien | 1 px, ab Textbeginn eingerückt, nicht an ausgewählter/gehoverter Karte | | |
| C-06 | Thread mit Antworten | Thread-Zähler als graue Kapsel | | |
| C-07 | IMAP-Konto ohne Offline-Sync, 500+ Mails schnell scrollen | Karten gleich hoch, keine Überlappung, keine Lücken | | |
| C-08 | Absender/Betreff mit 200 Zeichen, Emoji, hebräischer Betreff | einzeilig mit Ellipse, Datum vollständig sichtbar | | |
| C-09 | macOS-Akzent auf Gelb und auf Graphit stellen | ausgewählte Karte lesbar (Text in `AccentColorText`), Punkt und Ordner-Icons in Akzentfarbe | | |
| C-10 | Karte auswählen, dann Fenster in den Hintergrund | aktiv: Akzentfläche, 8 px Radius, 6 px seitlich; inaktiv: grau, Text primär | | |
| C-11 | Ordnerkopf über der Liste | Ordnername 13/600, Anzahl 12 grau | | |

## Lesebereich (M)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| M-01 | Mail öffnen, Kopf ansehen | kein Kasten; Betreff 22/700 oben; Avatar-Kreis 40 px; Absender 13/600; An/Cc grau; Datum rechts | | |
| M-02 | Header-Buttons | nur Icons, flach, Hover-Fläche | | |
| M-03 | Mail mit 3 Anhängen | Anhänge als Kacheln mit 8 px Radius | | |
| M-04 | Lange Textmail | Text max. 720 px breit, zentriert, 24 px Innenabstand; Links in Akzentfarbe | | |
| M-05 | HTML-Newsletter mit eigenem hellen Design im Dark Mode | dunkel dargestellt, Text hell, Bilder unverändert | | |
| M-06 | Mail im Dark Mode drucken (als PDF) | schwarzer Text auf Weiß, Originalfarben | | |
| M-07 | Newsletter mit 800-px-Tabelle | nichts abgeschnitten, horizontal scrollbar, Bilder unverzerrt | | |
| M-08 | Plaintext-Mail und leerer Ordner im Dark Mode | kein heller Fleck | | |
| M-09 | Nachricht im eigenen Tab und eigenen Fenster | Antworten, Weiterleiten, Löschen erreichbar | | |

## Composer (K) und Einstellungen (P)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| K-01 | Neue Mail verfassen | An/Cc/Betreff als Zeilen ohne Rahmen, nur Trennlinie | | |
| K-02 | Senden-Button | Papierflieger in Akzentfarbe, ganz links in der Toolbar, Tooltip „Senden“ | | |
| K-03 | Formatierungsleiste | flach; über Ansicht › Symbolleisten ausblendbar | | |
| K-04 | Editorfläche | weiß bzw. `#1E1E1E`, Text hell im Dark Mode | | |
| K-05 | HTML-Mail im Dark Mode an sich selbst senden, Quelltext ansehen (Strg+U) | kein `bgcolor`/`color`/`style` mit Dark-Werten im Body | | |
| K-06 | Composer offen, Erscheinungsbild in macOS wechseln | Fenster schaltet in ≤ 1 s um | | |
| P-01 | Einstellungen öffnen | Kategorien-Seitenleiste wie Ordnerleiste (graue Pille) | | |
| P-02 | Inhalte | gruppierte Karten mit 10 px Radius auf grauem Grund | | |

## Suchergebnisse (S)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| S-01 | Suchbegriff oben rechts eingeben, Enter | Ergebnis-Tab: Suchbegriff groß (22/700), Erklärung grau | | |
| S-02 | Ergebnisliste | Karten: Absender 13/600, Datum grau rechts, Betreff 13/400, Textauszug grau in Systemschrift, max. 2 Zeilen | | |
| S-03 | Fundstellen im Textauszug | dezent hinterlegt (Akzent 12 %), Text lesbar | | |
| S-04 | Maus über Ergebnis | graue Fläche, Betreff in Akzentfarbe; Klick öffnet die Mail | | |
| S-05 | Filterspalte | Seitenleisten-Fläche, Abschnittstitel 11/600 grau; Ja/Nein-Filter als Pillen, aktiv in Akzentfarbe mit weißem Text | | |
| S-06 | Personen-/Ordner-Filter anklicken | Balken abgerundet, Auswahl in Akzentfarbe; Filter wirkt | | |
| S-07 | Zeitleiste, „Alle anzeigen“, Popup-Menü eines Filters | Theme-Farben, Menü als Karte mit Schatten | | |

## Schnell-Löschen (D, Add-on)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| D-01 | Add-on installieren, Maus über eine Karte | grauer Papierkorb neben dem Stern; ohne Hover unsichtbar | | |
| D-02 | Papierkorb überfahren, dann klicken | rot mit grauer Fläche; Mail landet im Papierkorb, Auswahl bleibt unverändert, ⌘Z holt sie zurück | | |
| D-03 | Zugeklappter Thread: Papierkorb klicken | ganzer Thread wird gelöscht (wie Entf) | | |
| D-04 | Ausgewählte Karte | Papierkorb weiß | | |
| D-05 | Add-on deaktivieren | Knopf verschwindet ohne Neustart, Liste funktioniert normal | | |

## Textvorschau (P, Add-on)

| ID | Prüfschritt | Erwartet | L | D |
|---|---|---|---|---|
| P-01 | Add-on installieren, Posteingang öffnen | dritte Kartenzeile zeigt die ersten Worte der Mail in Grau, einzeilig mit „…“; Kartenhöhe unverändert; Betreff und Vorschau beginnen bündig mit dem Absender | | |
| P-02 | IMAP-Ordner ohne Offline-Kopie öffnen | Vorschau erscheint nach kurzer Verzögerung; Scrollen bleibt flüssig | | |
| P-03 | Thread mit Antworten | Vorschau rechts neben dem Antworten-Zähler, Icons rechts unverändert | | |
| P-04 | Ausgewählte Karte (Liste fokussiert / Fenster inaktiv) | Vorschau weiß bzw. in Textfarbe | | |
| P-05 | Verschlüsselte Mail, Gruppierung nach Sortierung | keine Vorschau, keine Fehler in der Fehlerkonsole | | |
| P-06 | `mail.threadpane.cardsview.rowcount` = 2 | keine Vorschau, Karten wie ohne Add-on | | |
| P-07 | Add-on deaktivieren | Vorschau verschwindet ohne Neustart | | |

## Abnahme (A) – Akzeptanzkriterien der Spec

| ID | Kriterium | L | D |
|---|---|---|---|
| A-01 | Hauptfenster, Composer und Einstellungen nutzen ausschließlich Tokens aus `tokens.css` (automatisch: `npm test` – Lint + vars) | | |
| A-02 | Dark Mode folgt der macOS-Einstellung automatisch, auch beim Wechsel zur Laufzeit, in allen offenen Fenstern | | |
| A-03 | Kein heller Fleck im Dark Mode (Popups, Dialoge, Scrollbars, Suchfeld, leere Ordner, Plaintext-Mails) | | |
| A-04 | Akzentfarbe ändert sich mit der macOS-Akzentfarbe (TB: Einstellungen › Darstellung › Akzentfarbe = System) | | |
| A-05 | Nachrichtenliste zeigt Karten mit Absender, Betreff ~~und 2 Zeilen Vorschau~~ (⚠️ Grenze, C-02) | | |
| A-06 | Kontrastwerte erfüllt, Light und Dark (automatisch: `tests/contrast.test.mjs`) | | |
| A-07 | „Kontrast erhöhen“, „Transparenz reduzieren“, „Bewegung reduzieren“ greifen | | |
| A-08 | Keine Funktion verliert Bedienbarkeit (alle Buttons, Menüs, Drag & Drop) | | |
| A-09 | `scripts/uninstall.sh` + Theme deaktivieren + Neustart ergibt den Standard | | |

## Umgebungsmatrix (Testplan Punkt 4)

| Bedingung | L | D |
|---|---|---|
| Fenster inaktiv | | |
| Vollbild | | |
| 1280 × 800 | | |
| Retina | | |
| Externer Monitor | | |

Testprofil: 3 Konten (IMAP, POP, lokal), 500+ Mails, Threads, Anhänge, HTML- und Plaintext-Mails. Erscheinungsbild während des Laufs mehrfach wechseln.
Nach jedem Thunderbird-Major-Update: `docs/selectors.md` gegen die neue `omni.ja` prüfen, dann diese Checkliste komplett.
