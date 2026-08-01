// Exploded view scrub controller
// Usage: const ctrl = new PizjoExplodedController({stages: [{id:'crust', url:'...'}, ...], container: '#hero'});
// Listens to progress (0..1) via `setProgress` or connects to ScrollManager.
(function(global){
  class PizjoExplodedController {
    constructor(opts){
      this.stages = opts.stages || [];
      this.container = document.querySelector(opts.container) || document.body;
      this.currentStage = -1;
      this._emitter = new EventTarget();
      this._loaded = new Map();
    }

    on(name, cb){ this._emitter.addEventListener(name, cb); }
    off(name, cb){ this._emitter.removeEventListener(name, cb); }

    // map normalized progress to stage index
    setProgress(p){
      p = Math.max(0, Math.min(1, p));
      const idx = Math.floor(p * this.stages.length);
      if (idx !== this.currentStage){
        this._changeStage(idx);
      }
    }

    async _changeStage(idx){
      const prev = this.currentStage; this.currentStage = idx;
      // dispatch stage change
      this._emitter.dispatchEvent(new CustomEvent('stage-changed', { detail: { from: prev, to: idx } }));
      // ensure current stage asset loaded
      await this._ensureStageLoaded(idx);
      // prefetch neighbors
      await Promise.all([this._ensureStageLoaded(idx-1), this._ensureStageLoaded(idx+1)]);
    }

    async _ensureStageLoaded(idx){
      if (idx < 0 || idx >= this.stages.length) return;
      const stage = this.stages[idx];
      if (!stage) return;
      if (this._loaded.has(stage.id)) return;
      try{
        // use PizjoPreloader to fetch arbitrary asset (blob) and create objectURL
        const res = await fetch(stage.url, { cache: 'force-cache' });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        this._loaded.set(stage.id, { url: objUrl, blob });
        this._emitter.dispatchEvent(new CustomEvent('stage-loaded', { detail: { stage: idx, id: stage.id, url: objUrl } }));
      }catch(e){
        console.warn('stage load failed', stage && stage.id, e);
      }
    }

    getLoaded(stageId){ return this._loaded.get(stageId); }
  }

  global.PizjoExplodedController = PizjoExplodedController;
})(window);
