/* ============================================================
   PERFORMANCES CAROUSEL — Focus / Coverflow View
   Bounded scroll, horizontal wheel, touch, keyboard, click
   ============================================================ */
(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  const liveRegion = document.querySelector('.carousel-live');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');

  if (!track || typeof PERFORMANCES === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const data = PERFORMANCES;
  const total = data.length;
  let activeIndex = 0;
  let isAnimating = false;

  /* ---------------------------------------------------------
     Render cards + dots
  --------------------------------------------------------- */
  data.forEach((perf, i) => {
    const card = document.createElement('article');
    card.className = 'carousel-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${i + 1} of ${total}: ${perf.title}`);
    card.dataset.index = i;
    card.innerHTML = `
      <div class="carousel-card-media">
        <img src="${perf.img}" alt="${perf.alt}" loading="lazy">
      </div>
      <div class="carousel-card-body">
        <span class="prod-genre">${perf.genre}</span>
        <h3>${perf.title}</h3>
        <p class="prod-meta">${perf.meta}</p>
      </div>`;
    track.appendChild(card);

    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to performance ${i + 1}: ${perf.title}`);
    dot.dataset.index = i;
    dotsWrap.appendChild(dot);
  });

  const cards = Array.from(track.querySelectorAll('.carousel-card'));
  const dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));

  /* ---------------------------------------------------------
     Layout helpers
  --------------------------------------------------------- */
  function getCardWidth() {
    return window.innerWidth <= 640 ? 300 : 432;
  }

  function getGap() {
    return window.innerWidth <= 640 ? 16 : 24;
  }

  function isMobile() {
    return window.innerWidth <= 640;
  }

  /* ---------------------------------------------------------
     Position & style all cards from current activeIndex
  --------------------------------------------------------- */
  function layoutCards() {
    const cardW = getCardWidth();
    const gap = getGap();
    const step = cardW + gap;
    const mobile = isMobile();
    // Allow seeing a bit more cards depending on screen size
    const maxVisible = mobile ? 1 : Math.ceil((window.innerWidth / step) / 2) + 1;

    cards.forEach((card, i) => {
      const dist = i - activeIndex; // direct linear distance (no wrap)
      const absDist = Math.abs(dist);

      // Hide cards that are too far away
      const visible = absDist <= maxVisible + 1;

      const offsetX = dist * step;
      const scale = Math.max(0.7, 1 - absDist * 0.17);
      const opa = Math.max(0.4, 1 - absDist * 0.28);
      const blur = reduceMotion ? 0 : Math.min(8, absDist * 3);

      if (reduceMotion) {
        card.style.transform = `translate(-50%, -50%) translateX(${offsetX}px)`;
      } else {
        card.style.transform = `translate(-50%, -50%) translateX(${offsetX}px) scale(${scale})`;
      }

      if (absDist === 0) {
        // Active card
        card.classList.add('active');
        card.style.opacity = 1;
        card.style.filter = 'none';
        card.style.zIndex = 10;
        if (!reduceMotion) {
          card.style.transform = 'translate(-50%, -50%) translateX(0px) scale(1)';
        } else {
          card.style.transform = 'translate(-50%, -50%) translateX(0px)';
        }
      } else {
        card.classList.remove('active');
        card.style.opacity = visible ? opa : 0;
        card.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
        card.style.zIndex = 10 - absDist;
      }

      card.style.pointerEvents = visible ? 'auto' : 'none';
    });

    // Dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
      dot.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });

    // Update buttons state
    if (prevBtn) {
      prevBtn.style.opacity = activeIndex === 0 ? '0.3' : '1';
      prevBtn.style.pointerEvents = activeIndex === 0 ? 'none' : 'auto';
    }
    if (nextBtn) {
      nextBtn.style.opacity = activeIndex === total - 1 ? '0.3' : '1';
      nextBtn.style.pointerEvents = activeIndex === total - 1 ? 'none' : 'auto';
    }

    // Announce
    if (liveRegion) {
      liveRegion.textContent = `Card ${activeIndex + 1} of ${total} — ${data[activeIndex].title}`;
    }
  }

  /* ---------------------------------------------------------
     Navigate — Bounded
  --------------------------------------------------------- */
  function goTo(index) {
    if (isAnimating) return;
    // Bounded navigation
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    
    if (index === activeIndex) return;

    isAnimating = true;
    activeIndex = index;
    layoutCards();
    setTimeout(() => { isAnimating = false; }, 480);
  }

  function goNext() { goTo(activeIndex + 1); }
  function goPrev() { goTo(activeIndex - 1); }

  /* ---------------------------------------------------------
     Click events: arrows, dots, cards
  --------------------------------------------------------- */
  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  dotsWrap.addEventListener('click', (e) => {
    const dot = e.target.closest('.carousel-dot');
    if (dot) goTo(parseInt(dot.dataset.index, 10));
  });

  track.addEventListener('click', (e) => {
    const card = e.target.closest('.carousel-card');
    if (card) {
      const idx = parseInt(card.dataset.index, 10);
      if (idx !== activeIndex) goTo(idx);
    }
  });

  /* ---------------------------------------------------------
     Keyboard navigation
  --------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
      e.preventDefault();
      goNext();
    }
    if (e.key === 'ArrowLeft' || e.key === 'Left') {
      e.preventDefault();
      goPrev();
    }
  });

  /* ---------------------------------------------------------
     Horizontal scroll / wheel — scroll through multiple cards
     Accumulates deltaX and triggers next/prev at thresholds
  --------------------------------------------------------- */
  let wheelAccum = 0;
  const WHEEL_THRESHOLD = 60;
  let wheelTimer = null;

  function handleWheel(e) {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    e.preventDefault();

    wheelAccum += delta;

    while (wheelAccum >= WHEEL_THRESHOLD) {
      wheelAccum -= WHEEL_THRESHOLD;
      goNext();
    }
    while (wheelAccum <= -WHEEL_THRESHOLD) {
      wheelAccum += WHEEL_THRESHOLD;
      goPrev();
    }

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelAccum = 0; }, 200);
  }

  const region = document.querySelector('.carousel-region');
  if (region) {
    region.addEventListener('wheel', handleWheel, { passive: false });
  }

  /* ---------------------------------------------------------
     Touch / swipe support — continuous multi-card swiping
  --------------------------------------------------------- */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let isSwiping = false;
  let swipedCards = 0;
  const SWIPE_CARD_THRESHOLD = 60;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
    isSwiping = false;
    swipedCards = 0;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping = true;
    }

    if (!isSwiping) return;

    touchDeltaX = dx;

    const cardsMoved = Math.floor(Math.abs(touchDeltaX) / SWIPE_CARD_THRESHOLD);
    if (cardsMoved > swipedCards) {
      const diff = cardsMoved - swipedCards;
      for (let i = 0; i < diff; i++) {
        if (touchDeltaX < 0) goNext();
        else goPrev();
      }
      swipedCards = cardsMoved;
    }
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (isSwiping && swipedCards === 0 && Math.abs(touchDeltaX) > 40) {
      if (touchDeltaX < 0) goNext();
      else goPrev();
    }
    isSwiping = false;
    swipedCards = 0;
  }, { passive: true });

  /* ---------------------------------------------------------
     Resize handler
  --------------------------------------------------------- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cards.forEach(c => c.style.transition = 'none');
      layoutCards();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cards.forEach(c => c.style.transition = '');
        });
      });
      handleMobileArrows();
    }, 100);
  });

  /* ---------------------------------------------------------
     Mobile layout: move arrows below carousel
  --------------------------------------------------------- */
  function handleMobileArrows() {
    const mobile = isMobile();
    const existing = document.querySelector('.carousel-controls-mobile');

    if (mobile && !existing && prevBtn && nextBtn) {
      const wrapper = document.createElement('div');
      wrapper.className = 'carousel-controls-mobile';
      wrapper.appendChild(prevBtn);
      wrapper.appendChild(nextBtn);
      const regionEl = document.querySelector('.carousel-region');
      regionEl.insertBefore(wrapper, dotsWrap);
    } else if (!mobile && existing) {
      const regionEl = document.querySelector('.carousel-region');
      const viewport = document.querySelector('.carousel-viewport');
      regionEl.insertBefore(prevBtn, viewport);
      regionEl.insertBefore(nextBtn, viewport.nextSibling);
      existing.remove();
    }
  }

  handleMobileArrows();

  /* ---------------------------------------------------------
     Initial layout
  --------------------------------------------------------- */
  layoutCards();
})();
