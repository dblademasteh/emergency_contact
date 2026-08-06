-- Seed the 10 tutorial FAQ entries (data-only migration).
--
-- These tutorial Q&As were previously added by hand to the local dev DB.
-- This migration ships them so they also appear on the NAS after `prisma
-- migrate deploy`.
--
-- The INSERT is guarded by "WHERE NOT EXISTS (SELECT 1 FROM faq_items)" so it
-- is safe to apply on a database that already has FAQ content (e.g. the local
-- dev DB) without creating duplicates. Admins can still edit/delete these
-- rows afterwards; changes are not reverted on redeploy.
--
-- Dollar-quoted strings ($faq$ ... $faq$) are used so the bullet lines,
-- apostrophes, and unicode punctuation need no escaping.

INSERT INTO "faq_items" ("id", "question", "answer", "sortOrder", "createdAt", "updatedAt")
SELECT * FROM (VALUES
  (
    'faq-tutorial-add-contact',
    'How do I add a contact?',
    $faq$• Sign in first (or create an account).
• Tap the Contact button at the bottom of the screen, or "Add a contact" when the list is empty.
• Fill in a Name and Phone number (both are required).
• Pick a Category (Emergency, Police, Fire, etc.).
• Optional: add a Note, assign it to a Group, add a Location ("Use my location" or enter coordinates), a Facebook URL, or a logo.
• Check "Pin to the top as a primary contact" if you want it pinned.
• Tap Add contact to save.$faq$,
    0,
    now(),
    now()
  ),
  (
    'faq-tutorial-add-group',
    'How do I add a group?',
    $faq$• Sign in first.
• Tap the Group button at the bottom of the screen.
• Enter a Name.
• Choose a Category.
• Optional: set a Parent group to nest it inside another group, and add a logo.
• Tap Add group to save.
• Contacts added to a group automatically use that group's category.$faq$,
    1,
    now(),
    now()
  ),
  (
    'faq-tutorial-edit-delete-contact',
    'How do I edit or delete a contact?',
    $faq$• When signed in, every contact card has a pencil (Edit) button and a trash (Delete) button.
• Tap the pencil to change the name, number, category, note, group, location, or photo.
• Tap the trash and confirm to remove the contact.
• Pin or unpin a contact by editing it and checking or unchecking "Pin to the top as a primary contact".$faq$,
    2,
    now(),
    now()
  ),
  (
    'faq-tutorial-edit-delete-group',
    'How do I edit or delete a group?',
    $faq$• When signed in, every group card has a pencil (Edit) button and a trash (Delete) button.
• Tap the pencil to change the name, category, or parent.
• Tap the trash to delete the group.
• Deleting a group also removes everything inside it (sub-groups and contacts), so a warning appears first.$faq$,
    3,
    now(),
    now()
  ),
  (
    'faq-tutorial-search',
    'How do I search for a contact?',
    $faq$• Use the "Search all contacts…" box at the top of the screen.
• Type part of a name or phone number.
• Matching contacts appear instantly.
• Clear the search box to go back to browsing by category or group.$faq$,
    4,
    now(),
    now()
  ),
  (
    'faq-tutorial-call',
    'How do I call someone?',
    $faq$• Tap the round phone button on a contact's card to call that number.
• If a contact has a location saved, a green map button opens it in Google Maps.
• If it has a Facebook URL, a blue Facebook button opens the page.
• The 911 banner at the top calls 911.
• The app works offline — tap a number to call.$faq$,
    5,
    now(),
    now()
  ),
  (
    'faq-tutorial-pills',
    'What do the category pills do?',
    $faq$• The row of pills (Home, Emergency, Police, Fire, MDRRMO, Medical, Family, Utility, Other) filters the list.
• Tap a pill to see only contacts and groups in that category.
• Tap it again to clear the filter.
• Admins can add, edit, or delete categories using the Pills button in the bottom navigation.$faq$,
    6,
    now(),
    now()
  ),
  (
    'faq-tutorial-who-can-edit',
    'Who can add and edit contacts and groups?',
    $faq$• Signed-in station users and admins can add, edit, and delete contacts and groups.
• Admins can also manage categories, the app logo, home images and links, the FAQ, and suggestions.
• Anyone — even without an account — can view, search, and call.$faq$,
    7,
    now(),
    now()
  ),
  (
    'faq-tutorial-sign-in',
    'How do I sign in or create an account?',
    $faq$• Tap the Sign in button in the top-right of the screen (or the Sign in link at the bottom).
• Station users: use the Create account tab, enter your Office, a Unit code, and a password (at least 6 characters).
• Then sign in with that unit code.
• Admins sign in with their username and password.$faq$,
    8,
    now(),
    now()
  ),
  (
    'faq-tutorial-suggestion',
    'How do I send a suggestion?',
    $faq$• Tap the round "Help and suggestions" button at the bottom-right of the screen.
• Open the Suggestion tab.
• Type your message.
• Optionally add your office.
• Tap Send suggestion — it's sent to the admins, who review it on the Suggestions page.$faq$,
    9,
    now(),
    now()
  )
) AS seed("id", "question", "answer", "sortOrder", "createdAt", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "faq_items");
