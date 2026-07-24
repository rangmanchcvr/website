document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Lenis smooth scroll
  --------------------------------------------------------- */
  let lenis;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.lenis = lenis; // Expose globally for specular button
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const target = this.getAttribute('href');
        if (target && target !== '#') {
          e.preventDefault();
          lenis.scrollTo(target);
        }
      });
    });
  } else {
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  /* ---------------------------------------------------------
     Curtain intro
  --------------------------------------------------------- */
  const curtain = document.getElementById('curtainIntro');
  const tlIntro = gsap.timeline({ delay: .2 });
  tlIntro
    .to('.curtain-mark', { opacity: 1, duration: .5 })
    .to('.curtain-mark', { opacity: 0, duration: .4, delay: .6 })
    .to('.curtain-left', { xPercent: -100, duration: 1.1, ease: 'power3.inOut' }, '-=.1')
    .to('.curtain-right', { xPercent: 100, duration: 1.1, ease: 'power3.inOut' }, '<')
    .set(curtain, { display: 'none' })
    .add(heroIntro(), '-=.6');

  function heroIntro() {
    const tl = gsap.timeline();
    tl.call(() => {
      if (window.startRangmanchAnimation) window.startRangmanchAnimation();
    })
      .to('[data-reveal]', {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .15
      }, '-=.6')
      .fromTo('.hero-img', { scale: 1.15 }, { scale: 1.02, duration: 6, ease: 'power1.out' }, '-=1.2');
    return tl;
  }

  /* ---------------------------------------------------------
     Custom cursor / spotlight (Removed)
  --------------------------------------------------------- */

  /* ---------------------------------------------------------
     Dust particles (hero)
  --------------------------------------------------------- */
  const dustWrap = document.getElementById('dustParticles');
  if (dustWrap && !reduceMotion) {
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('span');
      const left = Math.random() * 100;
      const delay = Math.random() * 12;
      const dur = 10 + Math.random() * 14;
      const size = (1 + Math.random() * 2.2).toFixed(1);
      const opacity = (0.15 + Math.random() * 0.35).toFixed(2);
      p.style.left = left + '%';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.opacity = opacity;
      p.style.animationDelay = delay + 's';
      p.style.animationDuration = dur + 's';
      dustWrap.appendChild(p);
    }
  }

  /* ---------------------------------------------------------
     Header scroll state + mobile nav
  --------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  ScrollTrigger.create({
    start: 60, end: 99999,
    onUpdate: (self) => header.classList.toggle('scrolled', self.scroll() > 60)
  });

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------------------------------------------------------
     Hero parallax on scroll
  --------------------------------------------------------- */
  gsap.to('.hero-img', {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ---------------------------------------------------------
     About reveal + stat counters
  --------------------------------------------------------- */
  gsap.from('.about-copy > *', {
    opacity: 0, y: 30, duration: .9, stagger: .12, ease: 'power2.out',
    scrollTrigger: { trigger: '.about-copy', start: 'top 78%' }
  });
  gsap.from('.about-visual', {
    opacity: 0, x: 40, duration: 1, ease: 'power2.out',
    scrollTrigger: { trigger: '.about-visual', start: 'top 80%' }
  });

  document.querySelectorAll('.stat').forEach(stat => {
    const target = +stat.dataset.count;
    const numEl = stat.querySelector('.stat-num');
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: stat, start: 'top 85%', once: true,
      onEnter: () => gsap.to(obj, {
        val: target, duration: 1.6, ease: 'power2.out',
        onUpdate: () => numEl.textContent = Math.floor(obj.val)
      })
    });
  });

  /* ---------------------------------------------------------
     Legacy reel: drag-to-scroll + click to expand
  --------------------------------------------------------- */
  const reel = document.getElementById('reelTrack');
  if (reel) {
    let isDown = false, startX, scrollLeft;
    reel.addEventListener('mousedown', (e) => {
      isDown = true; reel.classList.add('dragging');
      startX = e.pageX - reel.offsetLeft; scrollLeft = reel.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach(evt => reel.addEventListener(evt, () => { isDown = false; reel.classList.remove('dragging'); }));
    reel.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - reel.offsetLeft;
      reel.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });

    document.querySelectorAll('.frame').forEach(frame => {
      frame.addEventListener('click', (e) => {
        if (isDown) return;
        const wasOpen = frame.classList.contains('open');
        document.querySelectorAll('.frame.open').forEach(f => f.classList.remove('open'));
        if (!wasOpen) frame.classList.add('open');
      });
    });

    gsap.from('.frame', {
      opacity: 0, y: 40, duration: .8, stagger: .1, ease: 'power2.out',
      scrollTrigger: { trigger: '.reel-wrap', start: 'top 80%' }
    });
  }

  /* ---------------------------------------------------------
     Productions 3D Cylinder Carousel
  --------------------------------------------------------- */

  const lightbox = document.getElementById('lightbox');
  const lightboxInner = document.getElementById('lightboxInner');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  let lbMode = null; // 'prod' | 'gallery'
  let lbIndex = 0;
  const prodIds = ['prod-5', 'prod-6'];
  const galleryImgs = Array.from(document.querySelectorAll('.masonry img'));

  function openLightbox() {
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
  function renderProd(id) {
    const data = document.getElementById(id).dataset;
    lightboxInner.innerHTML = `
      <div class="lb-prod">
        <div class="lb-prod-media">
          <img src="${data.img1}" alt="${data.title} production still">
          <img src="${data.img2}" alt="${data.title} production still">
        </div>
        <div class="lb-prod-body">
          <span class="lb-genre">${data.genre}</span>
          <h3>${data.title}</h3>
          <div class="lb-row"><strong>Cast</strong><span>${data.cast}</span></div>
          <div class="lb-row"><strong>Director</strong><span>${data.director}</span></div>
          <div class="lb-row"><strong>Event</strong><span>${data.event}, ${data.year}</span></div>
          <div class="lb-row"><strong>Awards</strong><span>${data.awards}</span></div>
          <p class="lb-desc">${data.desc}</p>
        </div>
      </div>`;
  }
  function renderGallery(src, alt) {
    lightboxInner.innerHTML = `<img class="lb-gallery-img" src="${src}" alt="${alt}">`;
  }

  // Attach lightbox events dynamically since cards are rendered via JS
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.prod-card');
    if (card && card.dataset.modal) {
      window.openLightboxForPerf(card.dataset.modal);
    }
  });

  window.openLightboxForPerf = function(id) {
    lbMode = 'prod';
    const perf = PERFORMANCES.find(p => p.id === id);
    if (perf) {
        lightboxInner.innerHTML = `
          <div class="lb-prod">
            <img src="${perf.img}" alt="${perf.alt}">
            <div class="lb-prod-info">
              <h2>${perf.title}</h2>
              <p>${perf.genre} &middot; ${perf.meta}</p>
            </div>
          </div>
        `;
        openLightbox();
      }
  };

  galleryImgs.forEach((img, i) => {
    img.addEventListener('click', () => {
      lbMode = 'gallery';
      lbIndex = i;
      renderGallery(img.src, img.alt);
      openLightbox();
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') lightboxNext.click();
    if (e.key === 'ArrowLeft') lightboxPrev.click();
  });
  lightboxNext.addEventListener('click', () => {
    if (lbMode === 'prod') { lbIndex = (lbIndex + 1) % prodIds.length; renderProd(prodIds[lbIndex]); }
    else if (lbMode === 'gallery') { lbIndex = (lbIndex + 1) % galleryImgs.length; renderGallery(galleryImgs[lbIndex].src, galleryImgs[lbIndex].alt); }
  });
  lightboxPrev.addEventListener('click', () => {
    if (lbMode === 'prod') { lbIndex = (lbIndex - 1 + prodIds.length) % prodIds.length; renderProd(prodIds[lbIndex]); }
    else if (lbMode === 'gallery') { lbIndex = (lbIndex - 1 + galleryImgs.length) % galleryImgs.length; renderGallery(galleryImgs[lbIndex].src, galleryImgs[lbIndex].alt); }
  });

  /* ---------------------------------------------------------
     Awards stagger reveal
  --------------------------------------------------------- */
  gsap.to('.award-card', {
    opacity: 1, y: 0, duration: .7, stagger: .08, ease: 'power2.out',
    scrollTrigger: { trigger: '.awards-grid', start: 'top 82%' }
  });

  /* ---------------------------------------------------------
     Mentor portrait mouse parallax
  --------------------------------------------------------- */
  const mentorPortrait = document.getElementById('mentorPortrait');
  if (mentorPortrait && window.matchMedia('(min-width: 861px)').matches) {
    mentorPortrait.addEventListener('mousemove', (e) => {
      const rect = mentorPortrait.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      gsap.to(mentorPortrait, { rotateY: x * 8, rotateX: -y * 8, duration: .6, ease: 'power2.out', transformPerspective: 800 });
    });
    mentorPortrait.addEventListener('mouseleave', () => {
      gsap.to(mentorPortrait, { rotateY: 0, rotateX: 0, duration: .6 });
    });
  }
  gsap.from('.mentor-grid > *', {
    opacity: 0, y: 40, duration: 1, stagger: .2, ease: 'power2.out',
    scrollTrigger: { trigger: '.mentor', start: 'top 70%' }
  });

  /* ---------------------------------------------------------
     Team rails: drag-to-scroll (desktop) / native swipe (mobile)
  --------------------------------------------------------- */
  document.querySelectorAll('.member-rail').forEach(rail => {
    let down = false, sx, sl;
    rail.addEventListener('mousedown', (e) => { down = true; rail.classList.add('dragging'); sx = e.pageX - rail.offsetLeft; sl = rail.scrollLeft; });
    ['mouseleave', 'mouseup'].forEach(evt => rail.addEventListener(evt, () => { down = false; rail.classList.remove('dragging'); }));
    rail.addEventListener('mousemove', (e) => {
      if (!down) return;
      e.preventDefault();
      const x = e.pageX - rail.offsetLeft;
      rail.scrollLeft = sl - (x - sx) * 1.3;
    });
  });

  gsap.utils.toArray('.batch-block').forEach(block => {
    gsap.from(block.querySelectorAll('.member-card'), {
      opacity: 0, duration: .6, ease: 'power2.out',
      scrollTrigger: { trigger: block, start: 'top 85%' }
    });
  });

  /* ---------------------------------------------------------
     Join section: cursor spotlight follow
  --------------------------------------------------------- */
  const joinSection = document.getElementById('join');
  const joinSpotlight = document.getElementById('joinSpotlight');
  if (joinSection && window.matchMedia('(min-width: 861px)').matches) {
    joinSection.addEventListener('mousemove', (e) => {
      const rect = joinSection.getBoundingClientRect();
      gsap.to(joinSpotlight, { left: e.clientX - rect.left, top: e.clientY - rect.top, duration: .3 });
    });
  }
  gsap.from('.join-title, .join-why, .join-skills, .join-cta-block', {
    opacity: 0, y: 30, duration: .9, stagger: .12, ease: 'power2.out',
    scrollTrigger: { trigger: '.join', start: 'top 75%' }
  });

  /* ---------------------------------------------------------
     Social cards reveal
  --------------------------------------------------------- */
  gsap.from('.social-card', {
    opacity: 0, duration: .6, ease: 'power2.out',
    scrollTrigger: { trigger: '.social-grid', start: 'top 85%' }
  });

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Section-level "curtain wipe" transition (Act markers)
  --------------------------------------------------------- */
  gsap.utils.toArray('.act-tag').forEach(tag => {
    gsap.from(tag, {
      opacity: 0, x: -20, duration: .7, ease: 'power2.out',
      scrollTrigger: { trigger: tag, start: 'top 88%' }
    });
  });
  /* ---------------------------------------------------------
     Join Modal Logic
  --------------------------------------------------------- */
  const joinTriggers = document.querySelectorAll('.join-trigger');
  const joinModalOverlay = document.getElementById('joinModalOverlay');
  const joinModalClose = document.getElementById('joinModalClose');

  if (joinModalOverlay && joinTriggers.length > 0) {
    joinTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent jump to top
        joinModalOverlay.classList.add('active');
      });
    });

    joinModalClose.addEventListener('click', () => {
      joinModalOverlay.classList.remove('active');
    });

    joinModalOverlay.addEventListener('click', (e) => {
      if (e.target === joinModalOverlay) {
        joinModalOverlay.classList.remove('active');
      }
    });
  }

  /* ---------------------------------------------------------
     Tilted Card Effect for Mentor Portrait
  --------------------------------------------------------- */
  const tiltedFigure = document.querySelector('.tilted-card-figure');
  const tiltedInner = document.querySelector('.tilted-card-inner');
  const tiltedCaption = document.querySelector('.tilted-card-caption');

  if (tiltedFigure && tiltedInner) {
    tiltedFigure.addEventListener('mousemove', (e) => {
      const rect = tiltedFigure.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const rotateX = ((y / rect.height) - 0.5) * -20;
      const rotateY = ((x / rect.width) - 0.5) * 20;

      gsap.to(tiltedInner, { 
        rotateX: rotateX, 
        rotateY: rotateY, 
        duration: 0.3, 
        ease: 'power2.out' 
      });

      if (tiltedCaption) {
        gsap.to(tiltedCaption, {
          x: x,
          y: y,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });

    tiltedFigure.addEventListener('mouseleave', () => {
      gsap.to(tiltedInner, { 
        rotateX: 0, 
        rotateY: 0, 
        duration: 0.5, 
        ease: 'power2.out' 
      });

      if (tiltedCaption) {
        gsap.to(tiltedCaption, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
      }
    });
  }

  /* ---------------------------------------------------------
     Team Batch Scroll Arrows
  --------------------------------------------------------- */
  document.querySelectorAll('.batch-block').forEach(block => {
    const rail = block.querySelector('.member-rail');
    const btnLeft = block.querySelector('.btn-left');
    const btnRight = block.querySelector('.btn-right');
    
    if (rail && btnLeft && btnRight) {
      const getScrollAmount = () => {
        const cards = rail.querySelectorAll('.member-card');
        if (cards.length > 0) {
          const cardWidth = cards[0].offsetWidth;
          const gap = parseFloat(window.getComputedStyle(rail).gap) || 20.8;
          const multiplier = window.innerWidth < 768 ? 1 : 2;
          return (cardWidth + gap) * multiplier;
        }
        return window.innerWidth < 768 ? 210 : 420;
      };

      // Event listeners are handled via inline onclick attributes in index.html to guarantee functionality.
    }
  });

});

