# QA Checklist — Gift Page

Page: `/wedding/gift/`  
Backend: `docs/google-apps-script/gift-webhook.gs`

---

## Pre-Deployment Setup

- [ ] Create a private Google Drive folder for slips; copy its ID into `SLIP_FOLDER_ID`
- [ ] Set `GIFT_SHEET_ID` (can share spreadsheet with RSVP/Moments)
- [ ] Deploy `gift-webhook.gs` as Web App: **Execute as Me**, **Anyone can access**
- [ ] Paste the Web App URL into `gift/index.html` → `CONFIG.GIFT_ENDPOINT`
- [ ] (Optional) Upload your real PromptPay QR image to `/wedding/assets/promptpay-qr.png`
- [ ] (Optional) Upload your real Venmo QR image to `/wedding/assets/venmo-qr.png`

---

## First-load Check

- [ ] Open `/wedding/gift/`
- [ ] "No registry" note is visible and readable
- [ ] PromptPay and Venmo buttons are visible
- [ ] Language toggle works (EN → ไทย → EN)

---

## PromptPay Flow

- [ ] Click PromptPay button → QR display state appears
- [ ] QR placeholder SVG is visible if real image not added yet
- [ ] Real QR image loads correctly once `/assets/promptpay-qr.png` is added
- [ ] "↓ Save QR" download link works with real image
- [ ] Click "I've transferred" → slip upload form appears
- [ ] Back button returns to QR state
- [ ] Back button on QR state returns to choose state
- [ ] Name field accepts text (optional)
- [ ] Amount field accepts numbers (optional); rejects non-numeric
- [ ] Note field accepts text (optional)
- [ ] Slip upload area accepts JPEG, PNG, WebP, PDF
- [ ] Slip upload rejects unsupported file types (show alert)
- [ ] Slip upload rejects files > 10 MB (show alert)
- [ ] File name and size show after successful selection
- [ ] Submit without slip → red error message appears
- [ ] Submit with slip → spinner → success message
- [ ] Google Drive slip folder contains the uploaded slip file
- [ ] Google Sheet "Gift" tab contains a new row with all fields
- [ ] Submitting with blank name → guest_name column is empty in sheet

---

## Venmo Flow

- [ ] Click Venmo button → QR display state appears
- [ ] QR placeholder SVG is visible if real image not added yet
- [ ] Real QR image loads once `/assets/venmo-qr.png` is added
- [ ] "Done — Gift Sent ✓" button → success state (no backend call needed)
- [ ] Success message says "Thank you so much!" (Venmo variant)
- [ ] Back button returns to choose state

---

## No Registry Note

- [ ] Note reads clearly in English
- [ ] Note reads clearly in Thai after switching language
- [ ] No mention of a registry or specific items

---

## Error Handling

- [ ] Disconnect network; submit slip → error state
- [ ] "Try Again" returns to slip upload form
- [ ] Slip file selection is preserved after clicking Try Again

---

## Security

- [ ] No bank credentials, API keys, or PromptPay account details in the frontend HTML/JS
- [ ] SLIP_FOLDER_ID is only in `gift-webhook.gs` (deployed on Google's servers, not in the repo as a secret)
- [ ] Slip Drive folder is private (not shared with anyone except the owner)
