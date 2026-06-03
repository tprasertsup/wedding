# QA Checklist — Photos Page

Page: `/wedding/photos/`  
Backend: `docs/google-apps-script/photos-webhook.gs`

---

## Pre-Deployment Setup

- [ ] Create a Google Drive folder for photos; copy its ID into `PHOTO_FOLDER_ID`
- [ ] Set `PHOTO_SHEET_ID` (can share spreadsheet with RSVP/Moments/Gift)
- [ ] Set `MODERATION_ENABLED = true` (default) or `false` for auto-approve
- [ ] Deploy `photos-webhook.gs` as Web App: **Execute as Me**, **Anyone can access**
- [ ] Paste the Web App URL into `photos/index.html` → `CONFIG.PHOTOS_ENDPOINT`
- [ ] Create a **shared Drive folder** for approved photos (viewer-only link) and paste its URL into `CONFIG.PHOTOS_FOLDER_URL`
- [ ] The "View Shared Photos" button will only appear once `PHOTOS_FOLDER_URL` is configured

---

## Upload Flow

- [ ] Open `/wedding/photos/`
- [ ] Name and caption fields are optional; page loads with them empty
- [ ] Click / tap file zone → photo picker opens
- [ ] Drag-and-drop photos onto the file zone (desktop)
- [ ] Selected photos appear in the file list with thumbnail, name, size, and ✓
- [ ] Files over 15 MB show "Too large" error in red; upload button stays disabled until all valid
- [ ] Unsupported file types are silently not added (browser `accept` filter handles this)
- [ ] "×" button removes a photo from the list
- [ ] Upload button is disabled until at least one valid photo is selected
- [ ] Click "Upload Photos" → spinner shows "Uploading photo 1 of N…"
- [ ] After all uploads: success state shown
- [ ] Correct number of photos appear in Google Drive folder
- [ ] Correct number of rows in "Photos" Sheet tab with status = "pending"
- [ ] guest_token populated if `?guest=TOKEN` in URL

---

## Moderation

- [ ] With `MODERATION_ENABLED = true`: uploaded photos have `status = pending`
- [ ] Open shared Drive folder — pending photos should NOT be visible (they're in the private folder)
- [ ] In the Sheet, change `status` from `pending` to `approved`
- [ ] Manually move/share file in Drive to make it visible (or use the Drive folder share link after approving in sheet)
- [ ] With `MODERATION_ENABLED = false`: photos have `status = approved` and Drive sharing is set to anyone-with-link

---

## Shared Photos View

- [ ] "View Shared Photos" button is visible once `CONFIG.PHOTOS_FOLDER_URL` is set
- [ ] Clicking the button opens the shared Drive folder in a new tab
- [ ] Guests can view photos in the folder but cannot edit or upload directly

---

## Shared-Device Reset

- [ ] After upload success, click "Upload more photos" → form resets completely
- [ ] Name, caption, file list all cleared
- [ ] Second guest can upload independently

---

## iPhone Safari

- [ ] Photo picker shows camera roll correctly
- [ ] HEIC photos from Camera Roll are accepted (tested with iOS 14+)
- [ ] Upload and submission work correctly on iPhone Safari

---

## Error Handling

- [ ] Disconnect network; click Upload → error state shown
- [ ] "Try Again" returns to form with file list still intact

---

## Guest Token

- [ ] Visit `/wedding/photos/?guest=testtoken123`
- [ ] Upload a photo
- [ ] Sheet row shows `guest_token = testtoken123`

---

## Security

- [ ] No Google credentials or Drive API keys exposed in frontend HTML/JS
- [ ] `PHOTO_FOLDER_ID` and `PHOTO_SHEET_ID` only in `photos-webhook.gs` on Google's servers
- [ ] Shared photos folder URL is view-only (guests cannot upload or edit)
