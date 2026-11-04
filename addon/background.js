"use strict";
// Deletes via the stable MailExtension API: honours the account's trash settings and undo.
messenger.cardDelete.onDeleteClicked.addListener(async messageIds => {
  if (!messageIds.length) {
    return;
  }
  await messenger.messages.delete(messageIds, false);
});
