# Pizjo Materials Spec

Purpose: specify required texture maps, naming conventions, export settings and recommended compression for hero food assets.

Required maps per material (base/high quality):
- baseColor: sRGB PNG/JPEG (albedo)
- normal: linear normal map (PNG)
- roughness: linear (or single-channel packed) PNG
- metalness: linear PNG (0 for organic materials)
- ao: optional
- subsurface/clearcoat: optional for cheese/gloss

Export settings & naming:
- Filenames: `<asset>__maptype.ext` e.g., `pizza_crust__baseColor.png`
- GLTF export: embed=false, textures referenced, tangents true, export as glb for pipeline conversion.
- Tangents: ensure tangents are exported for proper normal mapping.

Compression & build:
- Use `gltf-pipeline` + Draco quantization for geometry.
- Convert color/alpha textures to KTX2 using `toktx --genmipmap --assign_oetf=srgb`.
- Generate mipmaps for all textures.
- Create 3 LODs: high (artist), medium (half-texel density), low (simple mesh, 1/4 texture resolution).

Quality targets:
- Hero LOD size: < 1.5MB compressed
- Full model: < 6MB compressed

Material authoring notes:
- Use metalness/roughness PBR workflow (no specular). Organic materials should use metalness=0.
- For cheese: consider a subsurface approximation via a blurred AO combined with a subtle subsurface map.
