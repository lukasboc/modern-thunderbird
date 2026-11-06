"use strict";
/* exported cardPreview */
/* global ChromeUtils, Services */

// Experiment API: shows the first words of the message body in the third line of every
// message-list card in about:3pane. UI only, no WebExtension functions.
//
// Text source: the message header's "preview" property, which Thunderbird itself fills
// (folder summary, new-mail alerts). Missing previews are requested once per message via
// nsIMsgFolder.fetchMsgPreviewText: local and offline messages synchronously, IMAP
// messages without an offline copy asynchronously (Thunderbird fetches the body start).

var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");

const PREVIEW_CLASS = "mx-card-preview";
// Thunderbird stores up to ~200 characters; one line never shows more.
const MAX_LENGTH = 160;

// Collapses whitespace (Thunderbird keeps line breaks of plain-text mails) and trims.
function cleanPreview(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);
}

// Adds the preview line to a card's dynamic row (subject / thread button / icons).
// Returns false if it is already there.
function addPreview(row, doc) {
  if (!row || row.querySelector(`.${PREVIEW_CLASS}`)) {
    return false;
  }
  const span = doc.createElement("span");
  span.className = PREVIEW_CLASS;
  row.appendChild(span);
  return true;
}

// The header a card stands for (a collapsed thread shows its top message), or null for
// group-by-sort dummy rows and rows outside the view.
function headerForCard(card) {
  const view = card.view;
  const index = card.index ?? card._index;
  if (!view || !(index >= 0) || card.dataset?.properties?.split(" ").includes("dummy")) {
    return null;
  }
  try {
    return view.getMsgHdrAt(index);
  } catch {
    return null;
  }
}

var cardPreview = class extends ExtensionCommon.ExtensionAPI {
  get docs() {
    return (this._docs ??= new Map()); // document -> cleanup function
  }

  onStartup() {
    this.observer = subject => {
      if (subject?.URL === "about:3pane") {
        subject.addEventListener("DOMContentLoaded", () => this.inject(subject), { once: true });
      }
    };
    Services.obs.addObserver(this.observer, "document-element-inserted");

    for (const win of Services.wm.getEnumerator("mail:3pane")) {
      const tabmail = win.document.getElementById("tabmail");
      for (const tab of tabmail?.tabInfo ?? []) {
        const doc = tab.chromeBrowser?.contentDocument;
        if (doc?.URL === "about:3pane" && doc.readyState !== "loading") {
          this.inject(doc);
        }
      }
    }
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return;
    }
    Services.obs.removeObserver(this.observer, "document-element-inserted");
    for (const cleanup of this.docs.values()) {
      cleanup();
    }
    this.docs.clear();
  }

  inject(doc) {
    if (this.docs.has(doc)) {
      return;
    }
    const win = doc.defaultView;
    const template = doc.getElementById("threadPaneCardTemplate");
    const tree = doc.getElementById("threadTree");
    const CardClass = win?.customElements.get("thread-card");
    if (!template || !tree || !CardClass) {
      return;
    }

    // Keys already requested (folder URI + key), so an empty preview is not fetched again
    // on every repaint. Pending keys are batched per folder until the next frame.
    const requested = new Set();
    const pending = new Map(); // folder -> Set of message keys
    let frame = 0;

    const refreshVisible = () => {
      for (const card of tree.querySelectorAll(".card-layout")) {
        fill(card);
      }
    };

    const docs = this.docs;
    const flush = () => {
      frame = 0;
      for (const [folder, keys] of pending) {
        try {
          const isAsync = folder.fetchMsgPreviewText([...keys], {
            OnStartRunningUrl() {},
            OnStopRunningUrl() {
              if (docs.has(doc)) {
                refreshVisible();
              }
            },
          });
          if (!isAsync) {
            refreshVisible();
          }
        } catch (e) {
          console.warn("cardPreview: fetchMsgPreviewText failed", e);
        }
      }
      pending.clear();
    };

    const request = header => {
      const folder = header.folder;
      const id = `${folder?.URI}#${header.messageKey}`;
      if (!folder || requested.has(id)) {
        return;
      }
      requested.add(id);
      if (!pending.has(folder)) {
        pending.set(folder, new Set());
      }
      pending.get(folder).add(header.messageKey);
      frame ||= win.requestAnimationFrame(flush);
    };

    const fill = card => {
      const span = card.querySelector?.(`.${PREVIEW_CLASS}`);
      if (!span) {
        return;
      }
      const header = headerForCard(card);
      const text = cleanPreview(header?.getStringProperty("preview"));
      if (span.textContent !== text) {
        span.textContent = text;
      }
      if (header && !text) {
        request(header);
      }
    };

    // New cards clone the template; cards already on screen get the line directly.
    addPreview(template.content.querySelector(".thread-card-dynamic-row"), doc);
    for (const row of tree.querySelectorAll(".card-layout .thread-card-dynamic-row")) {
      addPreview(row, doc);
    }

    // Thunderbird repaints a card (scrolling, selection, sorting) through fillRow().
    const originalFillRow = CardClass.prototype.fillRow;
    CardClass.prototype.fillRow = function (...args) {
      const result = originalFillRow.apply(this, args);
      try {
        fill(this);
      } catch (e) {
        console.warn("cardPreview: fill failed", e);
      }
      return result;
    };
    refreshVisible();

    this.docs.set(doc, () => {
      CardClass.prototype.fillRow = originalFillRow;
      if (frame) {
        win.cancelAnimationFrame(frame);
      }
      for (const span of [
        ...template.content.querySelectorAll(`.${PREVIEW_CLASS}`),
        ...tree.querySelectorAll(`.${PREVIEW_CLASS}`),
      ]) {
        span.remove();
      }
    });
    win.addEventListener("unload", () => this.docs.delete(doc), { once: true });
  }

  getAPI() {
    return { cardPreview: {} };
  }
};
