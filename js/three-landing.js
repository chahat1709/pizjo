(function() {
  const container = document.getElementById('webgl-container') || document.body;
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Use ResizeObserver to ensure canvas matches container size even if CSS loads late
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    }
  });
  resizeObserver.observe(container);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffd700, 1.2);
  mainLight.position.set(5, 10, 7);
  scene.add(mainLight);

  const fillLight = new THREE.PointLight(0xffffff, 0.8);
  fillLight.position.set(-5, -5, 5);
  scene.add(fillLight);

  // Group for all floating elements
  const group = new THREE.Group();
  scene.add(group);

  // Helper to create a low-poly pizza slice silhouette
  function createPizzaSlice() {
    const pizzaGroup = new THREE.Group();
    
    // Base crust (wedge)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(1, 2);
    shape.quadraticCurveTo(0, 2.2, -1, 2);
    shape.lineTo(0, 0);

    const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 50 });
    const slice = new THREE.Mesh(geometry, material);
    slice.rotation.x = -Math.PI / 2;
    pizzaGroup.add(slice);

    return pizzaGroup;
  }

  // Create floating "cheese chunks" and pizza slices
  const items = [];
  for (let i = 0; i < 25; i++) {
    const isSlice = Math.random() > 0.7;
    let mesh;
    
    if (isSlice) {
      mesh = createPizzaSlice();
      mesh.scale.setScalar(Math.random() * 0.4 + 0.2);
    } else {
      const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const mat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 30 });
      mesh = new THREE.Mesh(geo, mat);
    }

    mesh.position.set(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10 - 5
    );
    
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    const speed = Math.random() * 0.01 + 0.005;
    const rotSpeed = (Math.random() - 0.5) * 0.02;
    
    items.push({ mesh, speed, rotSpeed });
    group.add(mesh);
  }

  camera.position.z = 8;

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);

    // Parallax movement based on mouse & scroll
    group.rotation.x += (mouseY * 0.1 - group.rotation.x) * 0.05;
    group.rotation.y += (mouseX * 0.1 - group.rotation.y) * 0.05;
    
    // Container is now in document flow, so no need for heavy scroll compensation
    group.position.y = scrollY * 0.001;

    // Individual item motion
    items.forEach(item => {
      item.mesh.rotation.x += item.rotSpeed;
      item.mesh.rotation.y += item.rotSpeed;
      item.mesh.position.y += Math.sin(Date.now() * 0.001 * item.speed) * 0.01;
    });

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  animate();
})();
