# Backend Setup Guide — Nine & Tom Wedding RSVP

## What you're setting up
- **Google Sheets** stores all RSVP data (you see it live as a spreadsheet)
- **Google Apps Script** is a free serverless backend that handles form submissions, edit links, and confirmation emails — no server or hosting needed

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**
2. Name it: `Nine & Tom Wedding RSVPs`
3. Leave the sheet open — you'll come back to it

---

## Step 2 — Open Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete any placeholder code in the editor
3. Copy the entire contents of `Code.gs` (in this folder) and paste it in
4. Click the **Save** icon (💾)

---

## Step 3 — Update your website URL in the code

Find this line near the bottom of the script:

```javascript
const WEBSITE_URL = 'https://YOUR_WEBSITE_URL';
```

Replace `YOUR_WEBSITE_URL` with wherever you host the website
(e.g. `https://nineandtom2027.com` or `https://yourgithubname.github.io/wedding`).

Click **Save** again.

---

## Step 4 — Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Type" and choose **Web app**
3. Fill in:
   - **Description:** `Wedding RSVP API`
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone` ← important, this allows guests to submit
4. Click **Deploy**
5. Click **Authorize access** and approve the permissions (it needs Sheets + Gmail)
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 5 — Add the URL to your website

Open each of your HTML design files (`design1.html`, `design2.html`, `design3.html`, `edit.html`).

Near the top of the `<script>` section, find:

```javascript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

Replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL you copied in Step 4.

---

## Step 6 — Test it

1. Open your website and submit a test RSVP with your own email
2. Check your email — you should receive a confirmation with an "Edit My RSVP" button
3. Click the edit link — your details should pre-fill
4. Update something and save — check the spreadsheet to confirm it changed

---

## How the edit link works

When a guest submits the RSVP form:
1. Apps Script generates a **UUID token** (e.g. `f3a9c2d1-...`) — this is stored in the spreadsheet alongside their row
2. A confirmation email is sent to the guest with a link like:
   `https://yoursite.com/edit.html?token=f3a9c2d1-...`
3. When the guest opens that link, the page fetches their data using the token and pre-fills the form
4. They can update and re-submit — no password, no login needed

**Security:** UUID v4 tokens have 2¹²² possible values — effectively impossible to guess. It's the same model used by password-reset emails.

---

## Re-deploying after code changes

If you modify `Code.gs`, you must create a **new deployment version**:
1. Click **Deploy → Manage deployments**
2. Click the pencil ✏️ icon on your deployment
3. Change Version to **New version**
4. Click **Deploy**

The Web App URL stays the same.

---

## Viewing your RSVPs

Just open the Google Sheet. The `RSVPs` tab will be created automatically on the first submission with these columns:

| Column | Contents |
|--------|----------|
| A | Submission timestamp |
| B | Edit token (keep this private) |
| C | Guest name |
| D | Email |
| E | Phone |
| F | Session (afternoon / evening / both / none) |
| G | Dietary restrictions |
| H | Plus one (yes/no) |
| I | Plus one name |
| J | Notes |
| K | Blessing message |
| L | Status (active) |
| M | Last updated timestamp |

---

## Hosting the website files

The HTML files are fully static — no backend needed for serving them. Free options:

- **GitHub Pages** — push to a `gh-pages` branch, enable in repo Settings
- **Netlify** — drag and drop the folder at [netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** — connect your GitHub repo at [vercel.com](https://vercel.com)

All three are free and take under 5 minutes.
