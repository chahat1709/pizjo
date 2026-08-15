#!/usr/bin/env python3
"""Pizjo pizza model builder (Blender 4.2+/5.x).

Builds a PBR pizza with exploded-view layers, then exports one GLB per layer
plus a full hero GLB into assets/source/.

Usage:
  blender.exe -b --python tools/blender-mcp/recipes/build_pizza.py

MCP usage: load this file's functions via the Blender MCP addon
(`execute_blender_code`) and iterate, or run the self-refine loop against
the exported GLBs. See README.md in this folder.
"""

import math
import os

import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT = os.path.join(ROOT, "assets", "source")

PIZZA_R = 1.0
CRUST_H = 0.08


def new_mat(name, color, roughness=0.55, metallic=0.0, subsurface=0.0, sss_color=(1.0, 1.0, 1.0)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node_tree = mat.node_tree
    bsdf = node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = subsurface
        if "Subsurface Color" in bsdf.inputs:
            bsdf.inputs["Subsurface Color"].default_value = (*sss_color, 1.0)
        elif "Subsurface Radius" in bsdf.inputs:
            bsdf.inputs["Subsurface Radius"].default_value = sss_color
    return mat


def make_cylinder(name, radius, depth, z, mat, verts=24, location_xy=(0.0, 0.0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=verts, location=(*location_xy, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def build():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for coll in list(bpy.data.collections):
        bpy.data.collections.remove(coll, do_unlink=True)

    colls = {}
    for name in ("PizzaFull", "Crust", "Sauce", "Cheese", "Toppings"):
        colls[name] = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(colls[name])

    mat_crust = new_mat("CrustDough", (0.87, 0.6, 0.3), roughness=0.35)
    mat_crust_rim = new_mat("CrustRim", (0.70, 0.44, 0.20), roughness=0.45)
    mat_sauce = new_mat("TomatoSauce", (0.72, 0.16, 0.05), roughness=0.4)
    mat_cheese = new_mat("Mozzarella", (1.0, 0.86, 0.47), roughness=0.5, subsurface=0.9, sss_color=(1.0, 0.92, 0.6))
    mat_pepperoni = new_mat("Pepperoni", (0.62, 0.09, 0.05), roughness=0.5)
    mat_basil = new_mat("Basil", (0.16, 0.42, 0.12), roughness=0.7)

    # --- Crust (base + rim) ---
    base = make_cylinder("CrustBase", PIZZA_R * 0.92, CRUST_H / 2, 0.0, mat_crust)
    for col in (colls["Crust"], colls["PizzaFull"]):
        col.objects.link(base)

    rim = make_cylinder("CrustRim", PIZZA_R, CRUST_H / 2 + 0.005, 0.0, mat_crust_rim)
    for col in (colls["Crust"], colls["PizzaFull"]):
        col.objects.link(rim)

    # --- Sauce ---
    sauce = make_cylinder("SauceLayer", 0.80 * PIZZA_R, CRUST_H * 0.75 + 0.01, 0.0, mat_sauce)
    sauce.name = "SauceLayer"
    for col in (colls["Sauce"], colls["PizzaFull"]):
        col.objects.link(sauce)

    # --- Cheese ---
    cheese = make_cylinder("CheeseLayer", 0.80 * PIZZA_R, CRUST_H * 0.9 + 0.02, 0.0, mat_cheese)
    cheese.name = "CheeseLayer"
    for col in (colls["Cheese"], colls["PizzaFull"]):
        col.objects.link(cheese)

    # Cheese bubbles
    for i in range(12):
        ang = i * (2 * math.pi / 12)
        r = PIZZA_R * (0.2 + 0.3 * (0.5 + 0.5 * math.sin(i * 1.7)))
        bub = make_cylinder("CheeseBubble%02d" % i, 0.045, 0.02, 0.0, mat_cheese,
                            location_xy=(r * math.cos(ang), r * math.sin(ang)))
        bub.location.z = CRUST_H * 0.92 + 0.05
        bub.name = "CheeseBubble%02d" % i
        for col in (colls["Cheese"], colls["PizzaFull"]):
            col.objects.link(bub)

    # --- Pepperoni ---
    spots = [(0.0, 0.34, 0.17), (1.9, 0.30, 0.16), (3.9, 0.36, 0.15), (0.7, -0.22, 0.16), (2.6, -0.1, 0.17),
             (4.6, 0.05, 0.15), (5.6, -0.28, 0.16), (1.3, 0.62, 0.15), (3.3, 0.62, 0.16), (5.3, 0.44, 0.17),
             (0.3, -0.62, 0.16), (2.4, -0.62, 0.15), (4.0, -0.45, 0.16), (3.0, 0.1, 0.16), (5.0, 0.1, 0.16)]
    for i, (ang, r, rad) in enumerate(spots):
        pp = make_cylinder("Pepperoni%02d" % i, rad, 0.01, 0.0, mat_pepperoni,
                           location_xy=(r * math.cos(ang), r * math.sin(ang)))
        pp.location.z = CRUST_H * 0.95 + 0.02
        pp.name = "Pepperoni%02d" % i
        for col in (colls["Toppings"], colls["PizzaFull"]):
            col.objects.link(pp)

    # --- Basil leaves ---
    for i, (x, y) in enumerate([(0.0, 0.85), (0.5, 0.25), (-0.5, -0.75), (0.9, 0.6), (-0.85, 0.15), (0.1, -0.45)]):
        bpy.ops.mesh.primitive_cube_add(size=0.1, location=(x, y, CRUST_H * 0.95 + 0.03))
        leaf = bpy.context.active_object
        leaf.scale = (0.5, 0.18, 0.06)
        leaf.rotation_euler.z = i * 0.7
        leaf.name = "Basil%02d" % i
        leaf.data.materials.append(mat_basil)
        for col in (colls["Toppings"], colls["PizzaFull"]):
            col.objects.link(leaf)

    return colls


def export_glb(coll, path):
    import os as _os
    _os.makedirs(_os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in coll.objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_format="GLB", export_apply=True)


def main():
    colls = build()
    export_glb(colls["PizzaFull"], os.path.join(OUT, "hero", "pizza_hero.glb"))
    for key in ("Crust", "Sauce", "Cheese", "Toppings"):
        export_glb(colls[key], os.path.join(OUT, "parts", key.lower() + ".glb"))
    print("PIZJO_BLENDER_EXPORT_OK ->", OUT)


if __name__ == "__main__":
    main()