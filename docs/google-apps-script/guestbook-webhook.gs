// ============================================================
// Nine & Tom Wedding — Moments Webhook (Voice Guestbook)
//
// Deploy as: Web App > Execute as Me > Anyone can access
// After deploying, paste the Web App URL into moments/index.html:
//   const CONFIG = { MOMENTS_ENDPOINT: "YOUR_URL_HERE" }
// ============================================================

const MOMENTS_DRIVE_FOLDER_ID = 'PASTE_MOMENTS_FOLDER_ID_HERE';
const MOMENTS_SHEET_ID        = 'PASTE_MOMENTS_SHEET_ID_HERE';
const MOMENTS_SHEET_NAME      = 'Moments';

// Tip: MOMENTS_SHEET_ID can be the same sheet used by the RSVP webhook.
// Just paste that sheet's ID here — this script will add a "Moments" tab.

const MOMENTS_HEADERS = [
  'submitted_at',
  'type',
  'guest_token',
  'guest_name',
  'message_text',
  'drive_file_id',
  'drive_file_url',
  'duration_seconds',
  'mime_type',
  'user_agent'
];

// ── Entry point ────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      return jsonOut({ error: 'Invalid JSON body.' });
    }

    var type = (data.type || '').toLowerCase();

    if (type !== 'voice' && type !== 'text') {
      return jsonOut({ error: 'Invalid type. Must be "voice" or "text".' });
    }

    if (type === 'voice') return handleVoice_(data);
    return handleText_(data);

  } catch (err) {
    return jsonOut({ error: 'Server error: ' + err.message });
  }
}

// ── Voice handler ──────────────────────────────────────────────────

function handleVoice_(data) {
  if (!data.audioBase64) return jsonOut({ error: 'audioBase64 is required.' });
  if (!data.fileName)    return jsonOut({ error: 'fileName is required.' });

  var decoded  = Utilities.base64Decode(data.audioBase64);
  var mimeType = data.mimeType || 'audio/webm';
  var blob     = Utilities.newBlob(decoded, mimeType, data.fileName);

  var folder = DriveApp.getFolderById(MOMENTS_DRIVE_FOLDER_ID);
  var file   = folder.createFile(blob);

  // Allow anyone with the link to play back the audio (view-only, not editable)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId  = file.getId();
  var fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view';

  appendMomentsRow_([
    new Date().toISOString(),
    'voice',
    data.guestToken      || '',
    (data.guestName      || '').toString().trim(),
    '',                                          // message_text (n/a for voice)
    fileId,
    fileUrl,
    data.durationSeconds || '',
    mimeType,
    data.userAgent       || ''
  ]);

  return jsonOut({ success: true, fileId: fileId, fileUrl: fileUrl });
}

// ── Text handler ───────────────────────────────────────────────────

function handleText_(data) {
  var message = ((data.messageText || '').toString()).trim();
  if (!message) return jsonOut({ error: 'messageText is required.' });

  appendMomentsRow_([
    new Date().toISOString(),
    'text',
    data.guestToken || '',
    (data.guestName || '').toString().trim(),
    message,
    '',   // drive_file_id
    '',   // drive_file_url
    '',   // duration_seconds
    '',   // mime_type
    data.userAgent || ''
  ]);

  return jsonOut({ success: true });
}

// ── Sheet helpers ──────────────────────────────────────────────────

function getMomentsSheet_() {
  var ss    = SpreadsheetApp.openById(MOMENTS_SHEET_ID);
  var sheet = ss.getSheetByName(MOMENTS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(MOMENTS_SHEET_NAME);
    sheet.appendRow(MOMENTS_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, MOMENTS_HEADERS.length).setFontWeight('bold');

    // Set reasonable column widths
    for (var i = 1; i <= MOMENTS_HEADERS.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
    sheet.setColumnWidth(5, 400);  // message_text
    sheet.setColumnWidth(7, 300);  // drive_file_url
    sheet.setColumnWidth(10, 300); // user_agent
  }

  return sheet;
}

function appendMomentsRow_(values) {
  getMomentsSheet_().appendRow(values);
}

// ── Utility ────────────────────────────────────────────────────────

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
