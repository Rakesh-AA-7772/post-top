# WE WRITE admin and moderation setup

The moderation dashboard is available at /admin.html. Access is restricted by the Firebase custom claim admin: true.

## 1. Enable a permanent admin sign-in
1. In Firebase Console → Authentication → Sign-in method, enable Email/Password.
2. Create or select the intended administrator account.
3. Sign in through the email/password form on admin.html.

Normal visitors can continue to use anonymous authentication. The admin account must be a permanent account because anonymous identities can be lost when browser data is cleared.

## 2. Grant admin access safely
1. Copy the administrator's Firebase UID from Authentication → Users.
2. In a trusted server or private administrative environment configured with Firebase Admin SDK, run:

    await admin.auth().setCustomUserClaims('THE_ADMIN_UID', { admin: true });

3. Sign out and back in so the new ID token contains the claim.
4. Open admin.html. It checks the signed Firebase ID token.

Never put a service-account JSON key, Admin SDK credentials, or a way to set custom claims in frontend JavaScript. Never grant admin status using localStorage, a display name, or a client-side button.

To revoke access, replace the user's custom claims with an empty object using the Admin SDK, then refresh their ID token.

## 3. Publish the updated Firestore rules
The updated firestore.rules now supports:
- Reactions stored in posts/{postId}/reactions/{uid}; users can write only their own reaction document.
- Private notifications; each user can read and mark read only their own notifications.
- User-submitted reports; only admins can read and moderate reports.
- Admin deletion of posts, replies and music records.

Copy the complete firestore.rules file into Firebase Console → Firestore Database → Rules, review it, and click Publish. The new features will be denied until the updated rules are published.

## 4. Notifications and moderation notes
Notifications are currently created by the browser after a reply or reaction. This gives the app an in-app notification inbox, but a determined client can attempt to forge a notification for the owner of a post. For stronger production integrity, move notification creation to a trusted Cloud Function that validates the event.

The admin panel lists open reports, allows marking them reviewed, and allows an authorized admin to remove the reported post. A report reason must be spam, harassment, inappropriate, or other.

## 5. Authentication checks
- Open the app in a normal browser session and confirm anonymous sign-in succeeds.
- Create a post and verify ownerUid is the signed-in Firebase UID.
- Open admin.html while signed in anonymously; it should not grant admin access.
- Sign in with the permanent admin account; the dashboard should open only if its ID token includes admin: true.
- Test that a normal user cannot read reports or delete another user's content.
