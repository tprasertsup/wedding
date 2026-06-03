(function () {
  const T = window.GUESTBOOK_TRANSLATIONS || {};
  const CONFIG = window.GUESTBOOK_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const state = {
    lang: localStorage.getItem('wedding-guestbook-lang') || 'en',
    token: params.get('token') || '',
    kiosk: params.get('kiosk') === '1',
    submissionId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    guestName: '',
    relationship: '',
    prompt: '',
    stream: null,
    recorder: null,
    chunks: [],
    recordedBlob: null,
    recordedMimeType: '',
    recordedDuration: 0,
    recordingTimer: null,
    recordingStartedAt: 0,
    selectedPhotos: [],
    retryAction: null,
    lastThanksType: 'video',
    kioskTimer: null
  };

  const maxDuration = Number(CONFIG.maxVideoDurationSeconds || 60);
  const maxPhotosPerBatch = Number(CONFIG.maxPhotosPerBatch || 20);
  const videoTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];

  const screens = Array.from(document.querySelectorAll('.screen'));
  const statusBanner = document.getElementById('status-banner');
  const progressBar = document.getElementById('progress-bar');
  const progressLabel = document.getElementById('progress-label');
  const retryButton = document.getElementById('retry-upload');
  const photoInput = document.getElementById('photo-input');
  const cameraPreview = document.getElementById('camera-preview');
  const recordedPreview = document.getElementById('recorded-preview');
  const recordButton = document.querySelector('[data-action="toggle-record"]');
  const allowCameraButton = document.querySelector('[data-action="allow-camera"]');

  function t(path) {
    return path.split('.').reduce((obj, key) => (obj ? obj[key] : undefined), T[state.lang]) || '';
  }

  function setLang(lang) {
    state.lang = T[lang] ? lang : 'en';
    localStorage.setItem('wedding-guestbook-lang', state.lang);
    document.documentElement.lang = state.lang === 'th' ? 'th' : 'en';
    document.body.classList.toggle('lang-th', state.lang === 'th');
    document.querySelectorAll('.lang-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.lang === state.lang);
    });
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    renderPrompts();
    renderPhotos();
    renderThanks();
    updateRecordButton();
  }

  function showScreen(name) {
    screens.forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === name));
    hideStatus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (state.kiosk) armKioskIdleTimer();
  }

  function showStatus(message) {
    statusBanner.textContent = message;
    statusBanner.hidden = false;
  }

  function hideStatus() {
    statusBanner.hidden = true;
    statusBanner.textContent = '';
  }

  function apiBase() {
    return String(CONFIG.apiBaseUrl || '').replace(/\/$/, '');
  }

  function ensureUploadReady() {
    if (!state.token) {
      showStatus(t('common.tokenMissing'));
      return false;
    }
    if (!apiBase() || apiBase().includes('your-guestbook-api')) {
      showStatus(t('common.apiMissing'));
      return false;
    }
    return true;
  }

  function deviceType() {
    const ua = navigator.userAgent || '';
    if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function supportedVideoType() {
    if (!window.MediaRecorder) return '';
    return videoTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0');
  }

  function renderPrompts() {
    const list = document.getElementById('prompt-list');
    list.innerHTML = '';
    (t('prompt.options') || []).forEach((prompt) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'prompt-option';
      button.textContent = prompt;
      button.classList.toggle('active', state.prompt === prompt);
      button.addEventListener('click', () => {
        state.prompt = state.prompt === prompt ? '' : prompt;
        renderPrompts();
      });
      list.appendChild(button);
    });
  }

  function renderPhotos() {
    const grid = document.getElementById('photo-grid');
    grid.innerHTML = '';
    state.selectedPhotos.forEach((item) => {
      const tile = document.createElement('div');
      tile.className = 'photo-tile';
      if (item.previewUrl) {
        const image = document.createElement('img');
        image.src = item.previewUrl;
        image.alt = item.file.name;
        tile.appendChild(image);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'photo-placeholder';
        placeholder.textContent = item.file.name;
        tile.appendChild(placeholder);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'photo-remove';
      remove.textContent = t('photos.remove');
      remove.addEventListener('click', () => removePhoto(item.id));
      tile.appendChild(remove);
      grid.appendChild(tile);
    });
  }

  function renderThanks() {
    const title = document.getElementById('thanks-title');
    const body = document.getElementById('thanks-body');
    const primary = document.querySelector('[data-action="thanks-primary"]');
    const secondary = document.querySelector('[data-action="thanks-secondary"]');
    if (state.lastThanksType === 'photo') {
      title.textContent = t('thanks.photoTitle');
      body.textContent = t('thanks.photoBody');
      primary.textContent = t('thanks.recordAnother');
      secondary.textContent = t('common.home');
    } else {
      title.textContent = t('thanks.videoTitle');
      body.textContent = t('thanks.videoBody');
      primary.textContent = t('thanks.sharePhotosToo');
      secondary.textContent = t('thanks.recordAnother');
    }
  }

  function resetGuestSession() {
    stopCamera();
    clearInterval(state.recordingTimer);
    state.submissionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    state.guestName = '';
    state.relationship = '';
    state.prompt = '';
    state.chunks = [];
    state.recordedBlob = null;
    state.recordedMimeType = '';
    state.recordedDuration = 0;
    state.retryAction = null;
    state.selectedPhotos.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    state.selectedPhotos = [];
    document.getElementById('guest-form').reset();
    document.getElementById('photo-form').reset();
    recordedPreview.removeAttribute('src');
    recordedPreview.load();
    updateProgress(0);
    renderPhotos();
    renderPrompts();
    showScreen('home');
  }

  function armKioskIdleTimer() {
    clearTimeout(state.kioskTimer);
    state.kioskTimer = setTimeout(resetGuestSession, 120000);
  }

  function armKioskThanksReset() {
    if (!state.kiosk) return;
    document.getElementById('kiosk-reset-note').hidden = false;
    clearTimeout(state.kioskTimer);
    state.kioskTimer = setTimeout(resetGuestSession, 18000);
  }

  async function startInfoFlow() {
    showScreen('info');
  }

  async function openRecorder() {
    showScreen('record');
    await beginCamera();
  }

  async function beginCamera() {
    if (!supportedVideoType()) {
      showStatus(t('common.unsupportedRecorder'));
      return;
    }
    try {
      stopCamera();
      state.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 }
        }
      });
      cameraPreview.srcObject = state.stream;
      recordButton.disabled = false;
      allowCameraButton.hidden = true;
    } catch (error) {
      recordButton.disabled = true;
      allowCameraButton.hidden = false;
      showStatus(t('record.permissionError'));
    }
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }
    if (cameraPreview) cameraPreview.srcObject = null;
    if (recordButton) recordButton.disabled = true;
    if (allowCameraButton) allowCameraButton.hidden = false;
  }

  async function countdown() {
    const overlay = document.getElementById('countdown');
    overlay.hidden = false;
    for (let i = 3; i > 0; i -= 1) {
      overlay.textContent = String(i);
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
    overlay.hidden = true;
  }

  async function startRecording() {
    if (!state.stream) await beginCamera();
    if (!state.stream) return;
    await countdown();
    state.chunks = [];
    state.recordedBlob = null;
    state.recordedMimeType = supportedVideoType();
    state.recorder = new MediaRecorder(state.stream, { mimeType: state.recordedMimeType });
    state.recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) state.chunks.push(event.data);
    });
    state.recorder.addEventListener('stop', handleRecordingStopped);
    state.recorder.start(250);
    state.recordingStartedAt = Date.now();
    state.recordingTimer = setInterval(updateRecordingTimer, 250);
    updateRecordButton();
  }

  function stopRecording() {
    if (state.recorder && state.recorder.state !== 'inactive') {
      state.recorder.stop();
    }
  }

  function updateRecordingTimer() {
    const elapsed = (Date.now() - state.recordingStartedAt) / 1000;
    document.getElementById('elapsed-time').textContent = formatTime(elapsed);
    document.getElementById('remaining-time').textContent = formatTime(maxDuration - elapsed) + ' ' + t('record.remaining');
    if (elapsed >= maxDuration) stopRecording();
  }

  function handleRecordingStopped() {
    clearInterval(state.recordingTimer);
    state.recordedDuration = Math.min(maxDuration, Math.round((Date.now() - state.recordingStartedAt) / 1000));
    state.recordedBlob = new Blob(state.chunks, { type: state.recordedMimeType || 'video/webm' });
    const url = URL.createObjectURL(state.recordedBlob);
    recordedPreview.src = url;
    stopCamera();
    updateRecordButton();
    showScreen('preview');
  }

  function updateRecordButton() {
    if (!recordButton) return;
    const isRecording = state.recorder && state.recorder.state === 'recording';
    recordButton.textContent = isRecording ? t('record.stop') : t('record.start');
  }

  function removePhoto(id) {
    const item = state.selectedPhotos.find((photo) => photo.id === id);
    if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    state.selectedPhotos = state.selectedPhotos.filter((photo) => photo.id !== id);
    renderPhotos();
  }

  function addPhotos(files) {
    if (state.selectedPhotos.length + files.length > maxPhotosPerBatch) {
      showStatus(t('photos.tooMany'));
      return;
    }
    Array.from(files).forEach((file) => {
      const isPreviewable = file.type && !/hei[cf]/i.test(file.type);
      state.selectedPhotos.push({
        id: crypto.randomUUID ? crypto.randomUUID() : file.name + Date.now(),
        file,
        previewUrl: isPreviewable ? URL.createObjectURL(file) : '',
        uploaded: false
      });
    });
    renderPhotos();
  }

  function fileMimeType(file) {
    if (file.type) return file.type;
    if (/\.heic$/i.test(file.name)) return 'image/heic';
    if (/\.heif$/i.test(file.name)) return 'image/heif';
    return 'application/octet-stream';
  }

  function updateProgress(value) {
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    progressBar.style.width = percent + '%';
    progressLabel.textContent = percent + '%';
  }

  async function initUpload(payload) {
    const response = await fetch(apiBase() + '/api/upload/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        eventToken: state.token,
        language: state.lang,
        submissionId: state.submissionId,
        deviceType: deviceType(),
        userAgent: navigator.userAgent
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || 'upload-init');
    return data;
  }

  async function completeUpload(payload) {
    const response = await fetch(apiBase() + '/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || 'upload-complete');
    return data;
  }

  function uploadFile(uploadUrl, file, mimeType, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', mimeType || 'application/octet-stream');
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onProgress((event.loaded / event.total) * 100);
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText || '{}'));
          } catch (error) {
            resolve({});
          }
        } else {
          reject(new Error('upload-put'));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('upload-network')));
      xhr.send(file);
    });
  }

  async function submitVideo() {
    if (!state.recordedBlob || !ensureUploadReady()) return;
    showScreen('upload');
    retryButton.hidden = true;
    state.retryAction = submitVideo;
    try {
      const init = await initUpload({
        mediaType: 'video',
        originalFileName: 'video-blessing.webm',
        mimeType: state.recordedBlob.type || 'video/webm',
        fileSizeBytes: state.recordedBlob.size,
        durationSeconds: state.recordedDuration,
        guestName: state.guestName,
        relationship: state.relationship,
        prompt: state.prompt
      });
      const driveFile = await uploadFile(init.uploadUrl, state.recordedBlob, state.recordedBlob.type, updateProgress);
      await completeUpload({
        uploadClaim: init.uploadClaim,
        driveFileId: driveFile.id || init.driveFileId
      });
      state.lastThanksType = 'video';
      renderThanks();
      showScreen('thanks');
      armKioskThanksReset();
    } catch (error) {
      showStatus(t('common.networkError'));
      retryButton.hidden = false;
    }
  }

  async function submitPhotos(event) {
    event.preventDefault();
    if (!state.selectedPhotos.length) {
      showStatus(t('photos.empty'));
      return;
    }
    if (!ensureUploadReady()) return;
    const guestName = document.getElementById('photo-name').value.trim();
    const caption = document.getElementById('photo-caption').value.trim();
    showScreen('upload');
    retryButton.hidden = true;
    state.retryAction = () => submitPhotos(new Event('submit'));
    try {
      const pending = state.selectedPhotos.filter((item) => !item.uploaded);
      for (let i = 0; i < pending.length; i += 1) {
        const item = pending[i];
        const init = await initUpload({
          mediaType: 'photo',
          originalFileName: item.file.name,
          mimeType: fileMimeType(item.file),
          fileSizeBytes: item.file.size,
          guestName,
          caption,
          photoIndex: i + 1
        });
        const baseProgress = (i / pending.length) * 100;
        const slice = 100 / pending.length;
        const driveFile = await uploadFile(init.uploadUrl, item.file, fileMimeType(item.file), (percent) => {
          updateProgress(baseProgress + (percent * slice / 100));
        });
        await completeUpload({
          uploadClaim: init.uploadClaim,
          driveFileId: driveFile.id || init.driveFileId
        });
        item.uploaded = true;
      }
      updateProgress(100);
      state.lastThanksType = 'photo';
      renderThanks();
      showScreen('thanks');
      armKioskThanksReset();
    } catch (error) {
      showStatus(t('common.networkError'));
      retryButton.hidden = false;
    }
  }

  function wireEvents() {
    document.querySelectorAll('.lang-btn').forEach((button) => {
      button.addEventListener('click', () => setLang(button.dataset.lang));
    });
    document.querySelector('[data-action="start-record"]').addEventListener('click', startInfoFlow);
    document.querySelector('[data-action="open-photos"]').addEventListener('click', () => showScreen('photos'));
    document.querySelectorAll('[data-action="home"]').forEach((button) => button.addEventListener('click', resetGuestSession));
    document.querySelector('[data-action="info"]').addEventListener('click', () => showScreen('info'));
    document.querySelector('[data-action="prompt"]').addEventListener('click', () => showScreen('prompt'));
    document.querySelector('[data-action="skip-prompt"]').addEventListener('click', () => {
      state.prompt = '';
      renderPrompts();
    });
    document.querySelector('[data-action="open-recorder"]').addEventListener('click', openRecorder);
    document.querySelector('[data-action="allow-camera"]').addEventListener('click', beginCamera);
    document.querySelector('[data-action="toggle-record"]').addEventListener('click', () => {
      if (state.recorder && state.recorder.state === 'recording') stopRecording();
      else startRecording();
    });
    document.querySelector('[data-action="submit-video"]').addEventListener('click', submitVideo);
    document.querySelectorAll('[data-action="record-again"]').forEach((button) => {
      button.addEventListener('click', async () => {
        state.recordedBlob = null;
        state.chunks = [];
        showScreen('record');
        await beginCamera();
      });
    });
    document.querySelector('[data-action="choose-photos"]').addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', () => addPhotos(photoInput.files));
    document.getElementById('guest-form').addEventListener('submit', (event) => {
      event.preventDefault();
      state.guestName = document.getElementById('guest-name').value.trim();
      state.relationship = document.getElementById('guest-relationship').value.trim();
      if (!state.guestName) return;
      showScreen('prompt');
    });
    document.getElementById('photo-form').addEventListener('submit', submitPhotos);
    document.querySelector('[data-action="thanks-primary"]').addEventListener('click', () => {
      if (state.lastThanksType === 'video') showScreen('photos');
      else startInfoFlow();
    });
    document.querySelector('[data-action="thanks-secondary"]').addEventListener('click', () => {
      if (state.lastThanksType === 'video') startInfoFlow();
      else resetGuestSession();
    });
    retryButton.addEventListener('click', () => {
      if (state.retryAction) state.retryAction();
    });
    if (state.kiosk) {
      ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, armKioskIdleTimer, { passive: true });
      });
    }
  }

  function init() {
    document.body.classList.toggle('kiosk', state.kiosk);
    document.getElementById('kiosk-pill').hidden = !state.kiosk;
    document.getElementById('kiosk-reset-note').hidden = true;
    wireEvents();
    setLang(state.lang);
    if (!state.token) showStatus(t('common.tokenMissing'));
    if (state.kiosk) armKioskIdleTimer();
  }

  init();
})();
