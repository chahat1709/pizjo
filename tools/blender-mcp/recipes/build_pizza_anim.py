#!/usr/bin/env python3
"""Pizjo ANIMATED pizza builder (Blender 4.2+/5.x).

Same PBR pizza as build_pizza.py, but bakes a REAL animation into the GLB as
a single action "PizzaLife" (frames 0..210 @30fps):

  - Frames 0-90:    "Assemble" — exploded layers drop into place
      (Crust stays, Sauce lands ~f30, Cheese ~f50, Toppings ~f70,
      staggered BEZIER easing) + root spin-in.
  - Frames 90-210:  "Idle" — loop-safe gentle float (Y bob) + full 360°
      rotation on a parent Empty, objects hold rest.

All motion lives on one action so the glTF exporter emits ONE animation
clip; the web layer subclips it into Assemble + Idle at runtime.

Export: assets/source/hero/pizza_hero_anim.glb (UNCOMPRESSED source)
Then:   tools/asset-build/build-sample.ps1 -> assets/dist/hero/hero_draco.glb

Usage:
  blender.exe -b --python tools/blender-mcp/recipes/build_pizza_anim.py
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_pizza import build, OUT

FPS = 30
ASSEMBLE_END = 90
IDLE_END = 210

LAYER_OFFSET = {"Crust": 0.0, "Sauce": 1.2, "Cheese": 2.4, "Toppings": 3.6}
LAYER_LAND = {"Crust": 0, "Sauce": 30, "Cheese": 50, "Toppings": 70}


def obj_layer(obj, colls):
    """Layer name from the child collections (NOT PizzaFull, which contains all)."""
    for name in ("Crust", "Sauce", "Cheese", "Toppings"):
        if obj.name in colls[name].objects:
            return name
    return "Toppings"


def key(obj, action, prop, value, frame):
    obj.animation_data_create()
    obj.animation_data.action = action
    if prop == "location":
        obj.location = value
    elif prop == "rotation_euler":
        obj.rotation_euler = value
    obj.keyframe_insert(data_path=prop, frame=frame)


def animate(colls):
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 0
    scene.frame_end = IDLE_END

    # Parent Empty for whole-pizza motion (idle spin + float)
    root = bpy.data.objects.new("PizzaRoot", None)
    colls["PizzaFull"].objects.link(root)
    root.location = (0, 0, 0)
    root.rotation_euler = (0, 0, 0)

    meshes = [o for o in colls["PizzaFull"].objects if o.type == "MESH"]
    # Parent all meshes to root, keep world transforms (root is at origin,
    # identity -> local == world numerically).
    for obj in meshes:
        obj.parent = root

    rest = {
        obj.name: {"loc": obj.location.copy(), "rot": obj.rotation_euler.copy()}
        for obj in meshes
    }

    action = bpy.data.actions.new("PizzaLife")

    # ---------- ASSEMBLE: frames 0..90 ----------
    for obj in meshes:
        layer = obj_layer(obj, colls)
        off = LAYER_OFFSET.get(layer, 0.0)
        land = LAYER_LAND.get(layer, 0)
        r = rest[obj.name]
        key(obj, action, "location", (r["loc"][0], r["loc"][1], r["loc"][2] + off), 0)
        key(obj, action, "location", r["loc"], land)
        key(obj, action, "location", r["loc"], ASSEMBLE_END)

    # Root: slight spin-in during assembly
    key(root, action, "rotation_euler", (0, 0, math.radians(-18)), 0)
    key(root, action, "rotation_euler", (0, 0, 0), ASSEMBLE_END)

    # ---------- IDLE: frames 90..210 ----------
    # Objects hold rest; parent Empty does bob + full rotation (loop-safe).
    for obj in meshes:
        r = rest[obj.name]
        key(obj, action, "location", r["loc"], ASSEMBLE_END)
        key(obj, action, "rotation_euler", r["rot"], ASSEMBLE_END)
        key(obj, action, "location", r["loc"], IDLE_END)
        key(obj, action, "rotation_euler", r["rot"], IDLE_END)

    # Bob (Y float): sparse keys, sine shape; 0 at both ends -> loop-safe.
    bob_amp = 0.15
    for f in range(ASSEMBLE_END, IDLE_END + 1, 12):
        t = (f - ASSEMBLE_END) / (IDLE_END - ASSEMBLE_END)
        key(root, action, "location", (0, bob_amp * math.sin(2 * math.pi * t), 0), f)

    # Rotation: full 360 over idle; 0 at start and 2pi at end -> loop-safe.
    for f in range(ASSEMBLE_END, IDLE_END + 1, 15):
        t = (f - ASSEMBLE_END) / (IDLE_END - ASSEMBLE_END)
        key(root, action, "rotation_euler", (0, 0, t * math.tau), f)

    # ---------- Export ----------
    out_path = os.path.join(OUT, "hero", "pizza_hero_anim.glb")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in colls["PizzaFull"].objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_format="GLB",
        export_apply=False,
        export_animations=True,
    )
    print(f"PIZJO_ANIM_EXPORT_OK -> {out_path}")
    print(f"ACTIONS: {[a.name for a in bpy.data.actions]}")


if __name__ == "__main__":
    colls = build()
    animate(colls)
