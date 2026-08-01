Asset build helpers for Pizjo

Purpose
-------
This folder contains helper scripts and documentation for producing compressed GLTF/KTX2 assets and validating artifact sizes for PR1 (asset pipeline + sample compressed hero assets).

Prerequisites
-------------
- Node.js (16+)
- npm or pnpm
- `gltf-pipeline` (npm) — used via `npx gltf-pipeline`
- `toktx` (KTX2/Basis) — install from https://github.com/KhronosGroup/KTX-Software
- Optional: `basisu` for Basis compression (legacy). Use `toktx` instead.

Files
-----
- `build-sample.ps1` — PowerShell script for Windows to run sample conversions.
- `build-sample.sh` — POSIX shell script for Linux/macOS.
- `check-artifacts.js` — Node script to validate produced artifact sizes against acceptance criteria.

Usage (example)
----------------
Place your artist-exported GLB/GLTF and textures into `pizjo/assets/source/hero/` then run:

PowerShell (Windows):

```powershell
cd ./pizjo/tools/asset-build
.\build-sample.ps1 -Input "..\..\assets\source\hero\hero.glb" -OutDir "..\..\assets\dist\hero"
node .\check-artifacts.js "..\..\assets\dist\hero"
```

POSIX (macOS/Linux):

```bash
cd ./pizjo/tools/asset-build
./build-sample.sh "../../assets/source/hero/hero.glb" "../../assets/dist/hero"
node ./check-artifacts.js "../../assets/dist/hero"
```

Notes
-----
- `gltf-pipeline` will be invoked via `npx` in these scripts; ensure network access or install it globally.
- `toktx` is a native binary; install per OS instructions. The scripts will skip texture conversion if `toktx` is not available.
- The `check-artifacts.js` script enforces a sample budget (hero LOD < 1.5MB). Adjust thresholds in the script if needed.
