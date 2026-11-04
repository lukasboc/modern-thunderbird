// Modern Thunderbird theme – prefs written into the profile by scripts/install.sh.
// Enables userChrome.css / userContent.css.
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
// Tab bar only from 2 tabs; tabs drawn into the title bar.
user_pref("mail.tabs.autoHide", true);
user_pref("mail.tabs.drawInTitlebar", true);
// Taller rows: card height is computed in JS from density (docs/selectors.md M2).
user_pref("mail.uidensity", 2);
// Cards view with 3 rows.
user_pref("mail.threadpane.listview", 0);
user_pref("mail.threadpane.cardsview.rowcount", 3);
// Accent colour follows macOS.
user_pref("mail.appearance.accentColor", "accent-color");
// Let "Reduce transparency" reach CSS.
user_pref("layout.css.prefers-reduced-transparency.enabled", true);
// Theme icons are file: URLs; Gecko only applies context-fill/-stroke to them with this pref.
// Side effect: web content may use SVG context paint as well.
user_pref("svg.context-properties.content.enabled", true);
