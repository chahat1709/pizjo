# Artist → Engineer Handoff Guide

Purpose: ensure artists export assets compatible with the Pizjo asset pipeline and materials spec.

Required exports per hero asset:
- GLB/GLTF (embed=false) with tangents enabled.
- Textures as `<asset>__maptype.png` (baseColor, normal, roughness, metalness, ao optional).
- Provide a PSD/source file and a README describing color/lighting intent.

Export checklist:
1. Tri count and UV density notes.
2. Tangents exported.
3. Normal map in +Y convention.
4. sRGB for color textures; linear for normal/roughness/metalness.
5. ZIP with `asset.glb`, `textures/` folder, `README_artist.md`.

Commands (suggested):
```bash
# Convert textures to KTX2
toktx --genmipmap --assign_oetf=srgb hero_baseColor.ktx2 hero_baseColor.png

# Compress gltf with draco
npx gltf-pipeline -i hero.glb -o hero_draco.glb --draco.compressMeshes true
```
