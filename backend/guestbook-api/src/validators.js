const { config } = require('./config');
const { httpError } = require('./errors');

const imageExtensions = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

function assertEventToken(token) {
  if (!token || token !== config.uploadEventToken) throw httpError(403, 'Invalid guestbook token.');
}

function cleanText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function validateUploadInit(body) {
  assertEventToken(body.eventToken);
  const mediaType = body.mediaType === 'photo' ? 'photo' : body.mediaType === 'video' ? 'video' : '';
  if (!mediaType) throw httpError(400, 'Invalid media type.');

  const fileSizeBytes = Number(body.fileSizeBytes);
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) throw httpError(400, 'Invalid file size.');

  const originalFileName = cleanText(body.originalFileName, 180) || (mediaType === 'video' ? 'video.webm' : 'photo.jpg');
  const mimeType = cleanText(body.mimeType, 100) || 'application/octet-stream';

  if (mediaType === 'video') {
    if (!mimeType.startsWith('video/')) throw httpError(400, 'Expected a video file.');
    if (fileSizeBytes > config.maxVideoSizeBytes) throw httpError(413, 'Video file is too large.');
    const durationSeconds = Number(body.durationSeconds || 0);
    if (durationSeconds && durationSeconds > config.maxVideoDurationSeconds + 2) {
      throw httpError(400, 'Video is longer than the configured limit.');
    }
  } else {
    const looksLikeImage = mimeType.startsWith('image/') || imageExtensions.test(originalFileName);
    if (!looksLikeImage) throw httpError(400, 'Expected an image file.');
    if (fileSizeBytes > config.maxPhotoSizeBytes) throw httpError(413, 'Photo file is too large.');
    const photoIndex = Number(body.photoIndex || 1);
    if (photoIndex > config.maxPhotosPerBatch) throw httpError(400, 'Too many photos in one upload batch.');
  }

  return {
    mediaType,
    originalFileName,
    mimeType,
    fileSizeBytes,
    durationSeconds: mediaType === 'video' ? Number(body.durationSeconds || 0) : '',
    guestName: cleanText(body.guestName, 160),
    relationship: cleanText(body.relationship, 180),
    language: body.language === 'th' ? 'th' : 'en',
    prompt: cleanText(body.prompt, 500),
    caption: cleanText(body.caption, 1000),
    deviceType: ['mobile', 'tablet', 'desktop', 'unknown'].includes(body.deviceType) ? body.deviceType : 'unknown',
    userAgent: cleanText(body.userAgent, 700),
    submissionId: cleanText(body.submissionId, 80),
    photoIndex: Number(body.photoIndex || 1)
  };
}

module.exports = { cleanText, validateUploadInit };
