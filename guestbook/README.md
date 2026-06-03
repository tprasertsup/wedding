# Nine & Tom Video Guestbook

Hidden static guestbook app for `https://tprasertsup.github.io/wedding/guestbook/`.

## Public URLs

- Guest QR URL: `/wedding/guestbook/?token=<UPLOAD_EVENT_TOKEN>`
- Kiosk URL: `/wedding/guestbook/?token=<UPLOAD_EVENT_TOKEN>&kiosk=1`
- Admin URL: `/wedding/guestbook/admin.html`

The main wedding website does not link to these pages.

## Configure The API URL

After deploying `backend/guestbook-api`, update `guestbook/config.js`:

```js
window.GUESTBOOK_CONFIG = {
  apiBaseUrl: 'https://your-deployed-api.example.com',
  maxVideoDurationSeconds: 60,
  maxPhotosPerBatch: 20
};
```

Do not put Google credentials, service account JSON, admin passwords, or upload tokens in this static folder.

## Browser Notes

- Video recording uses `MediaRecorder` with front camera preference.
- The app tries browser-supported formats in this order: VP9 WebM, VP8 WebM, WebM, MP4.
- Photos support common image formats and accept HEIC/HEIF, although some browsers cannot show HEIC previews.
- Failed uploads keep the selected/recorded media in memory for retry until the page is reloaded.
