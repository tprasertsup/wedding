/* ── CONFIG ─────────────────────────────────────────────────────── */
  const CONFIG = {
    MOMENTS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbz5DWagzRevobTnxOGd7xwLqjOy_EWayO7nHmuri1w2SmsxFZfPcFTiCKFR-khfoPWovw/exec'
  };
  const T = window.WEDDING_TRANSLATIONS || {};

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
    document.querySelectorAll('.lang-btn[data-lang="en"]').forEach(function(b) {
      b.classList.toggle('active', lang === 'en');
    });
    document.querySelectorAll('.lang-btn[data-lang="th"]').forEach(function(b) {
      b.classList.toggle('active', lang === 'th');
    });
    document.body.classList.toggle('lang-th', lang === 'th');
    document.documentElement.lang = lang === 'th' ? 'th' : 'en';
  }

  /* ── State helpers ───────────────────────────────────────────────── */
  function showState(id) {
    document.querySelectorAll('.state').forEach(function(s) {
      s.classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
  }

  /* ── Guest token ─────────────────────────────────────────────────── */
  function getGuestToken() {
    return new URLSearchParams(window.location.search).get('guest') || '';
  }

  /* ── Tab toggle ──────────────────────────────────────────────────── */
  function showTab(tab) {
    var voicePanel = document.getElementById('panel-voice');
    var textPanel  = document.getElementById('panel-text');
    var tabVoice   = document.getElementById('tab-voice');
    var tabText    = document.getElementById('tab-text');

    if (tab === 'voice') {
      voicePanel.style.display = 'block';
      textPanel.style.display  = 'none';
      tabVoice.classList.add('active');
      tabText.classList.remove('active');
      tabVoice.setAttribute('aria-selected', 'true');
      tabText.setAttribute('aria-selected', 'false');
    } else {
      voicePanel.style.display = 'none';
      textPanel.style.display  = 'block';
      tabVoice.classList.remove('active');
      tabText.classList.add('active');
      tabVoice.setAttribute('aria-selected', 'false');
      tabText.setAttribute('aria-selected', 'true');
    }
  }

  /* ── Voice recording state ───────────────────────────────────────── */
  var mediaRecorder   = null;
  var audioChunks     = [];
  var recordingBlob   = null;
  var timerInterval   = null;
  var elapsedSeconds  = 0;
  var MAX_SECONDS     = 180;

  function formatTime(s) {
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function updateTimerDisplay() {
    document.getElementById('voice-timer').textContent = formatTime(elapsedSeconds);
  }

  function toggleRecord() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      showVoiceFallback();
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
      var mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
        .find(function(t) { return MediaRecorder.isTypeSupported(t); }) || '';

      audioChunks  = [];
      recordingBlob = null;

      var opts = mimeType ? { mimeType: mimeType } : {};
      mediaRecorder = new MediaRecorder(stream, opts);

      mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = function() {
        stream.getTracks().forEach(function(t) { t.stop(); });
        var actualMime = mediaRecorder.mimeType || 'audio/webm';
        recordingBlob  = new Blob(audioChunks, { type: actualMime });
        var url        = URL.createObjectURL(recordingBlob);
        var audio      = document.getElementById('voice-playback');
        audio.src      = url;
        document.getElementById('voice-audio-wrap').style.display = 'block';
        document.getElementById('btn-submit-voice').disabled = false;
        setRecordUI('idle');
        document.getElementById('voice-status').textContent =
          T[currentLang]['moments.status.saved'];
      };

      mediaRecorder.start(250);
      elapsedSeconds = 0;
      updateTimerDisplay();

      timerInterval = setInterval(function() {
        elapsedSeconds++;
        updateTimerDisplay();
        if (elapsedSeconds >= MAX_SECONDS) stopRecording();
      }, 1000);

      setRecordUI('recording');
      document.getElementById('voice-status').textContent =
        T[currentLang]['moments.status.recording'];

    }).catch(function() {
      showVoiceFallback();
    });
  }

  function stopRecording() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  function setRecordUI(state) {
    var btn   = document.getElementById('record-btn');
    var icon  = document.getElementById('record-icon');
    var timer = document.getElementById('voice-timer');

    if (state === 'recording') {
      btn.classList.add('recording');
      icon.textContent = '⏹';
      btn.setAttribute('aria-label', 'Stop recording');
      timer.classList.add('recording');
    } else {
      btn.classList.remove('recording');
      icon.textContent = '🎙';
      btn.setAttribute('aria-label', 'Start recording');
      timer.classList.remove('recording');
    }
  }

  function reRecord() {
    recordingBlob  = null;
    elapsedSeconds = 0;
    updateTimerDisplay();
    document.getElementById('voice-audio-wrap').style.display = 'none';
    document.getElementById('btn-submit-voice').disabled = true;
    document.getElementById('voice-status').textContent =
      T[currentLang]['moments.status.ready'];
    setRecordUI('idle');
    var audio = document.getElementById('voice-playback');
    audio.pause();
    audio.src = '';
  }

  function showVoiceFallback() {
    document.getElementById('voice-fallback').style.display = 'block';
    document.getElementById('record-btn').style.display = 'none';
    document.getElementById('voice-status').style.display = 'none';
    document.getElementById('voice-timer').style.display = 'none';
    showTab('text');
  }

  /* ── Submit voice ────────────────────────────────────────────────── */
  function submitVoice() {
    if (!recordingBlob) return;
    if (document.getElementById('btn-submit-voice').disabled) return;

    document.getElementById('btn-submit-voice').disabled = true;
    document.getElementById('upload-progress-text').textContent =
      T[currentLang]['moments.encoding'];
    showState('state-uploading');

    blobToBase64(recordingBlob).then(function(dataUrl) {
      var base64 = dataUrl.split(',')[1];
      document.getElementById('upload-progress-text').textContent =
        T[currentLang]['moments.uploading'];

      var ext = mimeToExt(recordingBlob.type);
      var payload = {
        type:            'voice',
        guestName:       document.getElementById('m-name').value.trim(),
        guestToken:      getGuestToken(),
        submittedAt:     new Date().toISOString(),
        fileName:        'voice-blessing-' + Date.now() + '.' + ext,
        mimeType:        recordingBlob.type,
        durationSeconds: elapsedSeconds,
        audioBase64:     base64,
        userAgent:       navigator.userAgent
      };

      return postToEndpoint(payload);
    }).catch(function() {
      document.getElementById('btn-submit-voice').disabled = false;
      showError('Could not encode your recording. Please try the written note instead.');
    });
  }

  /* ── Submit text ─────────────────────────────────────────────────── */
  function submitText() {
    var message = document.getElementById('m-text').value.trim();
    if (!message) {
      var ta = document.getElementById('m-text');
      var err = document.getElementById('blessing-err');
      ta.style.borderColor = 'var(--rose)';
      err.style.display = 'block';
      ta.focus();
      ta.addEventListener('input', function() {
        ta.style.borderColor = '';
        err.style.display = 'none';
      }, { once: true });
      return;
    }

    document.getElementById('btn-submit-text').disabled = true;
    document.getElementById('upload-progress-text').textContent =
      T[currentLang]['moments.uploading'];
    showState('state-uploading');

    var payload = {
      type:        'text',
      guestName:   document.getElementById('m-name').value.trim(),
      guestToken:  getGuestToken(),
      submittedAt: new Date().toISOString(),
      messageText: message,
      userAgent:   navigator.userAgent
    };

    postToEndpoint(payload);
  }

  /* ── Shared POST ─────────────────────────────────────────────────── */
  function postToEndpoint(payload) {
    return fetch(CONFIG.MOMENTS_ENDPOINT, {
      method:  'POST',
      body:    JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain' }  // avoids CORS preflight with Apps Script
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        showState('state-success');
      } else {
        document.getElementById('btn-submit-text').disabled = false;
        document.getElementById('btn-submit-voice').disabled = false;
        showError(data.error || 'The server returned an error. Please try again.');
      }
    })
    .catch(function() {
      document.getElementById('btn-submit-text').disabled = false;
      document.getElementById('btn-submit-voice').disabled = false;
      showError('Could not reach the server. Please check your connection and try again.');
    });
  }

  function showError(msg) {
    if (msg) document.getElementById('error-msg').textContent = msg;
    showState('state-error');
  }

  /* ── Reset form (for shared-device / next guest) ─────────────────── */
  function resetForm() {
    // Clear all inputs
    document.getElementById('m-name').value  = '';
    document.getElementById('m-text').value  = '';
    document.getElementById('m-text').style.borderColor = '';

    // Reset voice state
    stopRecording();
    recordingBlob  = null;
    elapsedSeconds = 0;
    updateTimerDisplay();
    document.getElementById('voice-audio-wrap').style.display = 'none';
    document.getElementById('btn-submit-voice').disabled = true;
    document.getElementById('btn-submit-text').disabled  = false;
    document.getElementById('voice-status').textContent  =
      T[currentLang]['moments.status.ready'];
    setRecordUI('idle');
    var audio = document.getElementById('voice-playback');
    audio.pause();
    audio.src = '';

    // Reset to default tab
    showTab('voice');
    showState('state-form');

    // Scroll to top of card
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── Utilities ───────────────────────────────────────────────────── */
  function blobToBase64(blob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload  = function() { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function mimeToExt(mime) {
    if (mime.indexOf('mp4') !== -1)  return 'mp4';
    if (mime.indexOf('ogg') !== -1)  return 'ogg';
    return 'webm';
  }

  /* ── Init ────────────────────────────────────────────────────────── */
  setLang(currentLang);

  // Check for voice support; auto-fallback if missing
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    showVoiceFallback();
  }
