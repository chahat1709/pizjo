# Pizjo 3D Upgrade Plan — v2 (revised, performance‑first)

Goal: Transform Pizjo from a feature checklist into a measurable, production‑grade, Awwwards/FWA contender by combining cinematic 3D craft with a strict performance and resilience playbook. Target reviewer score: 9.5/10.

Overview: This revision adds an explicit asset pipeline, staged preload strategy, PBR/IBL lighting standards, runtime LOD & memory heuristics, pinned-exploded scrub UX pattern, micro-interaction system, CI gating (Lighthouse + visual diffs + Playwright), accessibility/fallbacks, and a 7-PR roadmap to deliver changes iteratively.

Key new sections (high level):
- Asset pipeline (Draco + KTX2/Basis + LOD generation)
- Hero preload & staged loader (LQIP → LOD swap → deferred full-res)
- Rendering & Materials (PBR metalness/roughness, PMREM IBL)
- Runtime LOD, GPU memory heuristics & auto-dispose
- Pinned exploded view: scrub controller + stage-based loading
- Micro-interactions & typography system (tokens + reduced-motion)
- Performance budgets & CI (Lighthouse CI gating)
- Accessibility, fallbacks, and audio policy
- Testing: Playwright E2E + visual regression + perf telemetry

-------------------------
ASSET PIPELINE (must-have)
- Details: Build step converts artist exports into production assets:
	- Export GLTF/GLB from artist tool (subfolders: hero, parts, LODs).
	- Run `gltf-pipeline` + Draco quantization for geometry.
	- Compress textures to KTX2/Basis via `toktx` (generate mipmaps).
	- Produce 3 LODs per model (high / medium / low).
- Deliverables: `pizjo/tools/asset-build/*` scripts and sample compressed hero assets.
- Acceptance: hero LOD < 1.5MB, full-res model total < 6MB.

HERO PRELOAD & STAGED LOADER
- Flow: 1) LQ poster (blurred PNG) displayed immediately; 2) fetch low LOD GLTF and show assembly animation; 3) after FMP or interaction, swap to medium/high LOD; 4) defer non-critical models/particles until idle.
- Implementation notes: use `link rel=preload` for LQ poster, `fetch()` with `priority` for LOD1, then `THREE.GLTFLoader` streaming for others. Add a visible, brandful preloader with progress but keep FMP fast.
- Acceptance: Hero FMP <= 800ms on simulated mobile emulation (Lighthouse emulation), LCP <= 2500ms on 3G slow.

RENDERING & MATERIALS (PBR standard)
- Use metalness/roughness workflow; require maps: baseColor, normal, roughness, metalness, ao, optionally clearcoat/subsurface maps for cheese.
- Use PMREM-based environment map (IBL) per scene; provide artist-tuned exposure & tone-map presets.
- Postprocessing stack: bloom (half-res), subtle DOF (bokeh approx), tone-mapping, film grain (overlay). Auto-throttle or disable on mobile.
- Acceptance: visually consistent hero frames between devices; materials authored per spec.

LOD, MEMORY & RUNTIME HEURISTICS
- Runtime LOD manager: switch LOD by distance + timeline stage; allow manual override for pinned stage.
- GPU heuristics: monitor texture uploads and WebGL memory; if usage > threshold (configurable), reduce postprocessing and swap to lower LODs.
- Auto-dispose: free buffers/textures for off-stage models.
- Acceptance: memory under 200MB desktop, <120MB mid-tier phone during full scene.

PINNED EXPLODED VIEW (SCRUB CONTROLLER)
- Pattern: pinned viewport, stage-based scene states (0..N), scrub maps input to timeline normalized [0..1].
- Loading: load only parts for stage ±1; prefetch next-stage assets in background.
- Accessibility: keyboard left/right to step stages; provide text fallback list for screen readers.
- Acceptance: stage change latency < 80ms input-to-frame; Playwright verifies stage indices and visual snapshots.

MICRO-INTERACTIONS & TYPOGRAPHY
- Interaction tokens: define `motion.primary`, `motion.secondary`, `motion.rare` with durations/easings (use spring variables).
- Reduced-motion: CSS media query `prefers-reduced-motion` and user toggle; heavy per-character reveals reduced to fades.
- Typography: pick variable font; animate weight/width axes for main reveal (thin→bold materialize effect).
- Acceptance: all interactive components have 60ms response, minimum 44px touch targets, keyboard focus states.

PERFORMANCE STRATEGY & CI
- Budgets: hero triangles ≤ 200k, textures hero ≤ 2MB (compressed), main JS bundle ≤ 200KB gzipped (core), post-FMP lazy loads.
- CI gates: Lighthouse CI thresholds (Desktop >= 95, Mobile >= 90), Playwright E2E, visual diffs (<=1% threshold).
- Integrations: Lighthouse CI, Playwright, Playwright image snapshots (or Percy), and a budget script to fail PRs exceeding budgets.

ACCESSIBILITY, FALLBACKS & AUDIO
- Fallbacks: non-WebGL devices show static hero poster + lightweight CSS animations; low-memory devices get simplified viewer.
- Accessibility: keyboard flows for main actions, ARIA descriptions for stage changes, captions for audio, visible focus styles.
- Audio: muted-by-default, opt-in ambient snippets, async load only after user consent/interaction.

TESTING & TELEMETRY
- Playwright tests: hero poster before GLTF fetch, LOD swap, exploded-stage transitions, service worker cache behavior, keyboard navigation.
- Visual regression: baseline frames (hero_idle, exploded_mid, product_spin) stored in `pizjo/docs/research/baselines/`.
- Runtime telemetry (staging): FPS, texture uploads, memory spikes; alert if mean FPS drops >20%.

RESEARCH ARTIFACTS
- Files (suggested):
	- `pizjo/docs/research/examples.json` (curated examples + notes)
	- `pizjo/assets/research/01_pizza_amici.jpg`, ...
	- `pizjo/docs/research/baselines/hero_idle.png` etc.

SUCCESS METRICS (explicit)
- Hero First Meaningful Paint (FMP): <= 800ms (mobile emulation)
- LCP (3G slow): <= 2500ms
- Lighthouse: Desktop >= 95, Mobile >= 90
- Visual diffs for canonical frames <= 1%
- Frame-rate: Desktop 60fps stable; mid-tier mobile interactive scenes >= 30–45fps
- Accessibility: Lighthouse >= 90

7-PR ROADMAP (iterative delivery)
PR 1 — Asset pipeline + sample compressed hero assets (Medium effort)
	- Add `pizjo/tools/asset-build` scripts and sample compressed GLTF/KTX2 assets. CI: artifact size checks.
PR 2 — Hero preload + staged loader + fallback poster (Low→Medium)
	- Implement LQIP, LOD1 fetch, model swap, fallback static poster. Tests: Playwright poster+swap checks.
PR 3 — PBR + PMREM IBL + postprocessing stack (Medium)
	- Common material loader, PMREM environment, configurable postprocessing with auto-throttle. Tests: visual snapshot + perf run.
PR 4 — Exploded view scrub controller + stage-based loading (Medium)
	- Add scrub controller, stage maps, prefetch stage ±1 assets. Tests: Playwright scroll/keyboard steps and snapshots.
PR 5 — Service worker caching & streaming policy (Medium)
	- SW registration, cache-first for models with versioning, prefetch policies. Tests: cache warm vs cold FMP.
PR 6 — Visual regression + Playwright E2E + Lighthouse CI (Medium→High)
	- Integrate visual snapshot tests and Lighthouse CI as PR gates. Thresholds enforced.
PR 7 — Telemetry, budgets, docs & handoff (Medium)
	- Runtime telemetry hooks, budget scripts, artist/engineer handoff docs, gating rules.

FILES TO MODIFY (doc + code)
- `pizjo/docs/improvement-plan-v2.md` — update plan (this file)
- `pizjo/tools/asset-build/*` — scripts and README
- `pizjo/src/preloader.js`, `pizjo/src/hero-controller.js` — preload & staged loader
- `pizjo/src/renderer/*` — material loaders, PMREM setup, postprocessing
- `pizjo/src/ux/exploded-controller.js` — scrub controller
- `pizjo/src/sw/service-worker.js` — caching rules
- `playwright.config.js`, `tests/e2e/*` — tests

ACCEPTANCE CRITERIA (per PR)
- See roadmap PR entries for specific CI/test checks. Every PR must include at least one Playwright test and at least one visual snapshot for a canonical frame.

NEXT STEPS (you choose one):
A) I capture canonical screenshots and create `pizjo/docs/research/examples.json` (requires manual or headless capture).  
B) I draft and stage the updated `pizjo/docs/improvement-plan-v2.md` (I have already done the revision above) and open a branch/PR skeleton (I will not push without your approval).  

If you approve, I will proceed to implement PR 1 locally (create scripts and sample assets), run local validation, and prepare PR diffs. If you prefer screenshots first, choose A.

