// The local vendor bundle (assets/dist/vendor/three-bundle.js) re-exports
// GLTFLoader + DRACOLoader alongside the three core. The importmap maps the
// bare specifier "three" to that bundle, so we import everything from "three".
import * as THREE from 'three';
import { GLTFLoader, DRACOLoader } from 'three';

const GLB_URL = 'assets/dist/hero/hero_draco.glb'; // Draco-compressed Blender export (animated)
// Local draco decoder (served from project assets so we don't hit a CDN at runtime).
const DRACO_DECODER_PATH = 'assets/dist/vendor/draco/';

// The Blender recipe (tools/blender-mcp/recipes/build_pizza_anim.py) bakes ONE
// action "PizzaLife" @30fps: frames 0-90 = Assemble, frames 90-210 = Idle loop.
// We subclip it at runtime so Assemble plays once, then Idle loops forever.
const CLIP_NAME = 'PizzaLife';
const FPS = 30;
const ASSEMBLE_END_F = 90;
const IDLE_END_F = 210;

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
    camera.position.set(0, 5.2, 8.0);
    camera.lookAt(0, 0, 0);
    const pizza = new THREE.Group();
    pizza.rotation.x = -0.95; // tilt the pie toward the camera so we see its face
    scene.add(pizza);


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

    // Animation state
    let mixer = null;
    let idleAction = null;
    let hasGlbAnim = false;
    let fallbackSpin = false;

    const reducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function buildProceduralFallback() {
        console.warn('[pizjo] GLTF load failed – using procedural fallback pizza.');
        const layerDefs = [
            { r: 3.2, h: 0.3, y: 0.0, color: 0xd2b48c, rough: 0.8 },
            { r: 3.0, h: 0.1, y: 0.2, color: 0xd32f2f, rough: 0.4 },
            { r: 2.9, h: 0.1, y: 0.3, color: 0xffe082, rough: 0.3 },
        ];
        layerDefs.forEach((l) => {
            const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(l.r, l.r, l.h, 48),
                new THREE.MeshStandardMaterial({ color: l.color, roughness: l.rough })
            );
            mesh.position.y = l.y;
            pizza.add(mesh);
        });
        const pepGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16);
        const pepMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.5 });
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2.2;
            const pep = new THREE.Mesh(pepGeo, pepMat);
            pep.position.set(Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius);
            pizza.add(pep);
        }
        fallbackSpin = true; // no baked anim -> gentle code spin so it isn't dead
    }

    function setupAnimations(gltf, model) {
        const clips = gltf.animations || [];
        const clip = THREE.AnimationClip.findByName(clips, CLIP_NAME) || clips[0];
        if (!clip) {
            console.warn('[pizjo] GLB has no animations – falling back to code spin.');
            fallbackSpin = true;
            return;
        }
        hasGlbAnim = true;
        mixer = new THREE.AnimationMixer(model);

        if (reducedMotion) {
            // Respect reduced-motion: jump to the assembled rest pose, no playback.
            const t0 = ASSEMBLE_END_F / FPS;
            const still = mixer.clipAction(clip);
            still.play();
            mixer.setTime(t0);
            mixer.update(0);
            return;
        }

        // Subclip: Assemble (0..90) plays once, then Idle (90..210) loops.
        const assemble = THREE.AnimationUtils.subclip(clip, 'Assemble', 0, ASSEMBLE_END_F, FPS);
        const idle = THREE.AnimationUtils.subclip(clip, 'Idle', ASSEMBLE_END_F, IDLE_END_F, FPS);

        const assembleAction = mixer.clipAction(assemble);
        assembleAction.setLoop(THREE.LoopOnce, 1);
        assembleAction.clampWhenFinished = true;

        idleAction = mixer.clipAction(idle);
        idleAction.setLoop(THREE.LoopRepeat, Infinity);

        assembleAction.play();
        mixer.addEventListener('finished', (e) => {
            if (e.action === assembleAction && idleAction) {
                idleAction.reset().play();
                assembleAction.crossFadeTo(idleAction, 0.35, false);
            }
        });
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
            pizza.add(model);
            setupAnimations(gltf, model);
            if (poster) poster.classList.add('hero-poster-fade');
            const dt = ((performance && performance.now) ? performance.now() : Date.now()) - t0;
            if (telemetry && telemetry.track) telemetry.track('hero_glb_loaded', { ms: Math.round(dt), animated: hasGlbAnim });
        },
        undefined,
        (err) => {
            console.warn('[pizjo] GLTF load failed – using procedural fallback pizza.', err);
            buildProceduralFallback();
            if (telemetry && telemetry.track) telemetry.track('hero_glb_failed', { url: GLB_URL });
        }
    );

    // Hover: gently lift the whole pizza (kept subtle so it doesn't fight the anim)
    const heroVisual = document.querySelector('.hero-visual-box') || container;
    let hover = false;
    heroVisual.addEventListener('pointerenter', () => { hover = true; });
    heroVisual.addEventListener('pointerleave', () => { hover = false; });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();

        if (mixer) mixer.update(dt);            // baked Blender animation drives the model
        if (fallbackSpin) pizza.rotation.y += dt * 0.25; // only when no GLB anim

        // Subtle hover lift on the outer group (independent of baked motion)
        const targetY = hover ? 0.35 : 0;
        pizza.position.y += (targetY - pizza.position.y) * 0.08;

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

    return { scene, camera, renderer, pizza, get mixer() { return mixer; } };
}
