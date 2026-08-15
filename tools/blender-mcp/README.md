Pizjo Blender MCP pipeline
==========================

Generates the 3D pizza asset in Blender (PBR, layer-separated for the
exploded-view scroll section) and exports production GLBs, replacing the
procedural-Only CSS/Three.js approach with a real Blender-authored model.

Status: PR 1 sample assets complete- hero and all 4 exploded layers exported,
Draco-compressed, render-verified (see Verification below).

Prerequisites
-------------
- Windows with Blender 4.2+ or 5.x (verified on Blender 5.1.2) installed.
- For agent-driven (MCP) control: Blender MCP addon + `mcp-blender` server
  (https://projects.blender.org/lab/blender_mcp or RFingAdam/mcp-blender).
- Node 18+ (for gltf-pipeline via npx).
- Optional: toktx (KTX2/Basis) - skip if absent, Draco-only fallback.

Recipes
-------
- `recipes/build_pizza.py`            - builds pizza (crust/sauce/cheese/
  pepperoni/basil with PBR materials) into collections and exports:
    assets/source/hero/pizza_hero.glb
    assets/source/parts/{crust,sauce,cheese,toppings}.glb
- `recipes/render_preview.py`         - imports a GLB and renders multi-angle
  preview frames (the "render_verify / analyze_viewport" analog for headless
  use without a full MCP loop).

Build the pizza

    & "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" -b \
        --factory-startup --python tools\blender-mcp\recipes\build_pizza.py

Compress & place into dist (Draco + KTX2 when toktx installed):

    powershell -File tools\asset-build\build-sample.ps1 `
        -Input "assets\source\hero\pizza_hero.glb" -OutDir "assets\dist\hero"

Render-verify a compressed GLB (three camera angles):

    & "C:\...\blender.exe" -b --python tools\blender-mcp\recipes\render_preview.py `
        -P -- --input=assets/dist/hero/hero_draco.glb --out=assets/verification

Check artifact budgets:

    node tools\asset-build\check-artifacts.js "assets\dist\hero"

MCP mode
--------
Load the addon in Blender (Edit > Preferences > Add-ons), install/run
`mcp-blender` (stdlib, default port 9876), and point the MCP client at
`tools\blender-mcp\mcp-config.json`. Then drop `build_pizza.py` and
`render_preview.py` into the loop:

    render -> get_viewport_screenshot (analyze) -> refine_iteration

Iterating the look ("cheese glossier", "crust darker") is now a
prompt-level change, not a code change.

Asset sizing (current)
----------------------
- hero: assets/dist/hero/hero_draco.glb = ~49 KB (budget < 1.5 MB)
- parts: crust 3.3 KB / sauce 1.8 KB / cheese 18.4 KB / toppings 27.7 KB
- no textures yet (procedural materials only; toktx stage optional).

Next steps
----------
- Bake textures to albedo/normal/SSS maps in Blender when moving from
  procedural to photographic look (subsurface scattering on cheese uses
  the Subsurface path in the Principled BSDF shader).
- Wire the GLB into Three.js loaders with Draco + KTX2 fallbacks.