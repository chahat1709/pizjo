// Lightweight runtime telemetry hooks with user consent
(function(global){
  // Check for user consent
  const hasConsent = localStorage.getItem('pizjoTelemetryConsent') === 'true';

  const telemetry = {
    enabled: hasConsent, // Respect user consent
    send: (evt, data)=>{
      if (!telemetry.enabled) return;
      // staging-only: post to /__telemetry (no server in repo)
      try {
        navigator.sendBeacon && navigator.sendBeacon('/__telemetry',
          JSON.stringify({evt, data, ts: Date.now()}));
      } catch(e){ console.warn('Telemetry send failed:', e); }
    }
  };

  // FPS meter: sample frames over interval and send average
  function startFPS(intervalMs=5000){
    let frames=0, last=performance.now();
    function tick(){ frames++; requestAnimationFrame(tick); }
    tick();
    setInterval(()=>{
      const now = performance.now();
      const fps = Math.round((frames*1000)/(now-last));
      telemetry.send('fps-sample', { fps });
      frames = 0; last = now;
    }, intervalMs);
  }

  // Public API with consent management
  global.PizjoTelemetry = {
    telemetry,
    startFPS,
    setConsent: (consent) => {
      telemetry.enabled = consent === true;
      localStorage.setItem('pizjoTelemetryConsent', consent === true ? 'true' : 'false');
      return telemetry.enabled;
    },
    hasConsent: () => hasConsent,
    enable: () => {
      telemetry.enabled = true;
      localStorage.setItem('pizjoTelemetryConsent', 'true');
      return true;
    },
    disable: () => {
      telemetry.enabled = false;
      localStorage.setItem('pizjoTelemetryConsent', 'false');
      return false;
    }
  };
})(window);
