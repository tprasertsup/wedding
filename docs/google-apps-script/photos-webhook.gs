// ============================================================
// Nine & Tom Wedding — Photos Webhook (Guest Photo Upload)
//
// Deploy as: Web App > Execute as Me > Anyone can access
// After deploying, paste the Web App URL into photos/index.html:
//   CONFIG.PHOTOS_ENDPOINT = "YOUR_URL_HERE"
//
// MODERATION: New uploads default to "pending".
// Set MODERATION_ENABLED = false to auto-approve uploads.
// Change a row's "status" column to "approved" in the Sheet to
// make photos visible in the shared Drive folder view.
// ============================================================

const PHOTO_FOLDER_ID  = 'PASTE_PHOTO_FOLDER_ID_HERE';
const PHOTO_SHEET_ID   = 'PASTE_PHOTO_SHEET_ID_HERE';
const PHOTO_SHEET_NAME = 'Photos';
const MODERATION_ENABLED = true;

// Tip: PHOTO_SHEET_ID can be the same spreadsheet as RSVP / Moments / Gift.

const PHOTO_HEADERS = [
  'uploaded_at',
  'guest_token',
  'guest_name',
  'caption',
  'drive_file_id',
  'drive_file_url',
  'mime_type',
  'original_file_name',
  'status',
  'user_agent'
];

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
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

    if (!data.imageBase64)  return jsonOut({ error: 'imageBase64 is required.' });
    if (!data.fileName)     return jsonOut({ error: 'fileName is required.' });
    if (!data.mimeType)     return jsonOut({ error: 'mimeType is required.' });

    if (ALLOWED_PHOTO_TYPES.indexOf(data.mimeType) === -1) {
      return jsonOut({ error: 'Unsupported image type: ' + data.mimeType });
    }

    var decoded  = Utilities.base64Decode(data.imageBase64);
    var blob     = Utilities.newBlob(decoded, data.mimeType, data.fileName);

    var folder   = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    var file     = folder.createFile(blob);

    var status   = MODERATION_ENABLED ? 'pending' : 'approved';

    // Only set sharing if moderation is disabled (photos visible immediately)
    if (!MODERATION_ENABLED) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    var fileId   = file.getId();
    var fileUrl  = 'https://drive.google.com/file/d/' + fileId + '/view';

    getPhotoSheet_().appendRow([
      new Date().toISOString(),                         // uploaded_at
      data.guestToken  || '',                           // guest_token
      (data.guestName  || '').toString().trim(),        // guest_name
      (data.caption    || '').toString().trim(),        // caption
      fileId,                                           // drive_file_id
      fileUrl,                                          // drive_file_url
      data.mimeType,                                    // mime_type
      data.fileName,                                    // original_file_name
      status,                                           // status
      data.userAgent   || ''                            // user_agent
    ]);

    return jsonOut({ success: true, fileId: fileId, status: status });

  } catch (err) {
    return jsonOut({ error: 'Server error: ' + err.message });
  }
}

// ── Sheet helper ───────────────────────────────────────────────────

function getPhotoSheet_() {
  var ss    = SpreadsheetApp.openById(PHOTO_SHEET_ID);
  var sheet = ss.getSheetByName(PHOTO_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PHOTO_SHEET_NAME);
    sheet.appendRow(PHOTO_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, PHOTO_HEADERS.length).setFontWeight('bold');
    for (var i = 1; i <= PHOTO_HEADERS.length; i++) sheet.setColumnWidth(i, 160);
    sheet.setColumnWidth(4, 280);   // caption
    sheet.setColumnWidth(6, 300);   // drive_file_url
    sheet.setColumnWidth(10, 280);  // user_agent
  }

  return sheet;
}

// ── Utility ────────────────────────────────────────────────────────

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
