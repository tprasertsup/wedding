function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function numberEnv(name, fallback) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid numeric env var: ${name}`);
  return value;
}

function normalizePrivateKey(value) {
  return value.replace(/\\n/g, '\n');
}

const config = {
  port: numberEnv('PORT', 8080),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  googleClientEmail: required('GOOGLE_CLIENT_EMAIL'),
  googlePrivateKey: normalizePrivateKey(required('GOOGLE_PRIVATE_KEY')),
  driveVideosFolderId: required('GOOGLE_DRIVE_VIDEOS_FOLDER_ID'),
  drivePhotosFolderId: required('GOOGLE_DRIVE_PHOTOS_FOLDER_ID'),
  sheetsSpreadsheetId: required('GOOGLE_SHEETS_SPREADSHEET_ID'),
  sheetsTabName: process.env.GOOGLE_SHEETS_TAB_NAME || 'submissions',
  uploadEventToken: required('UPLOAD_EVENT_TOKEN'),
  adminPasswordHash: required('ADMIN_PASSWORD_HASH'),
  adminJwtSecret: required('ADMIN_JWT_SECRET'),
  maxVideoDurationSeconds: numberEnv('MAX_VIDEO_DURATION_SECONDS', 60),
  maxVideoSizeBytes: numberEnv('MAX_VIDEO_SIZE_MB', 250) * 1024 * 1024,
  maxPhotoSizeBytes: numberEnv('MAX_PHOTO_SIZE_MB', 25) * 1024 * 1024,
  maxPhotosPerBatch: numberEnv('MAX_PHOTOS_PER_BATCH', 20)
};

if (!config.allowedOrigins.length) {
  throw new Error('ALLOWED_ORIGINS must include the GitHub Pages origin and any local dev origins.');
}

module.exports = { config, normalizePrivateKey };

