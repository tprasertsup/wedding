const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { config } = require('./config');
const { drive, bearerToken } = require('./google');
const { makeStoredFileName } = require('./helpers');
const { appendSubmission, findSubmissionById } = require('./sheets');
const { validateUploadInit } = require('./validators');
const { httpError } = require('./errors');

function mediaFolder(mediaType) {
  return mediaType === 'photo' ? config.drivePhotosFolderId : config.driveVideosFolderId;
}

function signUploadClaim(payload) {
  return jwt.sign(payload, config.adminJwtSecret, {
    algorithm: 'HS256',
    expiresIn: '2h'
  });
}

function verifyUploadClaim(token) {
  try {
    return jwt.verify(token, config.adminJwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    throw httpError(401, 'Upload session expired. Please retry the upload.');
  }
}

async function createResumableSession({ storedFileName, mimeType, fileSizeBytes, folderId }) {
  const token = await bearerToken();
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(fileSizeBytes)
    },
    body: JSON.stringify({
      name: storedFileName,
      mimeType,
      parents: [folderId]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Drive resumable session failed:', detail);
    throw httpError(502, 'Could not start Google Drive upload.');
  }

  const uploadUrl = response.headers.get('location');
  if (!uploadUrl) throw httpError(502, 'Google Drive did not return an upload session.');
  return uploadUrl;
}

async function initUpload(body) {
  const clean = validateUploadInit(body);
  if (clean.mediaType === 'video' && !clean.guestName) throw httpError(400, 'Guest name is required for video.');
  const createdAt = new Date().toISOString();
  const mediaId = crypto.randomUUID();
  const submissionId = clean.submissionId || crypto.randomUUID();
  const folderId = mediaFolder(clean.mediaType);
  const storedFileName = makeStoredFileName({
    mediaType: clean.mediaType,
    createdAt,
    guestName: clean.guestName,
    originalFileName: clean.originalFileName,
    mimeType: clean.mimeType,
    photoIndex: clean.photoIndex
  });
  const uploadUrl = await createResumableSession({
    storedFileName,
    mimeType: clean.mimeType,
    fileSizeBytes: clean.fileSizeBytes,
    folderId
  });
  const claim = {
    ...clean,
    id: mediaId,
    submissionId,
    createdAt,
    storedFileName,
    driveFolderId: folderId
  };
  return {
    success: true,
    mediaId,
    submissionId,
    storedFileName,
    uploadUrl,
    uploadClaim: signUploadClaim(claim)
  };
}

async function completeUpload(body) {
  if (!body.uploadClaim) throw httpError(400, 'Upload claim is required.');
  const claim = verifyUploadClaim(body.uploadClaim);
  const driveFileId = String(body.driveFileId || '').trim();
  if (!driveFileId) throw httpError(400, 'Drive file id is required.');

  const existing = await findSubmissionById(claim.id);
  if (existing) return { success: true, mediaId: claim.id, submissionId: claim.submissionId, driveFileId };

  const file = await drive().files.get({
    fileId: driveFileId,
    fields: 'id,name,mimeType,size,webViewLink,webContentLink,parents',
    supportsAllDrives: true
  });

  const data = file.data;
  if (data.name !== claim.storedFileName) throw httpError(400, 'Uploaded file name did not match the upload session.');
  if (!Array.isArray(data.parents) || !data.parents.includes(claim.driveFolderId)) {
    throw httpError(400, 'Uploaded file was not stored in the expected Drive folder.');
  }
  const actualSize = Number(data.size || 0);
  if (actualSize && actualSize > Number(claim.fileSizeBytes) + 1024) {
    throw httpError(400, 'Uploaded file size did not match the upload session.');
  }

  const driveUrl = data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
  await appendSubmission({
    id: claim.id,
    submissionId: claim.submissionId,
    createdAt: claim.createdAt,
    guestName: claim.guestName,
    relationship: claim.relationship,
    language: claim.language,
    mediaType: claim.mediaType,
    prompt: claim.prompt,
    caption: claim.caption,
    originalFileName: claim.originalFileName,
    storedFileName: claim.storedFileName,
    driveFileId: data.id,
    driveFolderId: claim.driveFolderId,
    driveUrl,
    mimeType: data.mimeType || claim.mimeType,
    fileSizeBytes: actualSize || claim.fileSizeBytes,
    durationSeconds: claim.durationSeconds || '',
    deviceType: claim.deviceType,
    userAgent: claim.userAgent,
    status: 'uploaded',
    isFavorite: 'FALSE',
    isReviewed: 'FALSE',
    notes: ''
  });

  return { success: true, mediaId: claim.id, submissionId: claim.submissionId, driveFileId: data.id, driveUrl };
}

module.exports = {
  completeUpload,
  createResumableSession,
  initUpload,
  signUploadClaim,
  verifyUploadClaim
};

