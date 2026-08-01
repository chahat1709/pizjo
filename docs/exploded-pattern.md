# Exploded View Pattern — Design & Implementation Notes

Purpose: define pinned-exploded UX pattern, stage mapping, prefetch rules, accessibility, and performance constraints.

Pattern summary
- The exploded section pins the pizza in viewport while the user scrolls through N stages. Each stage focuses on one layer: 0=crust, 1=sauce, 2=cheese, 3=toppings, etc.
- Scrub input (0..1) maps to discrete stage indices via `Math.floor(progress * stages.length)`.

Loading & prefetch policy
- Load only assets for current stage and neighbors (stage ±1).
- Prefetch next-stage assets when idle using low-priority fetch.
- Dispose (revokeObjectURL + blob=null) assets that fall outside stage ±2 to free memory.

Performance
- Stage transition latency (input-to-frame) must be < 80ms.
- Use LODs for parts; ensure total active GPU memory stays within budgets (see `improvement-plan-v2.md`).
- Use simple GPU-friendly shaders for particle/steam effects in exploded mode.

Accessibility
- Keyboard left/right arrow to step stages.
- Announce stage changes using ARIA live region with brief description.
- Provide textual list of layers for screen reader users.

Testing
- Playwright E2E: simulate scroll and assert `stage-changed` events and visual snapshots for canonical stages.
