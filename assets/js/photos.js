/* ── CONFIG ─────────────────────────────────────────────────────────
   * Replace placeholder values after setting up Apps Script and Drive.
   */
  var CONFIG = {
    PHOTOS_ENDPOINT:    'https://script.google.com/macros/s/AKfycbxubmMM4X3k0JKJ5AXKnRoPRkHbeV7VhZEx_WKwYO4nwi_xVxCrZ940cmsWJ9Q6VLciCg/exec',
    PHOTOS_FOLDER_URL:  'https://drive.google.com/drive/folders/1SFKpH6IvmHYD-R_sXUKsNYDGuxAmUenX',
    MAX_FILES:          10,
    MAX_SIZE_MB:        15,
    MAX_DIMENSION:      1600
  };
  var T = window.WEDDING_TRANSLATIONS || {};

  var currentLang = localStorage.getItem('wedding-lang') || 'en';

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('wedding-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (T[lang] && T[lang][key] !== undefined) el.innerHTML = T[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (T[lang] && T[lang][key] !== undefined) el.placeholder = T[lang][key];
    });
    document.querySelectorAll('.lang-btn[data-lang="en"]').forEach(function(b) { b.classList.toggle('active', lang === 'en'); });
    document.querySelectorAll('.lang-btn[data-lang="th"]').forEach(function(b) { b.classList.toggle('active', lang === 'th'); });
    document.body.classList.toggle('lang-th', lang === 'th');
    document.documentElement.lang = lang === 'th' ? 'th' : 'en';
  }

  /* ── State helpers ───────────────────────────────────────────────── */
  function showState(id) {
    document.querySelectorAll('.state').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getGuestToken() {
    return new URLSearchParams(window.location.search).get('guest') || '';
  }

  /* ── File management ─────────────────────────────────────────────── */
  var selectedFiles = [];
  var ALLOWED_PHOTO_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif'
  ];
  var PHOTO_MIME_ALIASES = {
    'image/jpg': 'image/jpeg',
    'image/pjpeg': 'image/jpeg',
    'image/x-png': 'image/png',
    'image/heic-sequence': 'image/heic',
    'image/heif-sequence': 'image/heif'
  };
  var PHOTO_MIME_BY_EXTENSION = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jpe: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    avif: 'image/avif'
  };
  var PHOTO_EXTENSION_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif'
  };

  function normalizePhotoMime(type) {
    var mime = (type || '').toString().toLowerCase().split(';')[0].trim();
    return PHOTO_MIME_ALIASES[mime] || mime;
  }

  function getFileExtension(fileName) {
    var match = (fileName || '').toString().toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }

  function inferPhotoMime(file) {
    var mime = normalizePhotoMime(file.type);
    if (!mime || mime === 'application/octet-stream' || mime === 'binary/octet-stream') {
      mime = PHOTO_MIME_BY_EXTENSION[getFileExtension(file.name)] || '';
    }
    return ALLOWED_PHOTO_MIMES.indexOf(mime) !== -1 ? mime : '';
  }

  function getPhotoValidation(file) {
    if (!inferPhotoMime(file)) {
      return { ok: false, message: 'Unsupported photo type' };
    }
    if (file.size > CONFIG.MAX_SIZE_MB * 1048576) {
      return { ok: false, message: 'Too large (max ' + CONFIG.MAX_SIZE_MB + ' MB)' };
    }
    return { ok: true, message: '✓' };
  }

  function makeUploadFileName(fileName, mimeType) {
    var safeName = (fileName || 'wedding-photo').toString().replace(/[\\/:*?"<>|]+/g, '-').trim();
    var ext = getFileExtension(safeName);
    var expectedExt = PHOTO_EXTENSION_BY_MIME[mimeType] || 'jpg';
    if (PHOTO_MIME_BY_EXTENSION[ext] === mimeType) return safeName;

    var dot = safeName.lastIndexOf('.');
    var base = dot > 0 ? safeName.slice(0, dot) : safeName;
    return (base || 'wedding-photo') + '.' + expectedExt;
  }

  function handleFiles(fileList) {
    var newFiles = Array.from(fileList);
    newFiles.forEach(function(file) {
      if (selectedFiles.length >= CONFIG.MAX_FILES) return;
      // Avoid duplicate filenames
      var exists = selectedFiles.some(function(f) { return f.name === file.name && f.size === file.size; });
      if (!exists) selectedFiles.push(file);
    });
    // Reset input so the same file can be re-added after removal
    document.getElementById('photo-input').value = '';
    renderFileList();
  }

  function removeFile(idx) {
    selectedFiles.splice(idx, 1);
    renderFileList();
  }

  function renderFileList() {
    var list = document.getElementById('file-list');
    var fzEmpty = document.getElementById('fz-empty');
    var fzSelected = document.getElementById('fz-selected');
    var zone = document.getElementById('file-zone');
    var btn = document.getElementById('btn-upload');

    list.innerHTML = '';

    if (selectedFiles.length === 0) {
      fzEmpty.style.display = 'block';
      fzSelected.style.display = 'none';
      zone.classList.remove('has-files');
      btn.disabled = true;
      return;
    }

    fzEmpty.style.display = 'none';
    fzSelected.style.display = 'block';
    zone.classList.add('has-files');

    var anyValid = false;

    selectedFiles.forEach(function(file, i) {
      var item = document.createElement('div');
      item.className = 'file-item';

      var mimeType = inferPhotoMime(file);
      var validation = getPhotoValidation(file);

      // Thumbnail
      if (mimeType && mimeType !== 'image/heic' && mimeType !== 'image/heif') {
        var img = document.createElement('img');
        img.className = 'file-thumb';
        img.alt = file.name;
        var thumbUrl = URL.createObjectURL(file);
        img.onload = function() { URL.revokeObjectURL(thumbUrl); };
        img.onerror = function() {
          URL.revokeObjectURL(thumbUrl);
          var placeholder = document.createElement('div');
          placeholder.className = 'file-thumb-placeholder';
          placeholder.innerHTML = '🖼';
          if (this.parentNode) this.parentNode.replaceChild(placeholder, this);
        };
        img.src = thumbUrl;
      } else {
        var img = document.createElement('div');
        img.className = 'file-thumb-placeholder';
        img.innerHTML = '🖼';
      }
      item.appendChild(img);

      // Info
      var info = document.createElement('div');
      info.className = 'file-info';
      var name = document.createElement('div');
      name.className = 'file-name';
      name.textContent = file.name;
      var size = document.createElement('div');
      size.className = 'file-size';
      size.textContent = (file.size / 1048576).toFixed(1) + ' MB';
      info.appendChild(name);
      info.appendChild(size);

      // Validation
      var status = document.createElement('div');
      if (!validation.ok) {
        status.className = 'file-status error';
        status.textContent = validation.message;
      } else {
        status.className = 'file-status ok';
        status.textContent = validation.message;
        anyValid = true;
      }
      info.appendChild(status);
      item.appendChild(info);

      // Remove button
      var removeBtn = document.createElement('button');
      removeBtn.className = 'file-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.setAttribute('aria-label', 'Remove ' + file.name);
      removeBtn.setAttribute('data-idx', i);
      removeBtn.onclick = function() { removeFile(parseInt(this.getAttribute('data-idx'))); };
      item.appendChild(removeBtn);

      list.appendChild(item);
    });

    btn.disabled = !anyValid || selectedFiles.some(function(file) { return !getPhotoValidation(file).ok; });
  }

  /* ── Canvas resize ───────────────────────────────────────────────── */
  function forceDataUrlMime(dataUrl, mimeType) {
    var parts = (dataUrl || '').split(',');
    if (parts.length < 2) return dataUrl;
    return 'data:' + mimeType + ';base64,' + parts.slice(1).join(',');
  }

  function readRawPhotoData(file, mimeType) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        resolve({ dataUrl: forceDataUrlMime(e.target.result, mimeType), mimeType: mimeType });
      };
      reader.onerror = function() { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  function resizeImage(file) {
    return new Promise(function(resolve) {
      var sourceMime = inferPhotoMime(file);
      if (!sourceMime) {
        resolve(null);
        return;
      }

      var objectUrl = URL.createObjectURL(file);
      var img = new Image();

      img.onload = function() {
        URL.revokeObjectURL(objectUrl);
        try {
          var w = img.width, h = img.height;
          var max = CONFIG.MAX_DIMENSION;
          if (w > max || h > max) {
            if (w > h) { h = Math.round(h * max / w); w = max; }
            else       { w = Math.round(w * max / h); h = max; }
          }
          var canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          var outMime = (sourceMime === 'image/png') ? 'image/png' : 'image/jpeg';
          var dataUrl = canvas.toDataURL(outMime, 0.88);
          resolve({ dataUrl: dataUrl, mimeType: outMime });
        } catch (_) {
          readRawPhotoData(file, sourceMime).then(resolve);
        }
      };

      img.onerror = function() {
        URL.revokeObjectURL(objectUrl);
        // If canvas can't decode (for example HEIC), fall back to raw base64.
        readRawPhotoData(file, sourceMime).then(resolve);
      };

      img.src = objectUrl;
    });
  }

  /* ── Upload ──────────────────────────────────────────────────────── */
  async function uploadPhotos() {
    var validFiles = selectedFiles.filter(function(f) { return getPhotoValidation(f).ok; });
    if (validFiles.length === 0) return;

    var btn = document.getElementById('btn-upload');
    btn.disabled = true;
    showState('state-uploading');

    var name    = document.getElementById('p-name').value.trim();
    var caption = document.getElementById('p-caption').value.trim();
    var token   = getGuestToken();
    var total   = validFiles.length;
    var uploaded = 0;
    var errors   = 0;

    for (var i = 0; i < validFiles.length; i++) {
      var file = validFiles[i];
      document.getElementById('uploading-text').textContent =
        'Uploading photo ' + (i + 1) + ' of ' + total + '…';

      try {
        var result = await resizeImage(file);
        if (!result) { errors++; continue; }

        var base64 = result.dataUrl.split(',')[1];
        var payload = {
          guestToken:       token,
          guestName:        name,
          caption:          caption,
          submittedAt:      new Date().toISOString(),
          fileName:         makeUploadFileName(file.name, result.mimeType),
          mimeType:         result.mimeType,
          imageBase64:      base64,
          userAgent:        navigator.userAgent
        };

        var res  = await fetch(CONFIG.PHOTOS_ENDPOINT, {
          method:  'POST',
          body:    JSON.stringify(payload),
          headers: { 'Content-Type': 'text/plain' }
        });
        var data = await res.json();
        if (data.success) { uploaded++; } else { errors++; }
      } catch (err) {
        errors++;
      }
    }

    if (uploaded > 0) {
      showState('state-success');
    } else {
      document.getElementById('error-msg').textContent =
        'None of the photos could be uploaded. Please check your connection and try again.';
      showState('state-error');
    }
  }

  /* ── Reset (for shared devices) ──────────────────────────────────── */
  function resetForm() {
    selectedFiles = [];
    document.getElementById('p-name').value    = '';
    document.getElementById('p-caption').value = '';
    document.getElementById('photo-input').value = '';
    renderFileList();
    showState('state-form');
  }

  /* ── Init ────────────────────────────────────────────────────────── */
  setLang(currentLang);

  // Wire up shared photos view link
  var folderUrl = CONFIG.PHOTOS_FOLDER_URL;
  if (folderUrl && folderUrl.indexOf('PASTE') === -1) {
    document.getElementById('view-photos-link').href    = folderUrl;
    document.getElementById('view-link-success').href   = folderUrl;
  } else {
    // Hide view button until folder URL is configured
    document.getElementById('view-photos-link').style.display  = 'none';
    document.getElementById('view-link-success').style.display = 'none';
  }

  // Keyboard support for file zone
  document.getElementById('file-zone').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('photo-input').click(); }
  });

  // Drag-and-drop support
  var zone = document.getElementById('file-zone');
  zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
