# 3D Smooth Scroll Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current flat building image hero into a 3D perspective smooth-scroll hero with depth, parallax layers, and CSS 3D transforms that respond to scroll position.

**Architecture:** The building image will be placed in a 3D perspective container using CSS `perspective` and `transform-style: preserve-3d`. As the user scrolls, the building will rotate and translate in 3D space (tilting, zooming, shifting depth). Text slides will have their own parallax depth layers creating a layered, immersive feel. All animation is driven by `requestAnimationFrame` + scroll position for 60fps smoothness (no CSS transitions on scroll).

**Tech Stack:** Vanilla CSS 3D transforms (`perspective`, `rotateX/Y`, `translateZ`), vanilla JS scroll listener with `requestAnimationFrame`, no external libraries.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `style.css` (lines 1889–2074) | Modify | Replace flat hero CSS with 3D perspective container, parallax depth layers, smooth transitions |
| `index.html` (lines 41–79) | Modify | Restructure hero markup — wrap in 3D perspective container, add depth layers to slides |
| `script.js` (lines 157–220) | Modify | Replace current scroll handler with rAF-driven 3D transform calculator |

---

### Task 1: Add 3D Perspective Wrapper to HTML

**Files:**
- Modify: `index.html:41-79`

- [ ] **Step 1: Restructure the hero HTML with a 3D scene wrapper**

Replace the current building container and content scroller (lines 41–79) with this structure:

```html
<!-- 3D HERO SCENE -->
<div class="hero-scene" id="hero-scene">
  <div class="hero-3d-container">
    <!-- Background depth layer: the building -->
    <div class="hero-layer hero-layer--building">
      <img src="images/cladire.png" id="hero-img" alt="Înființare Firmă">
    </div>

    <!-- Foreground depth layer: text content -->
    <div class="hero-layer hero-layer--content">
      <div class="content-scroller">
        <section class="hero-slide" id="slide-1">
          <h1>ÎNFIINȚARE <span class="gold">FIRMĂ</span> ONLINE</h1>
        </section>
        <section class="hero-slide" id="slide-2">
          <h1>SRL. SRL-D. PFA.</h1>
        </section>
        <section class="hero-slide" id="slide-3">
          <p class="sub-text">DOSAR COMPLET ÎN 5 MINUTE.</p>
        </section>
        <section class="hero-slide" id="slide-4">
          <a href="#app" class="btn-pill">GENEREAZĂ DOSAR ↗</a>
        </section>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verify page loads without errors**

Open the site in a browser. The hero will look broken (no 3D CSS yet) but there should be no JS console errors. The building image and text slides should still render.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "refactor: restructure hero HTML with 3D scene wrapper"
```

---

### Task 2: Replace Hero CSS with 3D Perspective Styles

**Files:**
- Modify: `style.css:1889-2074`

- [ ] **Step 1: Replace the hero CSS block**

Replace everything from `/* ═══ HERO — CLĂDIRE FIXĂ + SCROLL STORYTELLING ═══ */` through the end of the mobile hero media query (line 2074) with the following:

```css
/* ═══════════════════════════════════════════════════════════
   HERO — 3D SMOOTH SCROLL
═══════════════════════════════════════════════════════════ */

/* 1. SCENE — the 3D viewport */
.hero-scene {
  position: relative;
  z-index: 1;
  perspective: 1200px;
  perspective-origin: 50% 40%;
  overflow: hidden;
}

/* 2. 3D CONTAINER — preserves child depth */
.hero-3d-container {
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
}

/* 3. LAYERS */
.hero-layer {
  position: relative;
  width: 100%;
}

/* Building layer — fixed behind content, in 3D depth */
.hero-layer--building {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  pointer-events: none;
  background-color: var(--bg);
  will-change: transform, opacity;
  transform: translateZ(0px);
}

#hero-img {
  height: 100vh;
  object-fit: contain;
  mix-blend-mode: multiply;
  opacity: 0.9;
  will-change: transform;
  transform-origin: center center;
  transform: scale(1) rotateX(0deg) rotateY(0deg);
  transition: none; /* JS drives this — no CSS transition on scroll */
}

/* Content layer — scrolls over building */
.hero-layer--content {
  position: relative;
  z-index: 10;
}

/* 4. SCROLLER */
.content-scroller {
  position: relative;
  z-index: 10;
}

/* 5. SLIDES */
.hero-slide {
  min-height: 55vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 8%;
  opacity: 0;
  transform: translateY(30px) translateZ(0);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

#slide-1 {
  min-height: 80vh;
  padding-top: 80px;
}

#slide-2 {
  min-height: 45vh;
}

#slide-3 {
  min-height: 40vh;
}

#slide-4 {
  min-height: 35vh;
  padding-bottom: 3rem;
}

.hero-slide.visible {
  opacity: 1;
  transform: translateY(0) translateZ(0);
}

/* 6. TIPOGRAFIE HERO */
.hero-slide h1 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: clamp(2.8rem, 9vw, 6rem);
  line-height: 0.92;
  text-transform: uppercase;
  letter-spacing: -3px;
  color: var(--ink);
  text-shadow: 0 0 60px var(--bg), 0 0 30px var(--bg), 0 0 10px var(--bg);
}

.gold {
  color: #b89b5e !important;
}

#slide-3 .sub-text {
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: clamp(0.9rem, 2.2vw, 1.35rem);
  color: var(--ink);
  background: rgba(245, 243, 239, 0.92);
  padding: 12px 28px;
  border-radius: 4px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid var(--border);
}

/* 7. BUTONUL CTA */
.btn-pill {
  background: var(--ink) !important;
  color: #fff !important;
  border-radius: 50px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  padding: 1.1rem 3rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  display: inline-block;
  margin-top: 1rem;
  transition: background 0.2s, transform 0.15s !important;
  border: 2px solid var(--ink) !important;
}

.btn-pill:hover {
  background: transparent !important;
  color: var(--ink) !important;
  transform: translateY(-2px);
}

.navbar .btn-primary-small {
  background: var(--ink) !important;
  color: #fff !important;
  border-radius: 50px;
  padding: 0.55rem 1.2rem;
  font-size: 0.78rem;
}

/* ═══════════════════════════════════════════════════════════
   MOBIL — 3D HERO
═══════════════════════════════════════════════════════════ */
@media (max-width: 768px) {

  .hero-scene {
    perspective: 800px;
  }

  #hero-img {
    height: 65vh;
    opacity: 0.6;
  }

  .hero-slide {
    min-height: 42vh;
    padding: 0 1.2rem;
  }

  #slide-1 {
    min-height: 65vh;
    padding-top: 90px;
    justify-content: flex-start;
  }

  #slide-2 {
    min-height: 38vh;
  }

  #slide-3 {
    min-height: 35vh;
  }

  #slide-4 {
    min-height: 30vh;
  }

  .hero-slide h1 {
    font-size: clamp(2rem, 11vw, 3rem);
    letter-spacing: -1px;
    line-height: 0.95;
  }

  #slide-3 .sub-text {
    font-size: 0.82rem;
    padding: 10px 18px;
    letter-spacing: 0.08em;
  }

  .btn-pill {
    padding: 0.9rem 2rem;
    font-size: 0.82rem;
  }
}
```

- [ ] **Step 2: Verify in browser**

Open the site. The building should be visible and centered. Text slides should appear on scroll. The 3D transforms won't be animated yet (that's the JS task), but the layout should be correct and the building should be behind the text.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add 3D perspective CSS for hero section"
```

---

### Task 3: Implement rAF-Driven 3D Scroll Animation in JS

**Files:**
- Modify: `script.js:157-220`

- [ ] **Step 1: Replace the scroll hero JS block**

Find the comment `// ── SCROLL HERO — slide per scroll + zoom clădire ──────` (line 157) and replace everything from there through line 220 (the closing `}` of `if (heroImgEl)` and the duplicate heroObserver block) with this:

```javascript
    // ── 3D SMOOTH SCROLL HERO ──────────────────────────────────
    const heroImgEl = document.getElementById('hero-img');
    const buildingContainerEl = document.querySelector('.hero-layer--building');
    const slides = document.querySelectorAll('.hero-slide');

    // Intersection Observer - fiecare slide apare când intră în viewport
    if (slides.length) {
        const slideObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.4 });

        slides.forEach(slide => slideObserver.observe(slide));
    }

    // 3D scroll animation with requestAnimationFrame
    if (heroImgEl) {
        const totalHeroHeight = window.innerHeight + (slides.length - 1) * (window.innerHeight * 0.5);
        let currentScroll = 0;
        let targetScroll = 0;
        let rafId = null;
        const lerp = (start, end, factor) => start + (end - start) * factor;

        // Smooth interpolation factor (lower = smoother/slower, higher = snappier)
        const smoothFactor = 0.08;

        window.addEventListener('scroll', () => {
            targetScroll = window.scrollY;
            if (!rafId) {
                rafId = requestAnimationFrame(animateHero);
            }
        }, { passive: true });

        function animateHero() {
            // Lerp toward target for buttery smoothness
            currentScroll = lerp(currentScroll, targetScroll, smoothFactor);

            // Stop animating when close enough (avoid infinite loop)
            if (Math.abs(currentScroll - targetScroll) < 0.5) {
                currentScroll = targetScroll;
                rafId = null;
            } else {
                rafId = requestAnimationFrame(animateHero);
            }

            // Progress through hero section (0 → 1)
            const progress = Math.min(currentScroll / totalHeroHeight, 1);

            // ── Building 3D transforms ──
            // Scale: 1.0 → 1.35 (zoom in as you scroll)
            const scale = 1 + progress * 0.35;

            // RotateX: 0° → -6° (subtle tilt forward, like looking down at building)
            const rotateX = progress * -6;

            // RotateY: 0° → 3° (very subtle side rotation)
            const rotateY = progress * 3;

            // TranslateZ: 0 → 80px (push toward viewer)
            const translateZ = progress * 80;

            // TranslateY: 0 → -30px (slight upward drift)
            const translateY = progress * -30;

            heroImgEl.style.transform =
                `scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) translateY(${translateY}px)`;

            // ── Fade out building after hero ──
            if (buildingContainerEl) {
                const fadeOutStart = totalHeroHeight * 0.75;
                const fadeOutEnd = totalHeroHeight * 1.05;

                let opacity = 1;
                if (currentScroll > fadeOutStart) {
                    opacity = Math.max(0, 1 - (currentScroll - fadeOutStart) / (fadeOutEnd - fadeOutStart));
                }

                buildingContainerEl.style.opacity = opacity.toString();
                buildingContainerEl.style.pointerEvents = currentScroll > fadeOutEnd ? 'none' : 'auto';
            }
        }

        // Kick off initial frame
        targetScroll = window.scrollY;
        currentScroll = targetScroll;
        requestAnimationFrame(animateHero);
    }

    // Intersection Observer for hero sections
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.content-scroller section').forEach(section => {
        heroObserver.observe(section);
    });
```

**Key design decisions:**
- **Lerp smoothing** (`smoothFactor: 0.08`): The scroll position is interpolated using linear interpolation (lerp) each frame, creating a buttery-smooth lag effect. The building follows the scroll with a slight delay.
- **3D transforms**: `rotateX` tilts forward (looking down at building), `rotateY` gives subtle side angle, `translateZ` pushes toward viewer, `scale` zooms in. Combined, this creates a cinematic 3D dolly effect.
- **rAF loop**: Only runs when actively scrolling (stops when lerp converges), so zero CPU cost when idle.
- **No CSS transitions on the image** — all driven by JS for precise per-frame control.

- [ ] **Step 2: Test in browser**

1. Open the site and scroll slowly through the hero section.
2. **Expected**: The building image should smoothly tilt forward, rotate slightly sideways, and zoom in as you scroll. The motion should feel smooth and slightly delayed (buttery, not jittery).
3. Scroll past the hero — the building should fade out smoothly.
4. Scroll back to top — the building should return to its original flat position.
5. Check mobile viewport (DevTools responsive mode, 375px width) — same behavior but with reduced perspective.

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add rAF-driven 3D smooth scroll animation for hero"
```

---

### Task 4: Fine-Tune the 3D Effect & Polish

**Files:**
- Modify: `style.css` (hero section)
- Modify: `script.js` (hero animation)

- [ ] **Step 1: Add a subtle shadow under the building for depth**

In `style.css`, add this rule right after the `#hero-img` block:

```css
#hero-img::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%);
  pointer-events: none;
}
```

Note: This won't work on `<img>` directly — pseudo-elements don't apply to `<img>`. Instead, add the shadow to `.hero-layer--building`:

```css
.hero-layer--building::after {
  content: '';
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%) scaleX(1);
  width: 40%;
  height: 30px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.06) 0%, transparent 70%);
  pointer-events: none;
  transition: transform 0.3s ease;
  will-change: transform;
}
```

- [ ] **Step 2: Add text parallax — slides move at different Z-depths**

In the JS hero animation function, after the building transforms, add per-slide depth offsets so text layers move at slightly different rates:

```javascript
            // ── Per-slide parallax depth ──
            slides.forEach((slide, i) => {
                const slideDepth = (i + 1) * 0.03; // Each slide moves slightly differently
                const slideY = currentScroll * slideDepth * -0.5;
                slide.style.transform = slide.classList.contains('visible')
                    ? `translateY(${slideY}px) translateZ(0)`
                    : `translateY(30px) translateZ(0)`;
            });
```

- [ ] **Step 3: Test the complete effect**

1. Open the site and scroll through the hero.
2. **Expected**: Building has a subtle ground shadow. Text slides move at slightly different speeds, creating depth layering.
3. Test on mobile viewport — effects should be subtler but present.
4. Check performance: open DevTools Performance tab, scroll through hero, ensure no frame drops below 55fps.

- [ ] **Step 4: Commit**

```bash
git add style.css script.js
git commit -m "feat: polish 3D hero with depth shadow and text parallax"
```

---

### Task 5: Handle Edge Cases & Accessibility

**Files:**
- Modify: `style.css` (hero section)
- Modify: `script.js` (hero animation)

- [ ] **Step 1: Respect `prefers-reduced-motion`**

In `style.css`, add at the end of the hero section (before the mobile media query):

```css
@media (prefers-reduced-motion: reduce) {
  .hero-slide {
    opacity: 1;
    transform: none;
    transition: none;
  }

  #hero-img {
    transform: scale(1) !important;
  }

  .hero-layer--building {
    opacity: 1 !important;
  }
}
```

In `script.js`, wrap the 3D animation setup in a reduced-motion check. At the top of the `if (heroImgEl)` block, add:

```javascript
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // Still fade out building when scrolling past, but no 3D transforms
            window.addEventListener('scroll', () => {
                const scrollVal = window.scrollY;
                if (buildingContainerEl) {
                    const fadeOutStart = totalHeroHeight * 0.75;
                    const fadeOutEnd = totalHeroHeight * 1.05;
                    let opacity = 1;
                    if (scrollVal > fadeOutStart) {
                        opacity = Math.max(0, 1 - (scrollVal - fadeOutStart) / (fadeOutEnd - fadeOutStart));
                    }
                    buildingContainerEl.style.opacity = opacity.toString();
                    buildingContainerEl.style.pointerEvents = scrollVal > fadeOutEnd ? 'none' : 'auto';
                }
            }, { passive: true });
            return; // Skip 3D animation setup below
        }
```

Note: This `return` exits the `if (heroImgEl)` block early — the 3D lerp/rAF code below it won't execute. Wrap the remaining 3D code in an else block or restructure to ensure this works. The simplest approach: change the `if (heroImgEl)` block to a function and use early return:

```javascript
    if (heroImgEl) {
        const totalHeroHeight = window.innerHeight + (slides.length - 1) * (window.innerHeight * 0.5);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // Reduced: only fade out building, no 3D
            window.addEventListener('scroll', () => {
                const scrollVal = window.scrollY;
                if (buildingContainerEl) {
                    const fadeOutStart = totalHeroHeight * 0.75;
                    const fadeOutEnd = totalHeroHeight * 1.05;
                    let opacity = 1;
                    if (scrollVal > fadeOutStart) {
                        opacity = Math.max(0, 1 - (scrollVal - fadeOutStart) / (fadeOutEnd - fadeOutStart));
                    }
                    buildingContainerEl.style.opacity = opacity.toString();
                    buildingContainerEl.style.pointerEvents = scrollVal > fadeOutEnd ? 'none' : 'auto';
                }
            }, { passive: true });
        } else {
            // Full 3D animation (existing lerp/rAF code goes here)
            let currentScroll = 0;
            let targetScroll = 0;
            // ... rest of 3D code ...
        }
    }
```

- [ ] **Step 2: Handle window resize**

Add a resize handler to recalculate `totalHeroHeight` when the window is resized:

In the JS, after `totalHeroHeight` is calculated, make it a `let` (not `const`) and add:

```javascript
        let totalHeroHeight = window.innerHeight + (slides.length - 1) * (window.innerHeight * 0.5);

        window.addEventListener('resize', () => {
            totalHeroHeight = window.innerHeight + (slides.length - 1) * (window.innerHeight * 0.5);
        }, { passive: true });
```

- [ ] **Step 3: Test accessibility and resize**

1. In Chrome DevTools, enable "Emulate CSS media feature prefers-reduced-motion: reduce" (Rendering tab).
2. **Expected**: Building shows static, no 3D rotation/zoom. Slides appear without animation. Building still fades when scrolling past hero.
3. Resize browser window from desktop to mobile width. Scroll through hero.
4. **Expected**: No layout breakage, animation recalculates smoothly.

- [ ] **Step 4: Commit**

```bash
git add style.css script.js
git commit -m "feat: add reduced-motion support and resize handling to 3D hero"
```

---

## Summary of 3D Effect

| Scroll Progress | Scale | RotateX | RotateY | TranslateZ | TranslateY |
|----------------|-------|---------|---------|------------|------------|
| 0% (top) | 1.0 | 0° | 0° | 0px | 0px |
| 50% (mid hero) | 1.175 | -3° | 1.5° | 40px | -15px |
| 100% (end hero) | 1.35 | -6° | 3° | 80px | -30px |

The lerp smoothing (`factor: 0.08`) means the building follows scroll with ~12-frame delay, creating the "smooth/buttery" feel of premium 3D scroll experiences.
