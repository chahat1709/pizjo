// Preloader: LQIP -> LOD1 staged loader
// Exposes events: 'lod1-loaded', 'hero-ready', 'hero-upgraded'
(function (global) {
  const emitter = new EventTarget();

  async function showPoster(posterUrl, containerSelector) {
    const container = document.querySelector(containerSelector) || document.body;
    let img = document.createElement('img');
    img.src = posterUrl;
    img.alt = 'Pizjo hero preview';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'cover';
    img.dataset.pizjoPoster = '1';
    container.appendChild(img);
    await img.decode().catch(()=>{});
    return img;
  }

  async function preloadLOD(lodUrl) {
    // fetch and cache the low LOD GLB without parsing heavy scene
    const res = await fetch(lodUrl, { cache: 'force-cache' });
    if (!res.ok) throw new Error('LOD fetch failed');
    const blob = await res.blob();
    // dispatch small event with blob URL to let hero-controller consume
    const objectUrl = URL.createObjectURL(blob);
    emitter.dispatchEvent(new CustomEvent('lod1-loaded', { detail: { url: objectUrl } }));
    return objectUrl;
  }

  function removePoster() {
    document.querySelectorAll('img[data-pizjo-poster]').forEach(n=>n.remove());
  }

  // Public API
  global.PizjoPreloader = {
    on: (name, cb) => emitter.addEventListener(name, cb),
    off: (name, cb) => emitter.removeEventListener(name, cb),
    showPoster,
    preloadLOD,
    removePoster,
    _emitter: emitter,
  };
})(window);
