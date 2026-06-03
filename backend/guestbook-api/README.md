# Nine & Tom Guestbook API

Secure Node API for the hidden wedding video guestbook.

The static guestbook lives in `guestbook/`. This API owns Google credentials, starts Google Drive resumable uploads, verifies uploaded files, writes Google Sheets metadata rows, and serves the password-protected admin data.

## Endpoints

- `POST /api/upload/init`
- `POST /api/upload/complete`
- `POST /api/admin/login`
- `GET /api/admin/submissions`
- `POST /api/admin/update-status`
- `GET /api/admin/export.csv`
- `GET /health`

## Environment

Copy `.env.example` into your deployment environment and fill every secret value.

Required values:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_DRIVE_VIDEOS_FOLDER_ID`
- `GOOGLE_DRIVE_PHOTOS_FOLDER_ID`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_TAB_NAME=submissions`
- `UPLOAD_EVENT_TOKEN`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- `ALLOWED_ORIGINS=https://tprasertsup.github.io`
- `MAX_VIDEO_DURATION_SECONDS=60`
- `MAX_VIDEO_SIZE_MB=250`
- `MAX_PHOTO_SIZE_MB=25`
- `MAX_PHOTOS_PER_BATCH=20`

Generate the admin password hash with:

```bash
npm install
npm run hash-password -- "replace with a long admin password"
```

## Google Setup

1. Create a Google Cloud project.
2. Enable Google Drive API and Google Sheets API.
3. Create a service account.
4. Put the service account client email/private key into API environment variables.
5. Create private Drive folders for guestbook videos and photos.
6. Share the Drive folders with the service account email.
7. Create or choose the metadata spreadsheet.
8. Share the spreadsheet with the service account email.

The API creates the `submissions` tab and headers automatically.

## Deploy To Cloud Run

From `backend/guestbook-api`:

```bash
gcloud run deploy nine-tom-guestbook-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars ALLOWED_ORIGINS=https://tprasertsup.github.io
```

Set the remaining secret environment variables through Secret Manager or the Cloud Run console. After deployment, update `guestbook/config.js` with the Cloud Run service URL.

## Metadata Columns

The API writes one row per uploaded media item:

`id, submissionId, createdAt, guestName, relationship, language, mediaType, prompt, caption, originalFileName, storedFileName, driveFileId, driveFolderId, driveUrl, mimeType, fileSizeBytes, durationSeconds, deviceType, userAgent, status, isFavorite, isReviewed, notes`

