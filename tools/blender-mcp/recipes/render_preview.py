#!/usr/bin/env python3
"""Pizjo render-verify loop (Blender 4.2+/5.x).

Imports an exported GLB (hero or exploded part) and renders preview frames
from three camera angles so the Blender MCP flow (or a human) can compare
`render_multi_angle` output against the target look.

Usage:
  blender.exe -b --python tools/blender-mcp/recipes/render_check.py -- \
      --input assets/dist/hero/hero_draco.glb --out assets/verification

Steps mirror `mcp-blender`: render -> viewport screenshot -> analyze ->
refine. Frame files land in `<out>/<basename>_view0.png` etc.
"""

import argparse
import os
import sys

import bpy

DEFAULTS = {
    "input": os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "dist", "hero", "hero_draco.glb"),
    "out": os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "verification"),
    "angles": "3",
}


def parse_args():
    args = {}
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for tok in raw:
        if tok.startswith("--") and "=" in tok:
            k, v = tok[2:].split("=", 1)
            args[k] = v
    return argparse.Namespace(
        input=os.path.abspath(args.get("input", DEFAULTS["input"])),
        out=os.path.abspath(args.get("out", DEFAULTS["out"])),
        angles=int(args.get("angles", DEFAULTS["angles"])),
    )


def load_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)


def setup_scene(scene):
    for obj in list(bpy.data.objects):
        if obj.type != "CAMERA":
            bpy.data.objects.remove(obj, do_unlink=True)
    if hasattr(bpy.types, "EEVEE") and "BLENDER_EEVEE_NEXT" in dir(bpy.data.scenes[0].render):
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    else:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.film_transparent = True
    cam = None
    for obj in bpy.data.objects:
        if obj.type == "CAMERA":
            cam = obj
            break
    if cam is None:
        cam_data = bpy.data.cameras.new("PreviewCam")
        cam = bpy.data.objects.new("PreviewCam", cam_data)
        scene.collection.objects.link(cam)
    cam.location = (3.2, -2.6, 1.9)
    cam.data.lens = 50
    empty = bpy.data.objects.new("LookAt", None)
    scene.collection.objects.link(empty)
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.name = "Pizza"
    return cam, empty


def render_views(args):
    os.makedirs(args.out, exist_ok=True)
    load_glb(args.input)
    base = os.path.splitext(os.path.basename(args.input))[0]
    scene = bpy.context.scene
    cam, target = setup_scene(scene)
    for i in range(args.angles):
        cam.location = (3.0, -2.6 + i * 1.2, 1.9 - i * 0.4)
        if i == 2:
            cam.location = (0.5, 3.4, 1.2)
        scene.camera = cam
        out = os.path.join(args.out, "%s_view%d.png" % (base, i))
        scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        print("PIZJO_RENDER_OK %s" % out)


if __name__ == "__main__":
    parse_args = parse_args()
    render_views(parse_args)