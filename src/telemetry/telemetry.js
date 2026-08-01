// Lightweight runtime telemetry hooks (staging only)
(function(global){
  const telemetry = {
    enabled: true,
    send: (evt, data)=>{
      if (!telemetry.enabled) return;
      // staging-only: post to /__telemetry (no server in repo)
      try { navigator.sendBeacon && navigator.sendBeacon('/__telemetry', JSON.stringify({evt, data, ts: Date.now()})); } catch(e){}
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

  global.PizjoTelemetry = { telemetry, startFPS };
})(window);
