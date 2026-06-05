# QA Checklist — Voice Guestbook

Page: `/wedding/guestbook/`  
Backend: `docs/google-apps-script/guestbook-webhook.gs`

---

## Pre-Deployment Setup

- [ ] Create a Google Drive folder for voice recordings; copy its ID into `MOMENTS_DRIVE_FOLDER_ID`
- [ ] Set `MOMENTS_SHEET_ID` to your Google Sheet ID (can share with the RSVP sheet — a new "Moments" tab is created automatically)
- [ ] Deploy `moments-webhook.gs` as a Web App: **Execute as Me**, **Anyone can access**
- [ ] Paste the deployed Web App URL into `moments/index.html` → `CONFIG.MOMENTS_ENDPOINT`
- [ ] Deploy `moments-webhook.gs` again after any changes (create a new version under Manage Deployments)

---

## Desktop Chrome — Text Flow

- [ ] Open `/wedding/guestbook/`
- [ ] Default tab is "Voice Message"; click "Written Note" — voice panel hides, text panel shows
- [ ] Submit with empty textarea → textarea border turns rose-red, no network request sent
- [ ] Enter a message and click "Send Written Blessing"
- [ ] Spinner appears with "Sending your blessing…"
- [ ] Success state appears: "Thank you so much"
- [ ] "Leave another blessing" button is visible on success state
- [ ] Tap "Leave another blessing" → form resets completely: name cleared, textarea cleared, shows voice tab
- [ ] Check Google Sheet "Moments" tab: new row with type=text, message_text populated, drive_file_id empty
- [ ] Name field left blank → sheet row has empty guest_name column

---

## Desktop Chrome — Voice Flow

- [ ] Open `/wedding/guestbook/`
- [ ] Voice tab shown by default
- [ ] Name field is optional — proceed without filling it
- [ ] Click the record button (🎙)
- [ ] Browser asks for microphone permission — click Allow
- [ ] Timer counts up in rose-red color
- [ ] Record for ~5 seconds, then click Stop (⏹)
- [ ] Timer stops; status text changes to "Recording saved — press play to review"
- [ ] Audio playback element appears with the recorded clip
- [ ] Click play — audio plays back correctly
- [ ] Click "Record again" — playback hidden, timer resets to 0:00, submit button disabled again
- [ ] Record again and stop
- [ ] Click "Send Voice Blessing"
- [ ] Spinner: "Encoding your voice message…" then "Sending your blessing…"
- [ ] Success state shown
- [ ] Check Google Drive folder: audio file named `voice-blessing-{timestamp}.webm`
- [ ] Check Google Sheet: new row with type=voice, drive_file_id populated, drive_file_url accessible
- [ ] Click the Drive URL — audio plays in browser

---

## Shared Device / Elderly Guest Reset

- [ ] Submit a blessing (text or voice)
- [ ] Success state shown
- [ ] Tap "Leave another blessing"
- [ ] Name field is empty (previous guest's name is gone)
- [ ] Textarea is empty
- [ ] Voice timer shows 0:00
- [ ] No audio preview visible
- [ ] Submit button is disabled (voice) or enabled (text after typing)
- [ ] Second guest submits successfully — two separate rows in the Sheet

---

## iPhone Safari — Voice Flow (audio/mp4 fallback)

- [ ] Open `/wedding/guestbook/` on iPhone (iOS 14.5+)
- [ ] Record a voice message
- [ ] File saved to Drive has `.mp4` extension
- [ ] Audio playback works in the `<audio>` element on Safari
- [ ] Sheet row: mime_type = `audio/mp4`

---

## Microphone Permission Denied

- [ ] Open `/wedding/guestbook/`
- [ ] Click record button → deny microphone permission when prompted
- [ ] Voice tab automatically switches to "Written Note"
- [ ] Fallback notice appears (soft warning box)
- [ ] Record button and timer are hidden
- [ ] Text submission still works normally

---

## No MediaRecorder Support (Old Browser Simulation)

To simulate: open browser DevTools console and run:
```javascript
const saved = window.MediaRecorder; delete window.MediaRecorder; location.reload();
```
- [ ] On page load, "Written Note" tab is shown automatically
- [ ] Fallback notice is visible
- [ ] Record button hidden

---

## Guest Token Passthrough

- [ ] Visit `/wedding/guestbook/?guest=testtoken123`
- [ ] Submit any blessing
- [ ] Google Sheet row shows `guest_token = testtoken123`
- [ ] Visit `/wedding/guestbook/` (no token)
- [ ] Submit — sheet row shows empty guest_token

---

## Max Recording Duration (180 seconds)

- [ ] Start recording
- [ ] Let it run to 3:00
- [ ] Recording stops automatically — no manual Stop needed
- [ ] Timer shows 3:00 (not counting further)
- [ ] Playback and submit work normally

---

## Error States

- [ ] Disconnect from internet; submit a blessing
- [ ] Error state shown: "Could not reach the server…"
- [ ] "Try Again" button shown
- [ ] Click Try Again → form state restored with name/text still present
- [ ] Reconnect and resubmit → success

---

## QR Code (on moments page)

- [ ] Small QR code visible at the bottom of the card ("Scan to open on your phone")
- [ ] Scan with a different phone → opens `/wedding/guestbook/` correctly

---

## Portal Navigation

- [ ] Click "← Back to guest portal" on success state → navigates to `/wedding/guest/`
- [ ] On `/wedding/guest/`, the "Leave a Blessing" card links to `/wedding/guestbook/`

---

## Accessibility

- [ ] Record button has `aria-label` ("Start recording" / "Stop recording")
- [ ] Tab buttons have `role="tab"` and `aria-selected`
- [ ] Name and message inputs have visible `<label>` elements
- [ ] Success/error headings are `<h2>` (readable by screen readers)
- [ ] All interactive elements reachable via keyboard Tab
- [ ] Record/submit buttons meet 48px minimum touch target size on mobile
