import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function initThreeHero(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // aspect ratio will be set by ResizeObserver
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights for Bright Cafe Theme
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xFFC107, 3.0, 100); // Pizjo Yellow accent
    pointLight.position.set(-5, 0, 5);
    scene.add(pointLight);

    // Exploded Pizza State
    let isHovered = false;
    
    // The Pizza Group to hold all layers
    const pizzaGroup = new THREE.Group();
    // Tilt it slightly so we can see the top
    pizzaGroup.rotation.x = Math.PI / 4; 
    scene.add(pizzaGroup);

    // Create Layers
    const layers = [];

    // 1. Crust Layer
    const crustGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.3, 32);
    const crustMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.8 });
    const crust = new THREE.Mesh(crustGeo, crustMat);
    crust.userData = { defaultY: 0, explodedY: -2.0, labelId: 'label-crust' };
    pizzaGroup.add(crust);
    layers.push(crust);

    // 2. Sauce Layer
    const sauceGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.1, 32);
    const sauceMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.4 });
    const sauce = new THREE.Mesh(sauceGeo, sauceMat);
    sauce.userData = { defaultY: 0.2, explodedY: -0.5, labelId: 'label-sauce' };
    pizzaGroup.add(sauce);
    layers.push(sauce);

    // 3. Cheese Layer
    const cheeseGeo = new THREE.CylinderGeometry(2.9, 2.9, 0.1, 32);
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xFFE082, roughness: 0.3 });
    const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
    cheese.userData = { defaultY: 0.3, explodedY: 1.0, labelId: 'label-cheese' };
    pizzaGroup.add(cheese);
    layers.push(cheese);

    // 4. Toppings Layer (Group of small pepperonis)
    const toppingsGroup = new THREE.Group();
    toppingsGroup.userData = { defaultY: 0.4, explodedY: 2.5, labelId: 'label-toppings' };
    
    const pepGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);
    const pepMat = new THREE.MeshStandardMaterial({ color: 0xB71C1C, roughness: 0.5 });
    
    // Scatter pepperonis
    for (let i = 0; i < 12; i++) {
        const pep = new THREE.Mesh(pepGeo, pepMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2.2;
        pep.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        toppingsGroup.add(pep);
    }
    pizzaGroup.add(toppingsGroup);
    layers.push(toppingsGroup);

    camera.position.z = 10;
    camera.position.y = 2;

    // Interaction
    const heroVisual = document.querySelector('.exploded-view-container') || container;
    
    heroVisual.addEventListener('pointerenter', () => {
        isHovered = true;
        const labelsContainer = document.getElementById('layer-labels');
        if (labelsContainer) labelsContainer.classList.add('visible');
    });
    
    heroVisual.addEventListener('pointerleave', () => {
        isHovered = false;
        const labelsContainer = document.getElementById('layer-labels');
        if (labelsContainer) labelsContainer.classList.remove('visible');
    });

    // Helper to map 3D position to 2D screen coordinates
    function updateLabelPosition(object, labelElement) {
        if (!labelElement) return;
        
        // Get world position of the layer
        const vector = new THREE.Vector3();
        object.getWorldPosition(vector);
        
        // Project to 2D
        vector.project(camera);
        
        // Convert to CSS coordinates relative to the container
        const widthHalf = container.clientWidth / 2;
        const heightHalf = container.clientHeight / 2;
        
        const x = (vector.x * widthHalf) + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;
        
        // Offset label to the right of the layer
        labelElement.style.left = `${x + 120}px`;
        labelElement.style.top = `${y}px`;
    }

    // Animation Loop
    const clock = new THREE.Clock();
    let lastTime = 0;
    
    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - lastTime;
        lastTime = elapsedTime;

        // Base rotation of the whole pizza
        pizzaGroup.rotation.y += deltaTime * 0.3;

        // Animate layers
        layers.forEach(layer => {
            const targetY = isHovered ? layer.userData.explodedY : layer.userData.defaultY;
            // Lerp Y position
            layer.position.y += (targetY - layer.position.y) * 0.1;
            
            // Sync label position
            if (isHovered) {
                const labelEl = document.querySelector(`.${layer.userData.labelId}`);
                updateLabelPosition(layer, labelEl);
            }
        });

        renderer.render(scene, camera);
    }
    
    animate();

    // Handle Resize using ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const width = entry.contentRect.width || container.clientWidth || 300;
            const height = entry.contentRect.height || container.clientHeight || 600;
            
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    });
    resizeObserver.observe(container);
}
