var T = window.WEDDING_TRANSLATIONS || {};

  var currentLang = localStorage.getItem('wedding-lang') || 'en';

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('wedding-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (T[lang] && T[lang][key] !== undefined) el.innerHTML = T[lang][key];
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

  setLang(currentLang);

  // Pass guest token to child pages via link href (QR codes always use base URL)
  (function() {
    var guest = new URLSearchParams(window.location.search).get('guest');
    if (!guest) return;
    ['card-moments', 'card-gift', 'card-photos'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var url = new URL(el.href, location.href);
      url.searchParams.set('guest', guest);
      el.href = url.toString();
    });
  })();
