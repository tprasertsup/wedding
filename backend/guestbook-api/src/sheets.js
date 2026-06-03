const { config } = require('./config');
const { sheets } = require('./google');
const { boolString, csvEscape } = require('./helpers');
const { cleanText } = require('./validators');
const { httpError } = require('./errors');

const HEADERS = [
  'id',
  'submissionId',
  'createdAt',
  'guestName',
  'relationship',
  'language',
  'mediaType',
  'prompt',
  'caption',
  'originalFileName',
  'storedFileName',
  'driveFileId',
  'driveFolderId',
  'driveUrl',
  'mimeType',
  'fileSizeBytes',
  'durationSeconds',
  'deviceType',
  'userAgent',
  'status',
  'isFavorite',
  'isReviewed',
  'notes'
];

function sheetName() {
  return `'${config.sheetsTabName.replace(/'/g, "''")}'`;
}

function range(a1) {
  return `${sheetName()}!${a1}`;
}

async function ensureHeaders() {
  const api = sheets();
  await ensureSheetExists();
  const response = await api.spreadsheets.values.get({
    spreadsheetId: config.sheetsSpreadsheetId,
    range: range(`A1:${columnLetter(HEADERS.length)}1`)
  });
  const existing = response.data.values && response.data.values[0] ? response.data.values[0] : [];
  if (HEADERS.some((header, index) => existing[index] !== header)) {
    await api.spreadsheets.values.update({
      spreadsheetId: config.sheetsSpreadsheetId,
      range: range(`A1:${columnLetter(HEADERS.length)}1`),
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] }
    });
  }
}

async function ensureSheetExists() {
  const api = sheets();
  const response = await api.spreadsheets.get({
    spreadsheetId: config.sheetsSpreadsheetId,
    fields: 'sheets.properties.title'
  });
  const exists = (response.data.sheets || []).some((sheet) => sheet.properties.title === config.sheetsTabName);
  if (exists) return;
  await api.spreadsheets.batchUpdate({
    spreadsheetId: config.sheetsSpreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: { title: config.sheetsTabName }
          }
        }
      ]
    }
  });
}

function columnLetter(index) {
  let value = index;
  let letters = '';
  while (value > 0) {
    const mod = (value - 1) % 26;
    letters = String.fromCharCode(65 + mod) + letters;
    value = Math.floor((value - mod) / 26);
  }
  return letters;
}

function rowToObject(row, rowNumber) {
  const padded = HEADERS.map((_, index) => row[index] || '');
  const item = Object.fromEntries(HEADERS.map((header, index) => [header, padded[index]]));
  item.rowNumber = rowNumber;
  item.isFavorite = item.isFavorite === true || item.isFavorite === 'TRUE';
  item.isReviewed = item.isReviewed === true || item.isReviewed === 'TRUE';
  item.fileSizeBytes = Number(item.fileSizeBytes || 0);
  item.durationSeconds = Number(item.durationSeconds || 0);
  return item;
}

async function readRows() {
  await ensureHeaders();
  const response = await sheets().spreadsheets.values.get({
    spreadsheetId: config.sheetsSpreadsheetId,
    range: range(`A:${columnLetter(HEADERS.length)}`)
  });
  return response.data.values || [HEADERS];
}

async function readSubmissions() {
  const rows = await readRows();
  return rows
    .slice(1)
    .map((row, index) => rowToObject(row, index + 2))
    .filter((item) => item.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

async function findSubmissionById(id) {
  const rows = await readRows();
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i][0] === id) return rowToObject(rows[i], i + 1);
  }
  return null;
}

async function appendSubmission(item) {
  await ensureHeaders();
  const values = [HEADERS.map((header) => item[header] ?? '')];
  await sheets().spreadsheets.values.append({
    spreadsheetId: config.sheetsSpreadsheetId,
    range: range(`A:${columnLetter(HEADERS.length)}`),
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });
}

async function updateSubmission(body) {
  const id = cleanText(body.id, 120);
  if (!id) throw httpError(400, 'Submission id is required.');
  const existing = await findSubmissionById(id);
  if (!existing) throw httpError(404, 'Submission not found.');

  const nextStatus = body.status ? cleanText(body.status, 40) : existing.status;
  const nextFavorite = body.isFavorite === undefined ? existing.isFavorite : body.isFavorite;
  const nextReviewed = body.isReviewed === undefined ? existing.isReviewed : body.isReviewed;
  const nextNotes = body.notes === undefined ? existing.notes : cleanText(body.notes, 2000);

  await sheets().spreadsheets.values.batchUpdate({
    spreadsheetId: config.sheetsSpreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: range(`T${existing.rowNumber}`), values: [[nextStatus]] },
        { range: range(`U${existing.rowNumber}`), values: [[boolString(nextFavorite)]] },
        { range: range(`V${existing.rowNumber}`), values: [[boolString(nextReviewed)]] },
        { range: range(`W${existing.rowNumber}`), values: [[nextNotes]] }
      ]
    }
  });

  return {
    ...existing,
    status: nextStatus,
    isFavorite: boolString(nextFavorite) === 'TRUE',
    isReviewed: boolString(nextReviewed) === 'TRUE',
    notes: nextNotes
  };
}

async function exportSubmissionsCsv() {
  const rows = await readRows();
  return rows.map((row) => HEADERS.map((_, index) => csvEscape(row[index] || '')).join(',')).join('\n') + '\n';
}

module.exports = {
  HEADERS,
  appendSubmission,
  exportSubmissionsCsv,
  findSubmissionById,
  readSubmissions,
  updateSubmission
};
