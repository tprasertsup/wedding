// ============================================================
// Nine & Tom Wedding RSVP — Google Apps Script Backend
// Deploy as: Web App > Execute as Me > Anyone can access
// ============================================================

const SHEET_NAME = 'RSVPs';
const RSVP_DEADLINE = new Date('2027-06-01');

// --------------- HTTP Handlers ---------------

function doGet(e) {
  const token = (e.parameter && e.parameter.token) || '';
  if (!token) return jsonOut({ error: 'Token required.' }, 400);
  return getRSVP(token);
}

function doPost(e) {
  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      return jsonOut({ error: 'Invalid JSON body.' });
    }
    if (data.action === 'blessing') return createBlessing(data);
    if (data.action === 'update')  return updateRSVP(data);
    return createRSVP(data);
  } catch (err) {
    return jsonOut({ error: 'Server error: ' + err.message });
  }
}

// --------------- RSVP Operations ---------------

function createRSVP(data) {
  if (!data.name || !data.email || !data.session) {
    return jsonOut({ error: 'Name, email and session are required.' }, 400);
  }

  const email = data.email.trim().toLowerCase();

  if (findRowByEmail(email)) {
    return jsonOut({
      error: 'This email has already been registered. Check your inbox for your personal edit link.',
      alreadyExists: true
    }, 409);
  }

  const sheet = getSheet();
  const token = Utilities.getUuid();
  const now = new Date().toISOString();
  const lang = (data.lang === 'th') ? 'th' : 'en';

  sheet.appendRow([
    now,          // A: created_at
    token,        // B: token
    data.name.trim(),
    email,
    (data.phone || '').trim(),
    (data.preferredName || '').trim(),
    (data.lineId || '').trim(),
    data.session,
    data.dietary || '',
    data.plusone || 'no',
    (data.plusoneName || '').trim(),
    (data.notes || '').trim(),
    (data.blessing || '').trim(),
    'active',     // N: status
    '',           // O: updated_at
    lang          // P: lang
  ]);

  sendEditEmail(email, data.name.trim(), token, lang);
  rebuildGuestLists();

  return jsonOut({ success: true });
}

function updateRSVP(data) {
  if (!data.token) return jsonOut({ error: 'Token required.' }, 400);

  if (new Date() > RSVP_DEADLINE) {
    return jsonOut({ error: 'The RSVP deadline has passed. Please contact Nine & Tom directly.' }, 403);
  }

  const row = findRowByToken(data.token);
  if (!row) return jsonOut({ error: 'Invalid or expired link.' }, 404);

  const sheet = getSheet();
  const r = row.rowIndex;

  if (data.name)       sheet.getRange(r, 3).setValue(data.name.trim());
  if (data.phone !== undefined) sheet.getRange(r, 5).setValue(data.phone.trim());
  if (data.preferredName !== undefined) sheet.getRange(r, 6).setValue(data.preferredName.trim());
  if (data.lineId !== undefined) sheet.getRange(r, 7).setValue(data.lineId.trim());
  if (data.session)    sheet.getRange(r, 8).setValue(data.session);
  if (data.dietary !== undefined) sheet.getRange(r, 9).setValue(data.dietary);
  if (data.plusone)    sheet.getRange(r, 10).setValue(data.plusone);
  if (data.plusoneName !== undefined) sheet.getRange(r, 11).setValue(data.plusoneName.trim());
  if (data.notes !== undefined) sheet.getRange(r, 12).setValue(data.notes.trim());
  if (data.blessing !== undefined) sheet.getRange(r, 13).setValue(data.blessing.trim());
  sheet.getRange(r, 15).setValue(new Date().toISOString());

  rebuildGuestLists();
  return jsonOut({ success: true });
}

function getRSVP(token) {
  const row = findRowByToken(token);
  if (!row) return jsonOut({ error: 'Invalid or expired link.' }, 404);

  const d = row.data;
  return jsonOut({
    name:        d[2],
    email:       d[3],
    phone:       d[4],
    preferredName:d[5],
    lineId:      d[6],
    session:     d[7],
    dietary:     d[8],
    plusone:     d[9],
    plusoneName: d[10],
    notes:       d[11],
    blessing:    d[12]
  });
}

// --------------- Sheet Helpers ---------------

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'created_at', 'token', 'name', 'email', 'phone',
      'preferred_name', 'line_id', 'session', 'dietary', 'plusone', 'plusone_name',
      'notes', 'blessing', 'status', 'updated_at', 'lang'
    ]);
    sheet.setFrozenRows(1);

    sheet.getRange(1, 1, 1, 16).setFontWeight('bold');
    sheet.setColumnWidths(1, 16, 160);
    sheet.getRange(1, 2, 1, 1).setColumnWidth(280);
  }

  return sheet;
}

function findRowByToken(token) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === token && data[i][13] === 'active') {
      return { rowIndex: i + 1, data: data[i] };
    }
  }
  return null;
}

function findRowByEmail(email) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === email && data[i][13] === 'active') {
      return { rowIndex: i + 1, data: data[i] };
    }
  }
  return null;
}

// --------------- Email ---------------

function sendEditEmail(email, name, token, lang) {
  // Update WEBSITE_URL before deploying
  const WEBSITE_URL = 'https://tprasertsup.github.io/wedding';
  const editUrl = `${WEBSITE_URL}/edit.html?token=${token}`;

  const isThai = (lang === 'th');

  const subject = isThai
    ? 'ยืนยันการเข้าร่วมงานแต่งงานไนน์ & ทอม ✨'
    : "Your RSVP for Nine & Tom's Wedding ✨";

  const html = isThai ? `
  <div style="font-family:'Sarabun',sans-serif;max-width:580px;margin:0 auto;background:#faf3ec;padding:0;border:1px solid #d4b896;">
    <div style="background:#f5e6d8;padding:40px 40px 30px;text-align:center;border-bottom:1px solid #d4b896;">
      <div style="font-size:36px;color:#c9a96e;margin-bottom:8px;">囍</div>
      <h1 style="font-size:28px;color:#5c3d2e;margin:0;font-weight:400;letter-spacing:1px;">ไนน์ &amp; ทอม</h1>
      <p style="color:#8a6552;font-size:13px;letter-spacing:2px;margin:6px 0 0;">11 กรกฎาคม 2570</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#5c3d2e;font-size:16px;">เรียน คุณ${name},</p>
      <p style="color:#6b4c3b;line-height:1.9;">ขอบคุณมากนะคะที่ยืนยันการเข้าร่วม — ดีใจมากที่จะได้เจอกัน!</p>
      <p style="color:#6b4c3b;line-height:1.9;">ใช้ลิงก์ด้านล่างเพื่อดูหรือแก้ไขข้อมูลได้ตลอดเวลา กรุณาเก็บอีเมลนี้ไว้ด้วยนะคะ</p>
      <div style="text-align:center;margin:35px 0;">
        <a href="${editUrl}"
           style="display:inline-block;background:#8b6914;color:#fff;padding:14px 36px;
                  text-decoration:none;font-size:12px;letter-spacing:2px;
                  text-transform:uppercase;font-family:Arial,sans-serif;">
          ดูหรือแก้ไข RSVP
        </a>
      </div>
      <p style="color:#8a6552;font-size:12px;line-height:1.8;text-align:center;">
        กรุณาตอบรับภายใน <strong>1 มิถุนายน 2570</strong><br>
        หากมีข้อสงสัย สามารถติดต่อไนน์หรือทอมได้โดยตรง
      </p>
      <hr style="border:none;border-top:1px solid #d4b896;margin:30px 0;">
      <p style="color:#5c3d2e;font-size:14px;font-style:italic;text-align:center;">
        ฉลองรักและบทใหม่ของชีวิต
      </p>
    </div>
  </div>` : `
  <div style="font-family:'Georgia',serif;max-width:580px;margin:0 auto;background:#faf3ec;padding:0;border:1px solid #d4b896;">
    <div style="background:#f5e6d8;padding:40px 40px 30px;text-align:center;border-bottom:1px solid #d4b896;">
      <div style="font-size:36px;color:#c9a96e;margin-bottom:8px;">囍</div>
      <h1 style="font-size:28px;color:#5c3d2e;margin:0;font-weight:400;letter-spacing:1px;">Nine &amp; Tom</h1>
      <p style="color:#8a6552;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:6px 0 0;">July 11, 2027</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#5c3d2e;font-size:16px;">Dear ${name},</p>
      <p style="color:#6b4c3b;line-height:1.8;">Thank you for your RSVP — we're so glad you'll be part of our special day!</p>
      <p style="color:#6b4c3b;line-height:1.8;">Use the link below any time to update your details. Keep this email safe as it's your personal access link.</p>
      <div style="text-align:center;margin:35px 0;">
        <a href="${editUrl}"
           style="display:inline-block;background:#8b6914;color:#fff;padding:14px 36px;
                  text-decoration:none;font-size:12px;letter-spacing:3px;
                  text-transform:uppercase;font-family:Arial,sans-serif;">
          View / Edit My RSVP
        </a>
      </div>
      <p style="color:#8a6552;font-size:12px;line-height:1.7;text-align:center;">
        Please update by <strong>June 1, 2027</strong>.<br>
        If you have any questions, reach out to Nine or Tom directly.
      </p>
      <hr style="border:none;border-top:1px solid #d4b896;margin:30px 0;">
      <p style="color:#5c3d2e;font-size:14px;font-style:italic;text-align:center;">
        Celebrating love, family, and a beautiful new beginning
      </p>
    </div>
  </div>`;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: html,
    noReply: true
  });
}

// --------------- Blessing Wall ---------------

function createBlessing(data) {
  if (!data.name || !data.message) {
    return jsonOut({ error: 'Name and message are required.' }, 400);
  }

  const sheet = getBlessingSheet();
  sheet.appendRow([
    new Date().toISOString(),
    data.name.trim(),
    (data.relationship || '').trim(),
    data.message.trim()
  ]);

  return jsonOut({ success: true });
}

function getBlessingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Blessings');

  if (!sheet) {
    sheet = ss.insertSheet('Blessings');
    sheet.appendRow(['timestamp', 'name', 'relationship', 'message']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    sheet.setColumnWidths(1, 4, 220);
    sheet.getRange(1, 4, 1, 1).setColumnWidth(400);
  }

  return sheet;
}


function rebuildGuestLists() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  const afternoon = ensureListSheet_(ss, 'GuestList_Afternoon', ['name', 'preferred_name', 'phone', 'line_id', 'source']);
  const evening = ensureListSheet_(ss, 'GuestList_Evening', ['name', 'preferred_name', 'phone', 'line_id', 'dietary', 'source']);
  clearListSheet_(afternoon);
  clearListSheet_(evening);

  const afternoonRows = [];
  const eveningRows = [];

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (r[13] !== 'active') continue;
    const guest = [r[2], r[5], r[4], r[6]];
    const session = r[7];
    const dietary = r[8] || '';
    const hasPlus = r[9] === 'yes' && r[10];

    if (session === 'afternoon' || session === 'both') afternoonRows.push([...guest, 'primary']);
    if (session === 'evening' || session === 'both') eveningRows.push([...guest, dietary, 'primary']);

    if (hasPlus) {
      const plus = [r[10], '', '', ''];
      if (session === 'afternoon' || session === 'both') afternoonRows.push([...plus, 'plus_one']);
      if (session === 'evening' || session === 'both') eveningRows.push([...plus, dietary, 'plus_one']);
    }
  }

  writeListRows_(afternoon, afternoonRows);
  writeListRows_(evening, eveningRows);
}

function ensureListSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  sh.appendRow(headers);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sh;
}

function clearListSheet_(sheet) {
  const last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).clearContent();
}

function writeListRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

// --------------- Utility ---------------

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
