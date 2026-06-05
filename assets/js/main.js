// ── CONFIG — paste your Apps Script Web App URL here after deploying ──
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2B9dx1JlUDKu59fKOP2SNd15COt5m5lysFgnGUXNibhpRTLdRG5zacv4XARtTJL7H/exec';
    // ─────────────────────────────────────────────────────────────────────

    /* ── PETALS ─────────────────────────────────────────────────────── */
    (function () {
      const container = document.getElementById('petals-container');
      const colors = ['#f2b5c0', '#e8968a', '#f5d5dc', '#d4b896', '#f0c8b0', '#e8d0bc'];
      const count  = 28;

      for (let i = 0; i < count; i++) {
        const petal    = document.createElement('div');
        const size     = 5 + Math.random() * 8;
        const left     = Math.random() * 100;
        const delay    = Math.random() * 14;
        const duration = 10 + Math.random() * 14;
        const color    = colors[Math.floor(Math.random() * colors.length)];
        const opacity  = 0.35 + Math.random() * 0.45;
        const ratio    = 0.55 + Math.random() * 0.5;

        petal.style.cssText = [
          'position:absolute',
          `left:${left}%`,
          'top:-40px',
          `width:${size}px`,
          `height:${size * ratio}px`,
          `background:${color}`,
          `opacity:${opacity}`,
          'border-radius:60% 40% 70% 30% / 50% 60% 40% 50%',
          `animation:petalFall ${duration}s ${delay}s linear infinite`,
          'pointer-events:none'
        ].join(';');

        container.appendChild(petal);
      }
    })();

    /* ── COUNTDOWN ──────────────────────────────────────────────────── */
    (function () {
      // Target: July 11, 2027 15:30 Bangkok (UTC+7) = 08:30 UTC
      const target = Date.UTC(2027, 6, 11, 8, 30, 0);

      function pad2(n) { return String(n).padStart(2, '0'); }
      function pad3(n) { return String(n).padStart(3, '0'); }

      function tick() {
        const diff = Math.max(0, target - Date.now());
        const days  = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins  = Math.floor((diff % 3600000) / 60000);
        const secs  = Math.floor((diff % 60000) / 1000);

        document.getElementById('cd-days').textContent  = pad3(days);
        document.getElementById('cd-hours').textContent = pad2(hours);
        document.getElementById('cd-mins').textContent  = pad2(mins);
        document.getElementById('cd-secs').textContent  = pad2(secs);
      }

      tick();
      setInterval(tick, 1000);
    })();

    /* ── SCROLL FADE-IN ─────────────────────────────────────────────── */
    (function () {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;

            if (el.classList.contains('photo-drop')) {
              const delay = parseFloat(el.style.getPropertyValue('--delay')) || 0;
              el.classList.add('dropping');
              setTimeout(() => {
                el.classList.remove('dropping');
                el.classList.add('settled');
              }, (delay + 1.06) * 1000);
            } else {
              el.classList.add('visible');
            }

            observer.unobserve(el);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
      );

      document.querySelectorAll('.fade-in, .slide-left, .slide-right, .scale-up, .photo-drop, .tl-moment')
        .forEach((el) => observer.observe(el));

      // Draw the timeline line when the section enters view
      const tlEl = document.getElementById('celebTimeline');
      if (tlEl) {
        new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) { tlEl.classList.add('line-active'); }
        }, { threshold: 0.05 }).observe(tlEl);
      }

      // Hero fade-in elements become visible immediately — block animation on
      // .hero-content handles the whole chunk rising together
      document.querySelectorAll('#hero .fade-in').forEach(el => el.classList.add('visible'));

      // Wiggle envelope once when it enters the viewport
      const envEl = document.getElementById('envelope');
      if (envEl) {
        new IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) return;
          setTimeout(() => {
            envEl.classList.add('env-wiggle');
            envEl.addEventListener('animationend', () => envEl.classList.remove('env-wiggle'), { once: true });
          }, 700);
        }, { threshold: 0.5 }).observe(envEl);
      }
    })();

    /* ── NAV ────────────────────────────────────────────────────────── */
    function openEnvelope() {
      const stage  = document.getElementById('env-stage');
      const env    = document.getElementById('envelope');
      const reveal = document.getElementById('rsvp-reveal');
      if (!stage || stage.classList.contains('submitted')) return;

      if (stage.classList.contains('opened')) {
        // Close: collapse form (faster, no open-delay), then fold the flap back down
        reveal.style.transition = 'max-height 0.9s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease';
        reveal.classList.remove('open');
        setTimeout(() => { reveal.style.transition = ''; }, 950);
        setTimeout(() => {
          stage.classList.remove('opened');
          env.classList.remove('open');
          stage.setAttribute('aria-label', 'Open your invitation');
        }, 220);
        return;
      }

      stage.classList.add('opened');
      env.classList.add('open');
      stage.setAttribute('aria-label', 'Close your invitation');
      setTimeout(() => {
        reveal.classList.add('open');
        setTimeout(() => reveal.scrollIntoView({ behavior: 'smooth', block: 'start' }), 550);
      }, 760);
    }

    function toggleNav() {
      document.getElementById('navLinks').classList.toggle('open');
    }
    function closeNav() {
      document.getElementById('navLinks').classList.remove('open');
    }

    window.addEventListener('scroll', () => {
      const y = window.scrollY;

      // Nav background
      document.getElementById('nav').style.background = y > 60
        ? 'rgba(250,243,236,0.96)'
        : 'rgba(245,230,216,0.88)';

      // Scroll progress bar
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      document.getElementById('scroll-progress').style.width =
        totalScroll > 0 ? (y / totalScroll * 100) + '%' : '0%';

      // ── HERO: illustration fades 1→0.5, names float upward ──────────
      const heroEl = document.getElementById('hero');
      if (heroEl && y < heroEl.offsetHeight * 1.1) {
        const prog = Math.min(y / (heroEl.offsetHeight * 0.65), 1);
        const bgIllus = document.getElementById('heroBgIllus');
        if (bgIllus) bgIllus.style.opacity = (1 - prog * 0.52).toFixed(3);
        const names = document.getElementById('heroNames');
        if (names) names.style.transform = 'translateY(' + (-prog * 72) + 'px)';
      }
    }, { passive: true });


    /* ── JOURNEY SLIDESHOW DECK ─────────────────────────────────────── */
    (function () {
      const section  = document.getElementById('journey');
      const deck     = document.querySelector('.photo-deck');
      const photos   = Array.from(document.querySelectorAll('.deck-photo'));
      const shownEl  = document.getElementById('deck-shown');
      const hint     = document.getElementById('deck-hint');
      const leftBtn  = document.getElementById('deck-nav-left');
      const rightBtn = document.getElementById('deck-nav-right');
      if (!deck || !photos.length) return;

      const dismissed = [];
      let   drag      = null;
      let   ready     = false;

      function activeSorted() {
        return photos
          .filter(p => p.classList.contains('shown') && !p.dataset.dismissed)
          .sort((a, b) => (parseInt(b.style.zIndex) || 0) - (parseInt(a.style.zIndex) || 0));
      }

      function updateUI() {
        const active = activeSorted();
        photos.forEach(p => {
          const isTop = active[0] === p;
          p.classList.toggle('deck-top', isTop);
          if (p.classList.contains('shown')) p.style.pointerEvents = isTop ? '' : 'none';
        });
        deck.classList.toggle('swipeable', ready && active.length > 0);
        if (leftBtn)  leftBtn.disabled  = active.length <= 1;
        if (rightBtn) rightBtn.disabled = dismissed.length === 0;
        if (shownEl)  shownEl.textContent = dismissed.length + 1;
      }

      // Drop all photos in with stagger, then enable interaction
      function initDeck() {
        if (section.dataset.initialized) return;
        section.dataset.initialized = '1';

        photos.forEach((p, i) => {
          setTimeout(() => {
            p.classList.add('dropping');
            setTimeout(() => {
              p.classList.remove('dropping');
              p.classList.add('shown');
              if (i === photos.length - 1) {
                ready = true;
                updateUI();
                if (hint) hint.style.opacity = '1';
              }
            }, 1100);
          }, i * 70);
        });
      }

      // Trigger drop-in when section scrolls into view
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { initDeck(); observer.disconnect(); }
      }, { threshold: 0.15 });
      observer.observe(section);

      // ── dismiss: flies out ──────────────────────────────────────────
      function flyOut(el, dir = 'left') {
        el.dataset.dismissed = '1';
        dismissed.push({ el, dir });
        const sign    = dir === 'right' ? '+' : '-';
        const rotSign = dir === 'right' ? '+' : '-';
        el.style.transition    = 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s ease';
        el.style.transform     = `translate(calc(var(--px,0%) ${sign} 160%), var(--py,0%)) rotate(calc(var(--rot,0deg) ${rotSign} 12deg)) scale(0.92)`;
        el.style.opacity       = '0';
        el.style.pointerEvents = 'none';
        setTimeout(() => { el.style.transition = ''; updateUI(); }, 460);
      }

      // ── restore: flies back in from the direction it left ──────────
      function flyIn() {
        if (!dismissed.length) return;
        const { el, dir } = dismissed.pop();
        delete el.dataset.dismissed;
        const sign    = dir === 'right' ? '+' : '-';
        const rotSign = dir === 'right' ? '+' : '-';
        el.style.transition    = 'none';
        el.style.transform     = `translate(calc(var(--px,0%) ${sign} 160%), var(--py,0%)) rotate(calc(var(--rot,0deg) ${rotSign} 12deg)) scale(0.92)`;
        el.style.opacity       = '0';
        el.style.pointerEvents = '';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s ease';
          el.style.transform  = '';
          el.style.opacity    = '';
          updateUI();
          setTimeout(() => { el.style.transition = ''; }, 520);
        }));
      }

      function snapBack(el) {
        if (!el) return;
        el.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.25s ease';
        el.style.transform  = '';
        el.style.opacity    = '';
        setTimeout(() => { el.style.transition = ''; }, 360);
      }

      // ── drag ────────────────────────────────────────────────────────
      function startDrag(x) {
        if (!ready) return;
        const active = activeSorted();
        if (!active.length && !dismissed.length) return;
        if (!active.length) { drag = { startX: x, el: null }; deck.classList.add('swiping'); return; }
        const top = active[0];
        top.style.transition = 'none';
        drag = { startX: x, el: top };
        deck.classList.add('swiping');
      }

      function moveDrag(x) {
        if (!drag || !drag.el) return;
        const dx = x - drag.startX;
        if (dx < 0) {
          drag.el.style.transform = `translate(calc(var(--px,0%) + ${dx}px), var(--py,0%)) rotate(calc(var(--rot,0deg) + ${dx * 0.04}deg))`;
          drag.el.style.opacity   = String(Math.max(0.3, 1 - Math.abs(dx) / 220));
        } else {
          const d = Math.min(dx * 0.15, 18);
          drag.el.style.transform = `translate(calc(var(--px,0%) + ${d}px), var(--py,0%)) rotate(calc(var(--rot,0deg) + ${d * 0.02}deg))`;
          drag.el.style.opacity   = '';
        }
      }

      function endDrag(x) {
        if (!drag) return;
        const dx = x - drag.startX;
        const { el } = drag;
        drag = null;
        deck.classList.remove('swiping');
        if (dx <= -80) {
          if (el && activeSorted().length > 1) flyOut(el);
          else snapBack(el);
        } else if (dx >= 80) {
          snapBack(el);
          if (dismissed.length > 0) flyIn();
        } else {
          snapBack(el);
        }
      }

      // ── events ──────────────────────────────────────────────────────
      deck.addEventListener('touchstart',  e => { if (e.touches.length === 1) startDrag(e.touches[0].clientX); }, { passive: true });
      deck.addEventListener('touchmove',   e => { if (drag && e.touches.length === 1) moveDrag(e.touches[0].clientX); }, { passive: true });
      deck.addEventListener('touchend',    e => { if (drag) endDrag(e.changedTouches[0].clientX); });
      deck.addEventListener('pointerdown',  e => { if (e.pointerType === 'touch') return; startDrag(e.clientX); e.preventDefault(); });
      window.addEventListener('pointermove', e => { if (drag && e.pointerType !== 'touch') moveDrag(e.clientX); });
      window.addEventListener('pointerup',   e => { if (drag && e.pointerType !== 'touch') endDrag(e.clientX); });

      leftBtn?.addEventListener('click',  () => { const a = activeSorted(); if (a.length > 1) flyOut(a[0], 'left'); });
      rightBtn?.addEventListener('click', () => flyIn());

      document.addEventListener('langchange', updateUI);
    })();

    /* ── COUPLE CARD FLIP ───────────────────────────────────────────── */
    (function () {
      document.querySelectorAll('.couple-card').forEach(card => {
        const flipper = card.querySelector('.couple-flipper');
        const back    = card.querySelector('.couple-card-back');
        if (!flipper || !back) return;
        // Set height to whichever face is taller
        requestAnimationFrame(() => {
          const front = card.querySelector('.couple-card-front');
          back.style.transform   = 'none';
          back.style.position    = 'relative';
          back.style.visibility  = 'hidden';
          const backH  = back.scrollHeight;
          const frontH = front.scrollHeight;
          back.style.transform  = '';
          back.style.position   = '';
          back.style.visibility = '';
          flipper.style.minHeight = Math.max(backH, frontH, 380) + 'px';
        });
        card.addEventListener('click', () => card.classList.toggle('flipped'));
      });
    })();

    /* ── PLUS ONE TOGGLE ────────────────────────────────────────────── */
    function setPlusOne(val) {
      document.getElementById('btn-no').classList.toggle('active',  val === 'no');
      document.getElementById('btn-yes').classList.toggle('active', val === 'yes');
      document.getElementById('plusone-name-wrap').style.display = val === 'yes' ? 'block' : 'none';
    }

    /* ── RSVP SUBMIT ────────────────────────────────────────────────── */
    async function handleRSVP(e) {
      e.preventDefault();
      const form     = document.getElementById('rsvp-form');
      const nameInput = document.getElementById('rsvp-name');
      const emailInput = document.getElementById('rsvp-email');
      const sessionGrid = document.querySelector('.session-grid');
      const nameVal  = nameInput.value.trim();
      const emailVal = emailInput.value.trim();
      const session  = document.querySelector('input[name="session"]:checked');

      const nameInvalid = !nameVal;
      const emailInvalid = !emailVal || !emailInput.checkValidity();
      const sessionInvalid = !session;

      nameInput.classList.toggle('input-invalid', nameInvalid);
      emailInput.classList.toggle('input-invalid', emailInvalid);
      sessionGrid.classList.toggle('session-invalid', sessionInvalid);
      document.getElementById('name-error').classList.toggle('show', nameInvalid);
      document.getElementById('email-error').classList.toggle('show', emailInvalid);
      document.getElementById('session-error').classList.toggle('show', sessionInvalid);

      if (nameInvalid || emailInvalid || sessionInvalid) {
        (nameInvalid ? nameInput : emailInvalid ? emailInput : sessionGrid).scrollIntoView({ behavior: 'smooth', block: 'center' });
        (nameInvalid ? nameInput : emailInput).focus();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      const plusoneVal = document.getElementById('btn-yes').classList.contains('active') ? 'yes' : 'no';

      const payload = {
        name:        nameVal,
        email:       emailVal,
        phone:       ((document.getElementById('rsvp-phone-country')?.value || '+66') + ' ' + (document.getElementById('rsvp-phone')?.value || '').trim()).trim(),
        preferredName:(document.getElementById('rsvp-preferred-name')?.value || '').trim(),
        lineId:      (document.getElementById('rsvp-lineid')?.value || '').trim(),
        session:     session.value,
        dietary:     document.getElementById('rsvp-dietary')?.value || '',
        plusone:     plusoneVal,
        plusoneName: plusoneVal === 'yes' ? (document.getElementById('rsvp-plusone-name')?.value || '').trim() : '',
        notes:       (document.getElementById('rsvp-notes')?.value || '').trim(),
        blessing:    (document.getElementById('rsvp-blessing')?.value || '').trim(),
        lang:        currentLang
      };

      try {
        const res  = await fetch(APPS_SCRIPT_URL, {
          method:  'POST',
          body:    JSON.stringify(payload),
          headers: { 'Content-Type': 'text/plain' }
        });
        const data = await res.json();

        if (data.success) {
          // 1) fade the form out
          form.style.opacity = '0';
          form.style.transition = 'opacity 0.4s ease';
          setTimeout(() => {
            form.style.display = 'none';
            // 2) collapse the form reveal area
            const reveal = document.getElementById('rsvp-reveal');
            reveal.style.transition = 'max-height 0.75s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease';
            reveal.style.opacity = '0';
            reveal.style.maxHeight = '0';
            // 3) re-seal just the flap; keep 'opened' so the prompt stays hidden
            const env   = document.getElementById('envelope');
            const stage = document.getElementById('env-stage');
            env.classList.remove('open');
            stage.classList.add('submitted'); // blocks re-opening + disables hover
            // 4) after the flap finishes closing (~750ms), show success message
            setTimeout(() => {
              const envSuccess = document.getElementById('env-success');
              envSuccess.style.display = 'block';
              requestAnimationFrame(() => requestAnimationFrame(() => {
                envSuccess.classList.add('show');
              }));
              stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 850);
          }, 420);
        } else if (data.alreadyExists) {
          alert('This email has already been registered. Check your inbox for your personal edit link.');
          btn.disabled = false;
          btn.textContent = 'Confirm My RSVP';
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
          btn.disabled = false;
          btn.textContent = 'Confirm My RSVP';
        }
      } catch (err) {
        alert('Could not reach the server. Please try again in a moment, or contact Nine & Tom directly if this keeps happening.');
        btn.disabled = false;
        btn.textContent = 'Confirm My RSVP';
      }
    }
  const T = window.WEDDING_TRANSLATIONS || {};

    let currentLang = localStorage.getItem('wedding-lang') || 'en';


    ['rsvp-name', 'rsvp-email'].forEach((id) => {
      const input = document.getElementById(id);
      input?.addEventListener('input', () => {
        input.classList.remove('input-invalid');
        document.getElementById(id === 'rsvp-name' ? 'name-error' : 'email-error')?.classList.remove('show');
      });
    });
    document.querySelectorAll('input[name="session"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        document.querySelector('.session-grid')?.classList.remove('session-invalid');
        document.getElementById('session-error')?.classList.remove('show');
      });
    });

    function setLang(lang) {
      currentLang = lang;
      localStorage.setItem('wedding-lang', lang);

      // Swap text content
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (T[lang][key] !== undefined) el.innerHTML = T[lang][key];
      });

      // Swap placeholder attributes
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (T[lang][key] !== undefined) el.placeholder = T[lang][key];
      });

      // Swap select option text
      document.querySelectorAll('[data-i18n-opt]').forEach(el => {
        const key = el.getAttribute('data-i18n-opt');
        if (T[lang][key] !== undefined) el.textContent = T[lang][key];
      });

      // Toggle active state on lang buttons
      document.querySelectorAll('.lang-btn[data-lang="en"]').forEach(b => b.classList.toggle('active', lang === 'en'));
      document.querySelectorAll('.lang-btn[data-lang="th"]').forEach(b => b.classList.toggle('active', lang === 'th'));

      // Toggle Thai font class on body
      document.body.classList.toggle('lang-th', lang === 'th');

      // Update html lang attribute
      document.documentElement.lang = lang === 'th' ? 'th' : 'en';

      // Notify dynamic components that read lang independently (e.g. swipe hint)
      document.dispatchEvent(new Event('langchange'));
    }

    // Init on load
    setLang(currentLang);
