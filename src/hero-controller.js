// Hero controller: listens for LOD1 from preloader, loads into three.js scene,
// plays assembly animation, and supports upgrade to higher LOD.
(function(global){
  class HeroController {
    constructor(opts){
      this.container = opts.container || document.body;
      this.lod1Url = null;
      this.scene = null;
      this.renderer = null;
      this.camera = null;
      this.gltf = null;
      this.upgraded = false;
      this._onLOD1 = this._onLOD1.bind(this);
      window.PizjoPreloader.on('lod1-loaded', this._onLOD1);
    }

    async initRenderer(canvas){
      // minimal three.js setup; expects THREE global
      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
      this.camera.position.set(0, 1.5, 3);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5,10,7.5);
      this.scene.add(light);
      window.addEventListener('resize', ()=>{
        this.camera.aspect = window.innerWidth/window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
      this._animate();
    }

    async _onLOD1(e){
      this.lod1Url = e.detail.url;
      // notify that preloader fetched LOD1
      this._loadGLTF(this.lod1Url).then(()=>{
        window.PizjoPreloader._emitter.dispatchEvent(new CustomEvent('hero-ready'));
      }).catch(err=>console.error('hero load failed', err));
    }

    async _loadGLTF(url){
      if (!window.THREE || !window.THREE.GLTFLoader) throw new Error('Three.js + GLTFLoader required');
      const loader = new THREE.GLTFLoader();
      return new Promise((resolve,reject)=>{
        loader.load(url, (gltf)=>{
          this._setModel(gltf.scene);
          this.gltf = gltf;
          resolve(gltf);
        }, undefined, reject);
      });
    }

    _setModel(model){
      // simple centering and add
      model.traverse((c)=>{ if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.scene.add(model);
      // simple assembly animation: scale from 0.6 -> 1
      model.scale.setScalar(0.6);
      const start = performance.now();
      const dur = 1500;
      const tick = (t)=>{
        const p = Math.min(1, (t-start)/dur);
        const s = 0.6 + 0.4 * ( -Math.cos(p*Math.PI)/2 + 0.5 ); // eased
        model.scale.setScalar(s);
        if (p<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    async upgradeTo(url){
      if (this.upgraded) return;
      // load higher LOD and swap
      const gltf = await this._loadGLTF(url);
      // remove old model
      if (this.gltf && this.gltf.scene) this.scene.remove(this.gltf.scene);
      this.gltf = gltf;
      this.upgraded = true;
      window.PizjoPreloader._emitter.dispatchEvent(new CustomEvent('hero-upgraded'));
    }

    _animate(){
      if (!this.renderer) return;
      requestAnimationFrame(()=>this._animate());
      if (this.gltf && this.gltf.scene) this.gltf.scene.rotation.y += 0.002;
      this.renderer.render(this.scene, this.camera);
    }
  }

  global.PizjoHeroController = HeroController;
})(window);
