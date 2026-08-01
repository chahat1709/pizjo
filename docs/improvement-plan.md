# Pizjo 3D Upgrade Plan — v1

> Goal: Take Pizjo from 2/10 to 9.5/10 vs. trending 3D restaurant sites on Instagram/Awwwards.

## Current State Audit

| Area | Current | Gap |
|------|---------|-----|
| Hero 3D | Static `pizza_hero.png` image | No real 3D model, no exploded view |
| Gooey effect | SVG filter on hero drips | Only on background, not on text |
| Scroll | Native browser scroll | No smooth scroll, no scroll-triggered 3D |
| Cursor | Default browser cursor | No custom cursor follower |
| CTAs | Static buttons | No magnetic effect |
| Menu cards | CSS hover lift | No 3D tilt, no parallax depth |
| Particles | None | No floating herbs/sparkles |
| Text reveals | CSS opacity fade-in | No scramble, no split reveal |
| Post-processing | None | No bloom, no grain |
| Mobile | Same as desktop | No fallback strategy |

## Improvement Plan (Prioritized by Impact/Effort)

### Phase 1 — Quick Wins (Low complexity, high impact) — +3 points
1. **Lenis smooth scroll** — 1 line of CSS + 1 script tag. Buttery feel.
2. **Magnetic CTAs** — Pure CSS/JS, 20 lines. "Order Now" buttons pull toward cursor.
3. **3D card tilt on menu items** — CSS `transform: perspective() rotateY()` on hover. 30 lines.
4. **Text scramble on section headings** — Use `splitting.js` or custom. Rebellious brand fit.
5. **Custom cursor follower** — Small dot that morphs on hoverable elements. 40 lines.
6. **Film grain overlay** — SVG noise filter on body. 10 lines.

### Phase 2 — Medium Effort (Medium complexity, high impact) — +2.5 points
7. **Gooey SVG filter on hero title** — Apply existing goo filter to "PIZJO!" text. Liquid cheese effect.
8. **Particle system in hero** — Floating herbs/sparkles using Three.js Points. 60 lines.
9. **Scroll-triggered 3D pizza rotation** — Pizza spins as you scroll past hero. GSAP ScrollTrigger.
10. **Bloom + grain post-processing** — Three.js EffectComposer. 40 lines.
11. **Staggered reveal animations** — GSAP-style stagger on menu cards, offer cards.

### Phase 3 — High Effort (High complexity, very high impact) — +2 points
12. **Real 3D pizza model** — GLTF pizza with exploded view on scroll. Requires model asset.
13. **Steam/heat distortion shader** — Custom shader rising from pizza.
14. **Horizontal scroll menu section** — Categories scroll horizontally with sticky 3D canvas.
15. **Sound effects on add-to-cart** — Optional, muted by default.

## Implementation Order (for 9.5/10 target)

1. ✅ Lenis smooth scroll
2. ✅ Magnetic CTAs
3. ✅ 3D card tilt
4. ✅ Text scramble
5. ✅ Custom cursor
6. ✅ Film grain
7. ✅ Gooey hero title
8. ✅ Particle system
9. ✅ Scroll-triggered rotation
10. ✅ Bloom + grain
11. ✅ Staggered reveals
12. ⏳ Real 3D model (if time permits)

## Files to Modify

- `index.html` — Add Lenis, cursor, grain overlay
- `css/home.css` — Magnetic, tilt, scramble, gooey text styles
- `css/global.css` — Cursor follower, grain
- `js/app.js` — Lenis init, cursor, magnetic, scramble
- `js/three-hero.js` — Particles, scroll rotation, bloom
- `js/three-landing.js` — Post-processing

## Success Metrics

- Hero loads in < 2s on 3G
- 60fps on desktop, 30fps on mobile
- All Playwright tests still pass
- No console errors
- Lighthouse score > 90
