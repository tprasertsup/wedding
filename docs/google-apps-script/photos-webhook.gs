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
const MAX_PHOTO_MB = 15;
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;

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
  'image/heif',
  'image/avif'
];

const PHOTO_TYPE_ALIASES = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
  'image/heic-sequence': 'image/heic',
  'image/heif-sequence': 'image/heif'
};

const PHOTO_TYPE_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif'
};

const PHOTO_EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif'
};

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
    var mimeType = normalizePhotoType_(data.mimeType, data.fileName);
    if (!mimeType) {
      return jsonOut({ error: 'Unsupported image type: ' + (data.mimeType || guessPhotoTypeFromName_(data.fileName) || 'unknown') });
    }

    var decoded;
    try {
      decoded = Utilities.base64Decode(data.imageBase64);
    } catch (_) {
      return jsonOut({ error: 'Invalid imageBase64.' });
    }

    if (decoded.length > MAX_PHOTO_BYTES) {
      return jsonOut({ error: 'Photo is too large. Max ' + MAX_PHOTO_MB + ' MB.' });
    }

    var fileName = normalizePhotoFileName_(data.fileName, mimeType);
    var blob     = Utilities.newBlob(decoded, mimeType, fileName);

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
      mimeType,                                         // mime_type
      fileName,                                         // original_file_name
      status,                                           // status
      data.userAgent   || ''                            // user_agent
    ]);

    return jsonOut({ success: true, fileId: fileId, status: status });

  } catch (err) {
    return jsonOut({ error: 'Server error: ' + err.message });
  }
}

// ── Photo type helpers ──────────────────────────────────────────────

function normalizePhotoType_(mimeType, fileName) {
  var type = (mimeType || '').toString().toLowerCase().split(';')[0].trim();
  type = PHOTO_TYPE_ALIASES[type] || type;

  if (!type || type === 'application/octet-stream' || type === 'binary/octet-stream') {
    type = guessPhotoTypeFromName_(fileName);
  }

  return ALLOWED_PHOTO_TYPES.indexOf(type) !== -1 ? type : '';
}

function guessPhotoTypeFromName_(fileName) {
  var ext = getPhotoExtension_(fileName);
  return PHOTO_TYPE_BY_EXTENSION[ext] || '';
}

function normalizePhotoFileName_(fileName, mimeType) {
  var safeName = (fileName || 'wedding-photo')
    .toString()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim();

  var expectedExt = PHOTO_EXTENSION_BY_TYPE[mimeType] || 'jpg';
  var currentExt = getPhotoExtension_(safeName);

  if (PHOTO_TYPE_BY_EXTENSION[currentExt] === mimeType) {
    return safeName || ('wedding-photo.' + expectedExt);
  }

  var dot = safeName.lastIndexOf('.');
  var base = dot > 0 ? safeName.slice(0, dot) : safeName;
  return (base || 'wedding-photo') + '.' + expectedExt;
}

function getPhotoExtension_(fileName) {
  var match = (fileName || '').toString().toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
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
