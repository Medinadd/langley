// Langley — shared interactions
(function () {
  // Sticky nav shadow
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Burger
  const burger = document.getElementById('nav-burger');
  const panel  = document.getElementById('nav-panel');
  if (burger && panel) {
    function setMenu(open) {
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('no-scroll', open);
    }
    burger.addEventListener('click', () => setMenu(!burger.classList.contains('open')));
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  // Smooth-scroll for in-page anchors only
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // Reveal-on-scroll (one-time)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Trial form
  const form    = document.getElementById('trial-form');
  const success = document.getElementById('form-success');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const name    = (fd.get('name')    || '').toString().trim();
      const contact = (fd.get('contact') || '').toString().trim();
      const course  = (fd.get('course')  || '').toString().trim();
      const target  = (fd.get('target')  || '').toString().trim();
      if (!name || !contact || !course) {
        form.querySelectorAll('[required]').forEach(el => {
          if (!el.value) el.classList.add('invalid'); else el.classList.remove('invalid');
        });
        return;
      }
      const subject = `Заявка с сайта Langley — ${name}`;
      const body = [
        `Имя: ${name}`,
        `Контакт: ${contact}`,
        `Направление: ${course}`,
        `Цель: ${target || '—'}`,
        ``,
        `Источник: langley landing`,
      ].join('\n');
      window.location.href = `mailto:medinakasen@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      form.reset();
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
})();
