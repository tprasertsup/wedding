const test = require('node:test');
const assert = require('node:assert/strict');

process.env.ALLOWED_ORIGINS = 'https://tprasertsup.github.io';
process.env.GOOGLE_CLIENT_EMAIL = 'service@example.iam.gserviceaccount.com';
process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n';
process.env.GOOGLE_DRIVE_VIDEOS_FOLDER_ID = 'videos';
process.env.GOOGLE_DRIVE_PHOTOS_FOLDER_ID = 'photos';
process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'sheet';
process.env.UPLOAD_EVENT_TOKEN = 'event-token';
process.env.ADMIN_PASSWORD_HASH = '$2a$12$123456789012345678901uM9DPr1wdtZ9Z7KmGXIHc2tW8WkNm11i';
process.env.ADMIN_JWT_SECRET = 'secret';

const { boolString, makeStoredFileName, safeExtension, slugify } = require('../src/helpers');
const { validateUploadInit } = require('../src/validators');

test('slugify produces safe lowercase slugs', () => {
  assert.equal(slugify('Nine and Tom!!'), 'nine-and-tom');
  assert.equal(slugify(''), 'guest');
});

test('safeExtension prefers original extension and falls back to MIME type', () => {
  assert.equal(safeExtension('IMG_001.HEIC', ''), 'heic');
  assert.equal(safeExtension('', 'image/jpeg'), 'jpg');
  assert.equal(safeExtension('', 'video/webm'), 'webm');
});

test('makeStoredFileName includes media type, slug, random id, and index', () => {
  const fileName = makeStoredFileName({
    mediaType: 'photo',
    createdAt: '2027-07-11T20:18:02.000Z',
    guestName: 'Pham Family',
    originalFileName: 'table.JPG',
    mimeType: 'image/jpeg',
    photoIndex: 3
  });
  assert.match(fileName, /^photo-2027-07-11T20-18-02Z-pham-family-[a-f0-9]{8}-03\.jpg$/);
});

test('validateUploadInit rejects missing event token', () => {
  assert.throws(() => validateUploadInit({ mediaType: 'video' }), /Invalid guestbook token/);
});

test('validateUploadInit accepts HEIC photos by extension', () => {
  const clean = validateUploadInit({
    eventToken: 'event-token',
    mediaType: 'photo',
    originalFileName: 'guest.heic',
    mimeType: 'application/octet-stream',
    fileSizeBytes: 2000
  });
  assert.equal(clean.mediaType, 'photo');
});

test('validateUploadInit enforces video size and MIME type', () => {
  assert.throws(() => validateUploadInit({
    eventToken: 'event-token',
    mediaType: 'video',
    originalFileName: 'video.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 2000
  }), /Expected a video file/);
});

test('boolString normalizes favorite and reviewed values', () => {
  assert.equal(boolString(true), 'TRUE');
  assert.equal(boolString('TRUE'), 'TRUE');
  assert.equal(boolString(false), 'FALSE');
});

