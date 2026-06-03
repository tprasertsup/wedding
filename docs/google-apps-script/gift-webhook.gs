// ============================================================
// Nine & Tom Wedding — Gift Webhook (PromptPay Slip Upload)
//
// Deploy as: Web App > Execute as Me > Anyone can access
// After deploying, paste the Web App URL into gift/index.html:
//   CONFIG.GIFT_ENDPOINT = "YOUR_URL_HERE"
//
// NOTE: This webhook handles PromptPay slip uploads only.
// Venmo gifts are confirmed through Venmo's own platform
// and do not require a slip upload.
// ============================================================

const GIFT_SHEET_ID   = 'PASTE_GIFT_SHEET_ID_HERE';
const GIFT_SHEET_NAME = 'Gift';
const SLIP_FOLDER_ID  = 'PASTE_SLIP_FOLDER_ID_HERE';

// Tip: GIFT_SHEET_ID can be the same spreadsheet used by the RSVP
// and Moments webhooks — this script will create a "Gift" tab.

const GIFT_HEADERS = [
  'submitted_at',
  'guest_token',
  'guest_name',
  'amount_thb_optional',
  'note',
  'source',
  'status',
  'slip_file_id',
  'slip_file_url',
  'extracted_sender_name',
  'extracted_amount_thb',
  'extracted_paid_at',
  'verification_status',
  'confirmation_source',
  'manual_review_note',
  'user_agent'
];

const ALLOWED_SLIP_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
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

    // Require slip fields
    if (!data.slipBase64)    return jsonOut({ error: 'slipBase64 is required.' });
    if (!data.slipFileName)  return jsonOut({ error: 'slipFileName is required.' });
    if (!data.slipMimeType)  return jsonOut({ error: 'slipMimeType is required.' });

    if (ALLOWED_SLIP_TYPES.indexOf(data.slipMimeType) === -1) {
      return jsonOut({ error: 'Unsupported slip file type: ' + data.slipMimeType });
    }

    var decoded = Utilities.base64Decode(data.slipBase64);
    var blob    = Utilities.newBlob(decoded, data.slipMimeType, data.slipFileName);

    var folder  = DriveApp.getFolderById(SLIP_FOLDER_ID);
    var file    = folder.createFile(blob);

    // Keep slip private — only the sheet owner can access via Drive link
    // Do NOT call setSharing here; the folder should be private by default

    var fileId  = file.getId();
    var fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view';

    // Attempt future slip verification (placeholder)
    var verification = verifySlipWithProvider_(fileUrl);

    var amountThb = (data.amountThb !== undefined && data.amountThb !== null && data.amountThb !== '')
      ? parseFloat(data.amountThb) : '';

    getGiftSheet_().appendRow([
      new Date().toISOString(),                        // submitted_at
      data.guestToken             || '',               // guest_token
      (data.guestName             || '').toString().trim(), // guest_name
      amountThb,                                       // amount_thb_optional
      (data.note                  || '').toString().trim(), // note
      data.source                 || 'static_promptpay', // source
      data.status                 || 'slip_uploaded',  // status
      fileId,                                          // slip_file_id
      fileUrl,                                         // slip_file_url
      verification.extractedSenderName  || '',         // extracted_sender_name
      verification.extractedAmountThb   || '',         // extracted_amount_thb
      verification.extractedPaidAt      || '',         // extracted_paid_at
      verification.verificationStatus   || 'not_configured', // verification_status
      '',                                              // confirmation_source
      '',                                              // manual_review_note
      data.userAgent              || ''                // user_agent
    ]);

    return jsonOut({ success: true, fileId: fileId, fileUrl: fileUrl });

  } catch (err) {
    return jsonOut({ error: 'Server error: ' + err.message });
  }
}

// ── Future slip verification integration ──────────────────────────
// Replace the body of this function when integrating a Thai slip
// verification API (e.g. Promptpay confirm services).

function verifySlipWithProvider_(slipFileUrl) {
  // Future integration point for Thai slip verification API.
  // Should return extracted sender name, amount, paid time, and verification status.
  return {
    extractedSenderName:  '',
    extractedAmountThb:   '',
    extractedPaidAt:      '',
    verificationStatus:   'not_configured'
  };
}

// ── Sheet helpers ──────────────────────────────────────────────────

function getGiftSheet_() {
  var ss    = SpreadsheetApp.openById(GIFT_SHEET_ID);
  var sheet = ss.getSheetByName(GIFT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(GIFT_SHEET_NAME);
    sheet.appendRow(GIFT_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, GIFT_HEADERS.length).setFontWeight('bold');
    for (var i = 1; i <= GIFT_HEADERS.length; i++) sheet.setColumnWidth(i, 160);
    sheet.setColumnWidth(5, 280);   // note
    sheet.setColumnWidth(9, 300);   // slip_file_url
    sheet.setColumnWidth(16, 280);  // user_agent
  }

  return sheet;
}

// ── Utility ────────────────────────────────────────────────────────

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
