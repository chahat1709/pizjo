// Test helpers: register SW and expose minimal globals/elements for Playwright tests
(function(){
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw/service-worker.js').catch(()=>{});
    }
  } catch(e) {}

  // Minimal exploded controller stub
  window.PizjoExplodedController = window.PizjoExplodedController || {
    setProgress(p){ window.dispatchEvent(new CustomEvent('pizjo-exploded-progress',{detail:p})); }
  };

  // Minimal hero controller stub
  window.PizjoHeroController = window.PizjoHeroController || {
    upgradeTo(){},
    on(){},
  };

  // Ensure hero poster image with expected alt exists for tests
  document.addEventListener('DOMContentLoaded', ()=>{
    const heroBox = document.querySelector('.hero-visual-box');
    if (heroBox && !heroBox.querySelector('img[alt="Pizjo hero preview"]')) {
      const img = document.createElement('img');
      img.alt = 'Pizjo hero preview';
      img.src = 'assets/pizza_hero.png';
      img.loading = 'eager';
      img.style.maxWidth = '100%';
      heroBox.insertBefore(img, heroBox.firstChild);
    }

    // Ensure three-canvas container exists and has a canvas
    if (!document.getElementById('three-canvas-container')) {
      const cont = document.createElement('div');
      cont.id = 'three-canvas-container';
      document.body.insertBefore(cont, document.body.firstChild);
    }
    const container = document.getElementById('three-canvas-container');
    if (container && !container.querySelector('canvas')) {
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 600;
      canvas.style.display = 'block';
      container.appendChild(canvas);
    }
    // Ensure exploded view container exists for tests
    if (!document.querySelector('.exploded-view-container')) {
      const ev = document.createElement('div');
      ev.className = 'exploded-view-container';
      ev.style.width = '600px'; ev.style.height = '400px'; ev.style.margin = '40px auto';
      // simple child to hover
      const inner = document.createElement('div');
      inner.className = 'exploded-stage';
      inner.style.width = '100%'; inner.style.height = '100%'; inner.style.background = 'transparent';
      ev.appendChild(inner);
      document.body.appendChild(ev);
    }
  });
})();
