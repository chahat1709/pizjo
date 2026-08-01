#!/usr/bin/env bash
set -euo pipefail
INPUT=${1:-}
OUTDIR=${2:-../../assets/dist/hero}

if [ -z "$INPUT" ]; then
  echo "Usage: $0 <input.glb> [outdir]"
  exit 2
fi

mkdir -p "$OUTDIR"

echo "Compressing GLTF with gltf-pipeline (Draco)..."
npx gltf-pipeline -i "$INPUT" -o "$OUTDIR/hero_draco.glb" --draco.compressMeshes true --draco.quantizePosition 14 --draco.quantizeNormal 10 --draco.quantizeTexcoord 12 || echo "gltf-pipeline failed or not available"

if command -v toktx >/dev/null 2>&1; then
  TEXDIR=$(dirname "$INPUT")/textures
  if [ -d "$TEXDIR" ]; then
    for img in "$TEXDIR"/*.{png,jpg,jpeg}; do
      [ -e "$img" ] || continue
      out="$OUTDIR/$(basename "${img%.*}").ktx2"
      toktx --target_type=RGBA32 --bcmp --genmipmap --assign_oetf=srgb "$out" "$img"
    done
  else
    echo "No textures dir found; skipping texture conversion"
  fi
else
  echo "toktx not found — skipping KTX2 conversion"
fi

echo "Done. Output in: $OUTDIR"
