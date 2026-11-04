"use strict";
/* exported cardDelete */
/* global ChromeUtils, Services */

// Experiment API: puts a delete button next to the star on every message-list card in
// about:3pane and reports clicks (as WebExtension message ids) to background.js.
// UI only – the deletion itself goes through messenger.messages.delete.

var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");

const BUTTON_CLASS = "mx-card-delete";

function deleteLabel(locale) {
  return String(locale).toLowerCase().startsWith("de") ? "Löschen" : "Delete";
}

// Adds the button after the star button. Returns false if it is already there.
function addButton(container, doc, label) {
  if (!container || container.querySelector(`.${BUTTON_CLASS}`)) {
    return false;
  }
  const button = doc.createElement("button");
  button.type = "button";
  button.className = `${BUTTON_CLASS} button button-flat icon-button icon-only`;
  button.tabIndex = -1;
  button.title = label;
  button.setAttribute("aria-label", label);
  const star = container.querySelector(".tree-button-flag");
  container.insertBefore(button, star ? star.nextSibling : null);
  return true;
}

// The messages a card stands for: one message, or the whole collapsed thread.
function headersForRow(view, index) {
  if (view.isContainer(index) && !view.isContainerOpen(index)) {
    const thread = view.getThreadContainingIndex(index);
    const headers = [];
    for (let i = 0; i < thread.numChildren; i++) {
      headers.push(thread.getChildHdrAt(i));
    }
    return headers;
  }
  return [view.getMsgHdrAt(index)];
}

var cardDelete = class extends ExtensionCommon.ExtensionAPI {
  onStartup() {
    this.listeners = new Set();
    this.docs = new Map(); // document -> cleanup function
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
    const template = doc.getElementById("threadPaneCardTemplate");
    const tree = doc.getElementById("threadTree");
    if (!template || !tree) {
      return;
    }
    const label = deleteLabel(Services.locale.appLocaleAsBCP47);
    // New cards clone the template; cards already on screen get the button directly.
    addButton(template.content.querySelector(".thread-card-icon-info"), doc, label);
    for (const info of tree.querySelectorAll(".card-layout .thread-card-icon-info")) {
      addButton(info, doc, label);
    }

    // Capture phase: keep the click from selecting, opening or dragging the card.
    const swallow = event => {
      if (event.target.closest?.(`.${BUTTON_CLASS}`)) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    const onClick = event => {
      const button = event.target.closest?.(`.${BUTTON_CLASS}`);
      if (!button) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      const row = button.closest(".card-layout");
      const view = doc.defaultView.gDBView;
      if (row && view && row.index >= 0) {
        this.report(headersForRow(view, row.index));
      }
    };
    tree.addEventListener("mousedown", swallow, true);
    tree.addEventListener("dblclick", swallow, true);
    tree.addEventListener("click", onClick, true);

    this.docs.set(doc, () => {
      tree.removeEventListener("mousedown", swallow, true);
      tree.removeEventListener("dblclick", swallow, true);
      tree.removeEventListener("click", onClick, true);
      for (const button of [
        ...template.content.querySelectorAll(`.${BUTTON_CLASS}`),
        ...tree.querySelectorAll(`.${BUTTON_CLASS}`),
      ]) {
        button.remove();
      }
    });
    doc.defaultView.addEventListener("unload", () => this.docs.delete(doc), { once: true });
  }

  report(headers) {
    const ids = headers
      .map(header => this.extension.messageManager.convert(header)?.id)
      .filter(id => Number.isInteger(id));
    for (const fire of this.listeners) {
      fire.async(ids);
    }
  }

  getAPI(context) {
    return {
      cardDelete: {
        onDeleteClicked: new ExtensionCommon.EventManager({
          context,
          name: "cardDelete.onDeleteClicked",
          register: fire => {
            this.listeners.add(fire);
            return () => this.listeners.delete(fire);
          },
        }).api(),
      },
    };
  }
};
