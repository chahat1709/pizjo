// Materials helper: enforce PBR maps and provide a loader that validates required maps.
(function(global){
  function validateMaterialMaps(mat, required=['map','normalMap','roughnessMap','metalnessMap']){
    const missing = required.filter(k=>!mat[k]);
    return { ok: missing.length===0, missing };
  }

  async function applyStandardPBR(mesh, maps){
    if (!mesh.material) mesh.material = new THREE.MeshStandardMaterial();
    const mat = mesh.material;
    if (maps.baseColor) mat.map = maps.baseColor;
    if (maps.normal) mat.normalMap = maps.normal;
    if (maps.roughness) mat.roughnessMap = maps.roughness;
    if (maps.metalness) mat.metalnessMap = maps.metalness;
    mat.needsUpdate = true;
    return mat;
  }

  global.PizjoMaterials = { validateMaterialMaps, applyStandardPBR };
})(window);
