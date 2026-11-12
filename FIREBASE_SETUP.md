# Firebase setup and security

WE WRITE uses Firebase Anonymous Authentication for normal visitors. Firebase assigns each browser installation a UID; that UID, not the editable display name in localStorage, is used for content ownership.

## 1. Enable Anonymous Authentication
1. Open Firebase Console and select project posttop-7155a.
2. Open Authentication → Sign-in method.
3. Enable Anonymous and save.

## 2. Publish the latest Firestore rules
The repository's firestore.rules has been updated to support:
- Public feed reads and UID-owned post/reply/music creation.
- Separate per-user reaction documents at posts/{postId}/reactions/{uid}.
- Private notifications, with each user limited to their own inbox.
- User reports and admin-only moderation.
- Admin custom claims for moderation and removal of content.

Open Firestore Database → Rules, replace the complete ruleset with the current firestore.rules from main, review it, and click Publish. The rules you previously published do not automatically update when this repository changes. The new features will fail until you publish this latest version.

Never use unrestricted rules such as allow read, write: if true.

## 3. Enable admin sign-in
1. Open Authentication → Sign-in method.
2. Enable Email/Password.
3. Create or select a permanent administrator account.
4. Follow ADMIN_SETUP.md to assign the Firebase custom claim admin: true using a trusted Firebase Admin SDK environment.

Do not grant admin privileges using localStorage, display names, frontend code, or a public admin-code document. Never put a service-account key in this repository.

## 4. Deploy Firestore indexes
The repository includes firestore.indexes.json for notification inbox, unread notification count, moderation reports and replies. Deploy it with the Firebase CLI or create the composite indexes from the links Firebase provides when a query reports a missing index.

## 5. Existing content
Older posts, replies and music records without ownerUid remain publicly readable, but their owners cannot use UID-based delete controls on those legacy documents. New documents include ownerUid. A migration would need to be performed in a trusted environment if you want to assign ownership to old records.

Legacy reaction maps may still appear as historical reactions. New reactions are stored in per-user subcollection documents.

## 6. Important limitations
- Anonymous accounts are lightweight identities, not strong proof of a real person's identity. They can be replaced by clearing browser data or using another browser/device.
- Firestore rules do not provide robust rate limiting. Consider Firebase App Check and server-side abuse controls.
- The browser-side image size check is a usability limit, not trusted server-side validation.
- Music uploads use a public unsigned Cloudinary upload preset. Restrict the preset to MP3/audio, file size, folder and quota in Cloudinary; public unsigned uploads cannot securely prove uploader identity.
- Notifications are currently written by the client after a reply/reaction. A determined client can attempt to forge an event. For stronger production integrity, generate notifications in a trusted Cloud Function.

## 7. Verification checklist
1. Open the app in a fresh browser session and confirm anonymous sign-in succeeds.
2. Create a post and verify its ownerUid matches the signed-in Firebase UID.
3. Add and remove reactions from two separate accounts; each account should control only its own reaction.
4. Reply to another user's post and confirm the owner receives a notification.
5. Confirm the notifications page shows only the signed-in user's notifications.
6. Submit a report from the feed.
7. Open admin.html as a normal anonymous user; access must be denied.
8. Sign in with the permanent admin account; the moderation dashboard should open only when its token has admin: true.
9. Confirm a normal user cannot read reports or delete another user's content.

If posting or reacting fails, check that Anonymous Authentication is enabled and the latest firestore.rules has been published.
