// Simple ScrollManager: maps a pinned element's scroll area to normalized progress [0..1]
// Usage: const sm = new PizjoScrollManager({pinSelector:'#hero-pin', length: window.innerHeight*2});
(function(global){
  class PizjoScrollManager {
    constructor(opts){
      this.pin = document.querySelector(opts.pinSelector);
      this.length = opts.length || (window.innerHeight * 1.5);
      this.onProgress = opts.onProgress || function(){};
      this._tick = this._tick.bind(this);
      this._init();
    }

    _init(){
      // Create spacer to allow pinning
      this.spacer = document.createElement('div');
      this.spacer.style.height = this.length + 'px';
      if (this.pin && this.pin.parentNode) this.pin.parentNode.insertBefore(this.spacer, this.pin.nextSibling);
      requestAnimationFrame(this._tick);
    }

    _tick(){
      if (!this.pin) return;
      const rect = this.pin.getBoundingClientRect();
      const vh = window.innerHeight;
      // when pin's top <= 0 and bottom >= 0 we are in pin area
      const start = Math.max(0, -rect.top);
      const progress = Math.min(1, start / (this.length - vh));
      this.onProgress(progress);
      requestAnimationFrame(this._tick);
    }
  }

  global.PizjoScrollManager = PizjoScrollManager;
})(window);
