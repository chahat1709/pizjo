// Scene setup helper: creates renderer, scene, camera, PMREM IBL loader and basic postprocessing.
// Assumes `THREE` is available globally and that EffectComposer passes are available.
(function(global){
  async function createScene(opts={}){
    const canvas = opts.canvas || document.createElement('canvas');
    const width = opts.width || window.innerWidth;
    const height = opts.height || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure || 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    // PMREM generator for IBL
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Simple postprocessing setup (if available)
    let composer = null;
    try {
      if (THREE.EffectComposer && THREE.RenderPass) {
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        if (THREE.UnrealBloomPass) {
          const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 0.3, 0.4, 0.85);
          bloom.threshold = 0.9;
          bloom.strength = opts.bloomStrength || 0.25;
          bloom.radius = 0.4;
          composer.addPass(bloom);
        }
      }
    } catch (e) {
      composer = null; // pass
    }

    window.addEventListener('resize', ()=>{
      const w = window.innerWidth; const h = window.innerHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h); if (composer) composer.setSize(w,h);
    });

    return { renderer, scene, camera, pmremGenerator, composer, canvas };
  }

  async function loadEnvMap(url, pmremGenerator){
    return new Promise((resolve,reject)=>{
      const loader = new THREE.RGBELoader();
      loader.setDataType(THREE.UnsignedByteType);
      loader.load(url, (tex)=>{
        const envMap = pmremGenerator.fromEquirectangular(tex).texture;
        tex.dispose();
        resolve(envMap);
      }, undefined, reject);
    });
  }

  global.PizjoRenderer = { createScene, loadEnvMap };
})(window);
