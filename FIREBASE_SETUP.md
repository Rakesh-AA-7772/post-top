# Firebase setup and security

This app uses Firebase Anonymous Authentication. Visitors do not need a password, but Firebase assigns each browser installation a UID. The UID—not the editable display name in localStorage—is used for write ownership.

## 1. Enable Anonymous Authentication
1. Open https://console.firebase.google.com/ and select project posttop-7155a.
2. Open Authentication → Sign-in method.
3. Enable Anonymous and save.
If this provider is not enabled, posting and replying will fail.

## 2. Publish the Firestore rules
The repository contains the rules in firestore.rules.
1. Open Firestore Database → Rules in the Firebase Console.
2. Replace the existing rules with the complete contents of firestore.rules.
3. Review and click Publish.

The rules allow public reads, require an authenticated Firebase user to create content, bind new documents to that user's UID, validate basic field types and lengths, and prevent users from editing or deleting another user's content. Post reaction updates are restricted to the reactions field.

Never use unrestricted rules such as allow read, write: if true. They allow anyone on the internet to modify or delete database content.

## 3. Existing content
Existing posts, replies, and music documents created before this update do not have ownerUid. They remain publicly readable, but ownership-protected updates/deletes will not work for those legacy documents. New content will include ownerUid.

## 4. Important limitations
- Anonymous accounts are lightweight identities, not strong proof of a real person's identity. They can be replaced by clearing browser data or using another browser/device.
- Firestore rules do not provide robust rate limiting or spam prevention. Add App Check and server-side moderation/rate controls before treating the app as production-hardened.
- The browser-side 600KB image check is a usability limit; it is not a substitute for a trusted image-processing/upload backend.
- Firebase web configuration values are public identifiers, not secrets. Security must come from Authentication, Firestore rules, and appropriate App Check enforcement.
- Client-side post updates (including reactions) are currently disabled because the existing client rewrites the entire nested reaction map. This is intentionally restrictive: reactions will remain unavailable until they are migrated to per-user documents with rules that enforce UID ownership.
- Music uses a public unsigned Cloudinary upload preset. Configure that preset in Cloudinary with strict resource type, MP3 format, file-size, folder, and quota restrictions; a public preset cannot securely prove uploader identity by itself.

## 5. Admin, notifications and indexes\nSee ADMIN_SETUP.md for enabling Email/Password sign-in for the admin account and assigning the admin custom claim using a trusted Firebase Admin SDK environment. Never grant admin access in frontend code. Deploy firestore.indexes.json or create the composite indexes when Firebase prompts you.\n\n## 6. Quick verification
1. Open the app in a fresh browser session.
2. Choose a display name and create a post.
3. In Firestore, confirm the new post has an ownerUid field.
4. Create a reply and confirm it also has ownerUid.
5. Test reactions and music upload/delete.
6. Confirm the app cannot modify another user's ownerUid or delete another user's content.

If posting fails, check that Anonymous Authentication is enabled and the published rules match firestore.rules.