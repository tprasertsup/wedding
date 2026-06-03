const crypto = require('crypto');

const extensionByMime = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif'
};

function slugify(value, fallback = 'guest') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || fallback;
}

function safeExtension(originalFileName = '', mimeType = '') {
  const match = String(originalFileName).toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  const original = match ? match[1] : '';
  if (original && /^[a-z0-9]+$/.test(original)) return original;
  return extensionByMime[String(mimeType).toLowerCase()] || 'bin';
}

function timestampForName(date = new Date()) {
  return date.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

function randomId(size = 4) {
  return crypto.randomBytes(size).toString('hex');
}

function makeStoredFileName({ mediaType, createdAt, guestName, originalFileName, mimeType, photoIndex }) {
  const ext = safeExtension(originalFileName, mimeType);
  const guest = slugify(guestName, 'guest');
  const prefix = mediaType === 'photo' ? 'photo' : 'video';
  const indexPart = mediaType === 'photo' ? '-' + String(photoIndex || 1).padStart(2, '0') : '';
  return `${prefix}-${timestampForName(new Date(createdAt))}-${guest}-${randomId()}${indexPart}.${ext}`;
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function boolString(value) {
  return value === true || value === 'true' || value === 'TRUE' ? 'TRUE' : 'FALSE';
}

module.exports = {
  boolString,
  csvEscape,
  makeStoredFileName,
  safeExtension,
  slugify,
  timestampForName
};

