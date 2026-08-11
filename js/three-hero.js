import * as THREE from 'three';
import { GLTFLoader, DRACOLoader } from 'three';

const GLB_URL = 'assets/dist/hero/hero_draco.glb'; // Draco-compressed Blender export
// Local draco decoder (served from project assets so we don't hit a CDN at runtime).
// PR-2: was 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/libs/draco/gltf/'
const DRACO_DECODER_PATH = 'assets/dist/vendor/draco/';

export function initThreeHero(containerId, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Skip WebGL entirely: keep the static poster (LQIP / fallback) visible.
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
        const poster = document.getElementById('hero-poster');
        if (poster) poster.style.opacity = '1';
        console.warn('[pizjo] WebGL unavailable – hero keeps static poster.');
        return;
    }

    const poster = document.getElementById('hero-poster');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 1.6, 9.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lights: warm key + amber accent (brand)
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffedd0, 2.4);
    key.position.set(4, 6, 5);
    scene.add(key);
    const accent = new THREE.PointLight(0xffbf00, 1.6, 40);
    accent.position.set(-4, 2, 3);
    scene.add(accent);

    const pizza = new THREE.Group();
    pizza.rotation.x = -0.35;
    scene.add(pizza);

    let fallback = false;

    function buildProceduralFallback() {
        console.warn('[pizjo] GLTF load failed – using procedural fallback pizza.');
        const layers = [];
        const layerDefs = [
            { name: 'crust', r: 3.2, h: 0.3, y: 0.0, color: 0xd2b48c, rough: 0.8 },
            { name: 'sauce', r: 3.0, h: 0.1, y: 0.2, color: 0xd32f2f, rough: 0.4 },
            { name: 'cheese', r: 2.9, h: 0.1, y: 0.3, color: 0xffe082, rough: 0.3 },
        ];
        layerDefs.forEach((l) => {
            const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(l.r, l.r, l.h, 48),
                new THREE.MeshStandardMaterial({ color: l.color, roughness: l.rough })
            );
            mesh.position.y = l.y;
            pizza.add(mesh);
            layers.push(mesh);
        });
        const pepGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16);
        const pepMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.5 });
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2.2;
            const pep = new THREE.Mesh(pepGeo, pepMat);
            pep.position.set(Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius);
            pizza.add(pep);
            layers.push(pep);
        }
        return { layers, exploded: 1.2, spin: 0.3 };
    }

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    // Telemetry hooks (PR-7): allow runtime perf tracking without forcing
    // a dependency on the telemetry module.
    const telemetry = (typeof window !== 'undefined' && window.PizjoTelemetry) || null;
    const t0 = (performance && performance.now) ? performance.now() : Date.now();

    loader.load(
        GLB_URL,
        (gltf) => {
            const model = gltf.scene;
            model.scale.setScalar(3.6);
            model.position.y = -0.15;
            model.rotation.y = Math.PI * 0.25;
            pizza.add(model);

            // ---- Blender-baked animation (build_pizza_anim.py) ----
            // Single "PizzaLife" clip (0..210f @30fps). Subclip it:
            //   Assemble (0..90)  -> play once, layers drop into place
            //   Idle    (90..210) -> loop-safe float + spin
            const clip = gltf.animations && gltf.animations[0];
            if (clip) {
                const mixer = new THREE.AnimationMixer(model);
                const FPS = 30;
                const assemble = THREE.AnimationUtils.subclip(
                    clip, 'Assemble', 0, 90, FPS
                );
                const idle = THREE.AnimationUtils.subclip(
                    clip, 'Idle', 90, 210, FPS
                );
                const assembleAction = mixer.clipAction(assemble);
                assembleAction.clampWhenFinished = true;
                assembleAction.loop = THREE.LoopOnce;
                assembleAction.play();
                mixer.addEventListener('finished', (e) => {
                    if (e.action === assembleAction) {
                        mixer.clipAction(idle).play();
                    }
                });
                pizza.userData.mixer = mixer;
                window.__pizjoMixer = mixer; // test hook
            }

            if (poster) poster.classList.add('hero-poster-fade');
            const dt = ((performance && performance.now) ? performance.now() : Date.now()) - t0;
            if (telemetry && telemetry.track) telemetry.track('hero_glb_loaded', { ms: Math.round(dt) });
        },
        undefined,
        (err) => {
            console.warn('[pizjo] GLTF load failed – using procedural fallback pizza.', err);
            fallback = buildProceduralFallback();
            // Keep the LQIP poster visible: failed 3D shouldn't strand a blank box.
            // Telemetry: notify so a reviewer can see the regression in dashboards.
            if (telemetry && telemetry.track) telemetry.track('hero_glb_failed', { url: GLB_URL });
        }
    );

    // Simple hover explode on the whole pizza group (labels optional)
    const heroVisual = document.querySelector('.hero-visual-box') || container;
    let exploded = false;
    heroVisual.addEventListener('pointerenter', () => { exploded = true; });
    heroVisual.addEventListener('pointerleave', () => { exploded = false; });

    const clock = new THREE.Clock();
    let last = 0;

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const dt = t - last;
        last = t;

        // Blender-baked animation drives rotation/float (PizzaLife clip).
        if (pizza.userData.mixer) {
            pizza.userData.mixer.update(dt);
        }
        // No JS spin here: baked Idle clip rotates the model. Only hover lift.
        if (fallback) {
            const target = exploded ? 1.4 : 0;
            pizza.children.forEach((c) => {
                c.position.y += (c.position.y * 0 + (target * 0.6) - c.position.y) * 0.08;
            });
        }
        pizza.position.y += (exploded ? 0.5 : 0) * 0.06 - pizza.position.y * 0.06;
        renderer.render(scene, camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
        const w = container.clientWidth || 300;
        const h = container.clientHeight || 600;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
    ro.observe(container);

    return { scene, camera, renderer, pizza };
}