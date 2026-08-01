# 3D Web Design Research — Pizjo Upgrade

> Compiled 2026-07-31. Sources: Awwwards, FWA, CSS Design Awards, Instagram web design reels, Bruno Simon, Active Theory, Locomotive Scroll, GSAP showcase.

## 1. Trending 3D Techniques (2024-2026)

| # | Technique | Why it works for food | Complexity | Reference |
|---|-----------|----------------------|------------|-----------|
| 1 | **Three.js + GLTF models** with PBR materials | Realistic food renders, exploded views | Medium | threejs.org/examples |
| 2 | **Spline (embed)** | No-code 3D scenes, fast iteration | Low | spline.design |
| 3 | **Gooey SVG filter** on hero text | Liquid, organic feel — perfect for cheese/sauce | Low | css-tricks.com/gooey |
| 4 | **Particle systems** (floating herbs, steam, sparks) | Adds life, depth, motion | Medium | codrops/particles |
| 5 | **Scroll-driven 3D rotation** (pizza spins as you scroll) | Interactive storytelling | Medium | gsap.com/scrolltrigger |
| 6 | **Custom shaders** (bloom, chromatic aberration, grain) | Cinematic, premium feel | High | shadertoy.com |
| 7 | **Cursor parallax** (3D tilt on mouse move) | Tactile, responsive | Low | react-spring/three |
| 8 | **Lenis smooth scroll** + GSAP ScrollTrigger | Buttery scroll, cinematic pacing | Low | lenis.darkroom.engineering |
| 9 | **Magnetic buttons** (CTA follows cursor) | Premium micro-interaction | Low | codrops/magnetic |
| 10 | **Text scramble / split reveal** on scroll | Bold, rebellious tone (matches Pizjo brand) | Low | splitting.js |

## 2. Common 3D Elements in Food Sites

- **Floating food items** with subtle bobbing animation
- **Exploded view** of a pizza (layers separate on scroll/hover)
- **360° product rotation** on menu cards
- **Steam/heat distortion** rising from food
- **Gooey blob transitions** between sections
- **Parallax depth** (foreground/midground/background layers)

## 3. Scroll-Driven Animations

- **Sticky 3D canvas** that pins while content scrolls past
- **Horizontal scroll** sections (e.g., menu categories)
- **Scroll-jacking** for hero (controlled, not jarring)
- **Section-by-section reveals** with staggered children
- **Progress indicator** (vertical line filling as you scroll)

## 4. Micro-Interactions

- **Cursor follower** (custom dot that morphs on hover)
- **Magnetic CTAs** (buttons pull toward cursor)
- **3D card tilt** on hover (parallax depth)
- **Image distortion** on hover (glitch, melt, gooey)
- **Text scramble** on hover (rebellious brand fit)
- **Sound effects** on add-to-cart (optional, muted by default)

## 5. Hero Section Patterns

- **Full-bleed 3D model** with gooey text overlay
- **Video background** + 3D particle overlay
- **Interactive canvas** (mouse-reactive)
- **Split-screen** (3D left, content right)
- **Animated SVG** with CSS variables

## 6. Color/Lighting Trends

- **Neon glow** on dark backgrounds (matches Pizjo amber/umber)
- **Rim lighting** on 3D models
- **Bloom post-processing** for highlights
- **Film grain** overlay for grunge texture
- **Dark mode** with neon accents (already in Pizjo brand)

## 7. Performance Techniques

- **Lazy-load 3D** (only when hero is in viewport)
- **Progressive enhancement** (fallback image if WebGL fails)
- **Mobile detection** (disable heavy 3D on low-end devices)
- **DRACO compression** for GLTF models
- **requestAnimationFrame** throttling

## 8. Reference Sites

- **bruno-simon.com** — Three.js driving game (gold standard)
- **active-theory.com** — WebGL showcase
- **nocnoc.com** — Playful 3D product pages
- **oh-la-la.fr** — French bakery with smooth scroll
- **richardmattka.com** — Portfolio with gooey effects
- **lusion.co** — Cinematic 3D agency site

## Key Takeaways for Pizjo

1. **Hero needs a real 3D pizza model** (not just a static image) — exploded view on scroll
2. **Gooey SVG filter** on the brand name for liquid cheese effect
3. **Lenis smooth scroll** + GSAP ScrollTrigger for cinematic pacing
4. **Magnetic CTAs** on "Order Now" buttons
5. **Cursor follower** with morphing states
6. **Particle system** (floating herbs/sparkles) in hero
7. **3D card tilt** on menu items
8. **Text scramble** on section headings (rebellious brand fit)
9. **Bloom + grain post-processing** for cinematic feel
10. **Mobile fallback** to high-quality static images
