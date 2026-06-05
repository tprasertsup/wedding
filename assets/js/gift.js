/* ── CONFIG ────────────────────────────────────────────────────────
   * Replace placeholder values after creating your Assets and Apps Script.
   */
  var CONFIG = {
    PROMPTPAY_QR_URL: '/wedding/assets/promptpay-qr.png',
    VENMO_QR_URL:     '/wedding/assets/venmo-qr.png',
    GIFT_ENDPOINT:    'https://script.google.com/macros/s/AKfycbwhGGUr2J09tAeM6erUHoIH_obnaiSoOOvM96J3BGLgyLOI2aDstvRTFHkq7aEgCL1UzA/exec',
    MAX_SLIP_SIZE_MB: 10
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

  /* ── State helpers ─────────────────────────────────────────────────── */
  var prevState   = 'state-choose';
  var lastFormState = 'state-pp-form';
  var selectedSlipFile = null;

  function showState(id) {
    document.querySelectorAll('.state').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() { showState(prevState); }

  /* ── Guest token ───────────────────────────────────────────────────── */
  function getGuestToken() {
    return new URLSearchParams(window.location.search).get('guest') || '';
  }

  /* ── Method selection ─────────────────────────────────────────────── */
  function choosePP() {
    prevState = 'state-choose';
    showState('state-pp-qr');
  }

  function chooseVenmo() {
    prevState = 'state-choose';
    showState('state-venmo-qr');
  }

  function goToSlipForm() {
    showState('state-pp-form');
  }

  function venmoGiftSent() {
    document.getElementById('success-heading').innerHTML =
      T[currentLang]['gift.success.venmo'] || 'Thank you so much! Your gift means the world to us. 💛';
    showState('state-success');
  }

  function retryFromError() {
    showState(lastFormState);
  }

  /* ── Slip file handling ───────────────────────────────────────────── */
  function handleSlipFile(file) {
    if (!file) return;
    var allowed = ['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'];
    var maxBytes = CONFIG.MAX_SLIP_SIZE_MB * 1048576;

    if (allowed.indexOf(file.type) === -1) {
      alert('Please upload a JPEG, PNG, WebP, or PDF file.');
      return;
    }
    if (file.size > maxBytes) {
      alert('File is too large. Maximum size is ' + CONFIG.MAX_SLIP_SIZE_MB + ' MB.');
      return;
    }

    selectedSlipFile = file;
    var zone = document.getElementById('slip-drop-zone');
    zone.classList.add('has-file');
    document.getElementById('slip-placeholder').style.display = 'none';
    var nameEl = document.getElementById('slip-name');
    nameEl.style.display = 'block';
    nameEl.textContent = file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)';
    document.getElementById('slip-err').style.display = 'none';
  }

  /* ── Submit slip (PromptPay) ───────────────────────────────────────── */
  function submitSlip() {
    if (!selectedSlipFile) {
      document.getElementById('slip-err').style.display = 'block';
      return;
    }

    var btn = document.getElementById('btn-submit-slip');
    btn.disabled = true;
    lastFormState = 'state-pp-form';
    showState('state-uploading');

    var reader = new FileReader();
    reader.onload = function() {
      var base64 = reader.result.split(',')[1];
      var payload = {
        guestToken:    getGuestToken(),
        guestName:     (document.getElementById('g-name').value || '').trim(),
        submittedAt:   new Date().toISOString(),
        amountThb:     parseFloat(document.getElementById('g-amount').value) || null,
        note:          (document.getElementById('g-note').value || '').trim(),
        slipFileName:  selectedSlipFile.name,
        slipMimeType:  selectedSlipFile.type,
        slipBase64:    base64,
        status:        'slip_uploaded',
        source:        'static_promptpay',
        userAgent:     navigator.userAgent
      };

      fetch(CONFIG.GIFT_ENDPOINT, {
        method: 'POST',
        body:   JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain' }
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          document.getElementById('success-heading').innerHTML =
            T[currentLang]['gift.success.pp'] || 'Thank you — we received your gift slip 💛';
          showState('state-success');
        } else {
          btn.disabled = false;
          document.getElementById('error-msg').textContent = data.error || 'Server error. Please try again.';
          showState('state-error');
        }
      })
      .catch(function() {
        btn.disabled = false;
        document.getElementById('error-msg').textContent =
          'Could not reach the server. Please check your connection and try again.';
        showState('state-error');
      });
    };
    reader.onerror = function() {
      btn.disabled = false;
      document.getElementById('error-msg').textContent = 'Could not read the file. Please try again.';
      showState('state-error');
    };
    reader.readAsDataURL(selectedSlipFile);
  }

  /* ── QR image loading ─────────────────────────────────────────────── */
  function loadQrImage(imgId, placeholderId, url) {
    var img = document.getElementById(imgId);
    var placeholder = document.getElementById(placeholderId);
    if (!url || url.indexOf('PASTE') !== -1) return; // still a placeholder constant
    img.onload = function() {
      img.style.display = 'block';
      placeholder.style.display = 'none';
    };
    img.onerror = function() {
      img.style.display = 'none';
      placeholder.style.display = 'block';
    };
    img.src = url;
  }

  /* ── QR download — uses Web Share API on mobile so image goes to photo album ── */
  function setupQrDownload(btnId, url, filename) {
    var btn = document.getElementById(btnId);
    btn.href = url;
    btn.addEventListener('click', function(e) {
      if (!url || url.indexOf('PASTE') !== -1) return; // placeholder, nothing to share
      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        e.preventDefault();
        fetch(url)
          .then(function(r) { return r.blob(); })
          .then(function(blob) {
            var file = new File([blob], filename, { type: blob.type || 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              return navigator.share({ files: [file], title: filename });
            }
            // canShare returned false — fall back to blob URL download
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
          })
          .catch(function() {}); // user cancelled share sheet — no-op
      }
      // Desktop: let the default <a download> behaviour proceed
    });
  }

  /* ── Init ─────────────────────────────────────────────────────────── */
  setLang(currentLang);

  loadQrImage('pp-qr-img',    'pp-qr-placeholder',    CONFIG.PROMPTPAY_QR_URL);
  loadQrImage('venmo-qr-img', 'venmo-qr-placeholder', CONFIG.VENMO_QR_URL);

  setupQrDownload('pp-download-btn',    CONFIG.PROMPTPAY_QR_URL, 'promptpay-qr.png');
  setupQrDownload('venmo-download-btn', CONFIG.VENMO_QR_URL,     'venmo-qr.png');

  // Keyboard support for slip drop zone
  document.getElementById('slip-drop-zone').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('slip-input').click(); }
  });
