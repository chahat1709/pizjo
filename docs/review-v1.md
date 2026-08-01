# Pizjo Improvement Plan v1 — Review

**Reviewer:** Strict Awwwards-tier design reviewer
**Subject:** `docs/improvement-plan.md` v1
**Bar:** Active Theory, Lusion, Bruno Simon, Locomotive, FWA SOTD

## Axis-by-Axis Scoring

### 1. Hero Impact — 0.55 / 1
The plan treats the hero as a checklist of effects (gooey text, particles, scroll-rotation) rather than a singular, jaw-dropping concept. A 9.5/10 hero from Lusion or Active Theory is one *unified* idea executed with obsessive craft — not a stack of medium-effort tricks. The "real 3D pizza model" is buried in Phase 3 and marked "if time permits," which is disqualifying: the hero IS the brand.
**Improvement:** Make the real GLTF pizza model with exploded-view-on-scroll the *first* deliverable. Commit to a single hero concept (e.g., "pizza assembles itself from floating ingredients as you load").

### 2. Scroll Experience — 0.65 / 1
Lenis + ScrollTrigger is the correct foundation, but the plan only describes *triggering* one effect. Top-tier sites use 5–8 distinct scroll moments: pinned sections, parallax layers, progress indicators, velocity-based color shifts, horizontal breaks.
**Improvement:** Add a pinned "exploded view" section where the pizza disassembles as you scroll, plus a vertical progress indicator on the right edge that fills with neon glow.

### 3. Micro-interactions — 0.7 / 1
Magnetic CTAs, 3D card tilt, and cursor follower are all correct. But the plan doesn't mention *velocity-based* interactions, *spring physics*, or *audio feedback*. The best sites feel alive — every hover has weight.
**Improvement:** Add spring-physics easing (not linear) to all hover states. Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for a subtle bounce.

### 4. Typography Motion — 0.5 / 1
Text scramble is mentioned but only for section headings. Awwwards winners animate *every* text element: hero title, prices, menu items, footer. The plan also misses *kinetic typography* (text that moves with scroll velocity).
**Improvement:** Animate the hero title with a per-character reveal (split into chars, stagger from bottom). Add a kinetic marquee for the "155+ ITEMS" stat.

### 5. Color/Lighting — 0.6 / 1
Bloom + grain is mentioned but the plan doesn't address *real-time lighting* on 3D models, *color grading*, or *dynamic color shifts* based on scroll position. The best sites shift the entire palette as you scroll.
**Improvement:** Add a scroll-driven color shift: hero is amber/umber, menu section shifts to a deeper umber, offers section pulses with neon.

### 6. 3D Depth — 0.5 / 1
Parallax and exploded views are mentioned but the plan doesn't commit to a *real* 3D model. Without a GLTF pizza, the "3D" is just CSS transforms — which is 2021, not 2026.
**Improvement:** Use a free GLTF pizza model (Sketchfab has CC0 ones) or build one procedurally with Three.js primitives (cylinder + discs for toppings).

### 7. Performance Strategy — 0.7 / 1
Lazy loading and mobile fallback are mentioned but the plan doesn't address *adaptive quality* (reduce particle count on low-end devices), *preload strategies*, or *WebGL feature detection*.
**Improvement:** Add `navigator.hardwareConcurrency` check — if < 4 cores, disable particles and use static fallback.

### 8. Brand Fit — 0.8 / 1
The grunge/neon/rebellious tone is well-matched. The plan correctly avoids corporate minimalism. But it could push harder — the brand is "unapologetic rebel," so the interactions should feel *dangerous*, not just smooth.
**Improvement:** Add a glitch effect on hover for the brand name. Use chromatic aberration on the hero title.

### 9. Differentiation — 0.5 / 1
The plan describes techniques that are *common* on Awwwards (Lenis, magnetic, cursor follower). To stand out on Instagram, Pizjo needs something *only a pizza brand* would do — like a pizza-slice cursor, or a cheese-pull transition between sections.
**Improvement:** Add a "cheese pull" SVG path animation between sections. Or a pizza-slice cursor that rotates with scroll.

### 10. Completeness — 0.6 / 1
The plan is implementable in vanilla HTML/CSS/JS, which is good. But it underestimates the effort for the GLTF model (Phase 3) and doesn't address *testing* the 3D scene (Playwright can't easily test WebGL).
**Improvement:** Add a Playwright test that verifies the WebGL canvas exists and has non-zero dimensions. Add a fallback test for the static image.

## Total Score: **5.6 / 10** — FAIL

## Top 3 Changes to Reach 9.5/10

1. **Promote the GLTF pizza model to Phase 1** — without a real 3D model, the hero is decoration. Use a free Sketchfab model or build procedurally.
2. **Add a pinned "exploded view" scroll section** — this is the single highest-impact scroll moment. Pizza disassembles as you scroll, revealing ingredients.
3. **Add kinetic typography + per-character hero reveal** — animate every text element, not just headings. Use splitting.js or custom.

## Verdict

**FAIL — 5.6/10.** The plan is a solid foundation but lacks the *unified hero concept* and *real 3D model* that separate 9.5/10 sites from 6/10 sites. Iterate the plan to address the top 3 changes above, then re-review.
