# Firebase Storage CORS Setup Guide

## Problem
You're getting CORS errors when uploading music files to Firebase Storage from localhost or your domain.

## Solutions

### Solution 1: Configure Firebase Storage CORS (Recommended)

You need to update your Firebase Storage CORS rules. Follow these steps:

#### Step 1: Create a CORS Configuration File
Create a file named `cors.json` in your project root:

```json
[
  {
    "origin": ["http://localhost:*", "http://127.0.0.1:*", "https://yourdomain.com"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]
```

Replace `https://yourdomain.com` with your actual domain.

#### Step 2: Apply CORS Configuration using gsutil

1. **Install Google Cloud SDK** if you haven't already:
   - Download from: https://cloud.google.com/sdk/docs/install

2. **Authenticate with your Google account**:
   ```bash
   gcloud auth login
   ```

3. **Set your Firebase project ID**:
   ```bash
   gcloud config set project posttop-7155a
   ```

4. **Apply the CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://posttop-7155a.firebasestorage.app
   ```

5. **Verify it worked**:
   ```bash
   gsutil cors get gs://posttop-7155a.firebasestorage.app
   ```

---

### Solution 2: Update Firebase Storage Rules

Go to Firebase Console → Storage → Rules and ensure you have:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /music/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.resource.size < 10 * 1024 * 1024; // 10 MB limit
    }
  }
}
```

However, since you're using anonymous access (no authentication), use:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /music/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024; // 10 MB limit
    }
  }
}
```

---

### Solution 3: Use a Backend/Proxy (Alternative)

If CORS still doesn't work, use Cloudinary directly instead:

Update `music.html` to use Cloudinary upload widget (instead of Firebase Storage):

```javascript
// Initialize Cloudinary uploader
const cloudinaryWidget = cloudinary.createUploadWidget(
  {
    cloudName: "YOUR_CLOUDINARY_CLOUD_NAME",
    uploadPreset: "YOUR_UPLOAD_PRESET",
    folder: "we-write-music",
    maxFileSize: 10000000, // 10MB
    resourceType: "auto"
  },
  (error, result) => {
    if (!error && result && result.event === "success") {
      // Get the secure URL
      const musicUrl = result.info.secure_url;
      // Save to Firestore with the Cloudinary URL
    }
  }
);
```

Add Cloudinary script to `music.html` head:
```html
<script src="https://upload-widget.cloudinary.com/latest/upload_widget.js"></script>
```

---

## Troubleshooting Steps

1. **Clear Browser Cache**: Press `Ctrl+Shift+Delete` and clear cache

2. **Try in Incognito Mode**: This bypasses cached CORS errors

3. **Check Console for Actual Error**: Look for detailed error messages in DevTools Console

4. **Test on HTTPS**: Deploy to a HTTPS URL (Firebase Hosting, Vercel, Netlify) and test there

5. **Check Firebase Project Settings**:
   - Go to Project Settings → General
   - Verify your storage bucket is listed
   - Make sure the bucket name matches in your code

---

## Quick Fix for Development (Localhost)

If you're using localhost and want a quick fix, update your CORS config to:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

⚠️ **Warning**: This allows CORS from any origin. Only use for development!

---

## Testing the Upload After Fix

1. Refresh the page (`Ctrl+F5` to hard refresh)
2. Try uploading a small MP3 file (< 1MB)
3. Check the browser console for any new errors
4. Monitor Firebase Storage → Files to see if files appear

If you still get 503 errors, Firebase Storage might be temporarily down. Try again in a few minutes.
