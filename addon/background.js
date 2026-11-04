"use strict";
// Deletes via the stable MailExtension API: moves to trash per account settings.
// isUserAction: Thunderbird passes the mail window and allows undo (⌘Z), like the Delete key.
// (TB 159 rejects a plain boolean as second argument.)
messenger.cardDelete.onDeleteClicked.addListener(async messageIds => {
  if (!messageIds.length) {
    return;
  }
  await messenger.messages.delete(messageIds, { isUserAction: true });
});
