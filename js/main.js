/* Version: #10 */
/* === MAIN ENGINE: DYPTIDS-REISEN (WARP 2.0) === */

if (typeof MILESTONES === 'undefined') console.error("Data error!");

// --- GLOBALE VARIABLER ---
let scene, camera, renderer, globe, starSystem, volcanoGroup;
let timeLineGroup;
let markers = [];

// Tidsstyring
let isPlaying = false;
let isPausedForEvent = false; // Ny flagg for hendelse-pause
let currentYear = 4600;
let clock = new THREE.Clock();
let currentEraTitle = "";

// Hastighets-skala (Logaritmisk)
// Index 0-7 fra slideren mappes til disse verdiene:
const speedLevels = [
    1,          // 1 år/s
    100,        // 100 år/s
    1000,       // 1 000 år/s
    10000,      // 10 000 år/s
    100000,     // 100 000 år/s
    1000000,    // 1 mill år/s
    10000000,   // 10 mill år/s
    100000000   // 100 mill år/s (Warp speed!)
];
let currentSpeedIdx = 3; // Start på 10 000
let speed = speedLevels[currentSpeedIdx];

// UI Referanser
const ui = {
    year: document.getElementById('year-display'),
    nextEvent: document.getElementById('next-event-display'),
    countdown: document.getElementById('countdown-display'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    warpBtn: document.getElementById('warp-btn'),
    infoTitle: document.getElementById('info-title'),
    infoDesc: document.getElementById('info-desc'),
    popup: null, popupImg: null, popupText: null
};

// --- INIT ---
function init() {
    setupUI();
    injectPopupHTML();
    setupThreeJS();
    
    // Sett start-tekst
    const startData = getMilestoneData(4600);
    updateInfoText(startData);
    
    animate();
}

function setupUI() {
    // Slider Logic
    ui.speedSlider.addEventListener('input', (e) => {
        currentSpeedIdx = parseInt(e.target.value);
        speed = speedLevels[currentSpeedIdx];
        updateSpeedDisplay();
    });
    
    // Initialvisning av fart
    updateSpeedDisplay();

    ui.warpBtn.addEventListener('click', toggleWarp);
}

function updateSpeedDisplay() {
    let val = speed;
    let label = " år";
    
    if (val >= 1000000) {
        val = val / 1000000;
        label = " mill år";
    } else if (val >= 1000) {
        val = val / 1000;
        label = " tusen år";
    }
    
    ui.speedValue.innerText = val + label;
}

function injectPopupHTML() {
    if (!document.getElementById('event-popup')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="event-popup">
                <img id="popup-img" src="" alt="Event">
                <div class="popup-label" id="popup-text">HENDELSE</div>
            </div>
        `);
    }
    ui.popup = document.getElementById('event-popup');
    ui.popupImg = document.getElementById('popup-img');
    ui.popupText = document.getElementById('popup-text');
}

// --- THREE.JS (Uendret logikk, men ryddig) ---
function setupThreeJS() {
    const container = document.getElementById('scene-container');
    scene = new THREE.Scene();
    
    // Justert kamera for bedre oversikt
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 0, 12); // Litt lenger ut

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x222222));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    createGlobe();
    createTimeLine();
    createStars();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createGlobe() {
    // Klode til venstre
    const geo = new THREE.IcosahedronGeometry(2.5, 12); 
    const mat = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.7 });
    globe = new THREE.Mesh(geo, mat);
    globe.position.set(-5, 0, -2); // Flyttet litt lenger til venstre
    scene.add(globe);
    createVolcanoes();
}

function createVolcanoes() {
    volcanoGroup = new THREE.Group();
    globe.add(volcanoGroup);
    const vGeo = new THREE.ConeGeometry(0.1, 0.4, 6);
    const vMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff5500 });

    for(let i=0; i<40; i++) {
        const v = new THREE.Mesh(vGeo, vMat);
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = 2.5;
        v.position.x = r * Math.sin(theta) * Math.cos(phi);
        v.position.y = r * Math.sin(theta) * Math.sin(phi);
        v.position.z = r * Math.cos(theta);
        v.lookAt(0,0,0); v.rotateX(-Math.PI / 2);
        volcanoGroup.add(v);
    }
}

function createTimeLine() {
    timeLineGroup = new THREE.Group();
    timeLineGroup.position.set(3, -2, 0); // Høyre side
    scene.add(timeLineGroup);

    // Lang linje
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,10), new THREE.Vector3(0,0,-2000)]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.5 });
    timeLineGroup.add(new THREE.Line(lineGeo, lineMat));

    // Markører
    for (let y = 4600; y >= 0; y -= 100) {
        const sprite = createTextSprite(y + " Ma");
        sprite.userData = { year: y };
        timeLineGroup.add(sprite);
        markers.push(sprite);
    }
}

function createTextSprite(msg) {
    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    cvs.width = 400; cvs.height = 100;
    ctx.font = "Bold 60px 'Courier New'";
    ctx.fillStyle = "#00ff41"; ctx.textAlign = "center";
    ctx.fillText(msg, 200, 70);
    ctx.strokeStyle = "rgba(0, 255, 65, 0.8)"; ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 380, 80);
    
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cvs) }));
    sprite.scale.set(4, 1, 1);
    return sprite;
}

function createStars() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(1500 * 3); // Flere stjerner
    for(let i=0; i<4500; i++) pos[i] = (Math.random() - 0.5) * 500;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starSystem = new THREE.Points(geo, new THREE.PointsMaterial({color: 0xffffff, size: 0.3}));
    scene.add(starSystem);
}

// --- SIMULERING & PAUSE LOGIKK ---

function updateSimulation(dt) {
    if (currentYear <= 0) {
        isPlaying = false;
        ui.warpBtn.innerText = "FREMTIDEN ER NÅ";
        return;
    }

    // Flytt tid
    const yearDrop = speed * dt;
    currentYear -= yearDrop;
    if (currentYear < 0) currentYear = 0;

    // UI Oppdatering
    ui.year.innerText = Math.floor(currentYear) + " Ma";
    const secondsLeft = currentYear / speed;
    ui.countdown.innerText = formatTime(secondsLeft);

    // Sjekk Hendelser
    const data = getMilestoneData(currentYear);
    ui.nextEvent.innerText = "NÅ: " + data.title;

    // HVIS NY EPOKE:
    if (currentEraTitle !== data.title) {
        currentEraTitle = data.title;
        
        // 1. Sett på pause
        isPlaying = false;
        isPausedForEvent = true;
        ui.warpBtn.innerText = "HENDELSE...";

        // 2. Oppdater Tekst i bunnen
        updateInfoText(data);

        // 3. Oppdater Klode Farge (mens vi venter)
        updateGlobeColor(data.color, currentYear);

        // 4. Vis Pop-up og start timer for fortsettelse
        triggerPopup(data.title, `images/${data.img}`, () => {
            // Callback når bildet er ferdig vist (5 sekunder)
            if (isPausedForEvent) { // Sjekk om brukeren ikke har stoppet manuelt
                isPlaying = true;
                isPausedForEvent = false;
                ui.warpBtn.innerText = "PAUSE REISEN ||";
            }
        });
    }

    // Tidslinje animasjon
    const zScale = 0.5;
    markers.forEach(m => {
        const z = (m.userData.year - currentYear) * -zScale;
        m.position.set(0.5, 0.5, z - 10);
        m.visible = (z < 10 && z > -500); // Optimalisering
    });

    updateVolcanoes(currentYear);
}

function triggerPopup(title, src, onComplete) {
    if (!ui.popup) return;

    // Bytt bilde mens opacity er 0 for å unngå glitch
    ui.popup.classList.remove('active');
    
    // Vent litt før vi bytter src og viser (sikrer at CSS transition rekker å skjule den gamle)
    setTimeout(() => {
        ui.popupImg.src = src;
        ui.popupText.innerText = title;
        ui.popup.classList.add('active');

        // Vent 5 sekunder, så skjul og gjenoppta
        setTimeout(() => {
            ui.popup.classList.remove('active');
            if (onComplete) onComplete();
        }, 5000); // 5 sekunder visningstid
    }, 200);
}

function updateInfoText(data) {
    ui.infoTitle.innerText = data.title;
    ui.infoDesc.innerText = data.desc;
}

function updateGlobeColor(hex, year) {
    const isSnowball = (year <= 2400 && year >= 2100) || (year <= 720 && year >= 635);
    globe.material.color.setHex(isSnowball ? 0xffffff : hex);
    globe.material.emissive.setHex(isSnowball ? 0x555555 : 0x000000);
}

function updateVolcanoes(year) {
    if (!volcanoGroup) return;
    volcanoGroup.visible = (year > 2500);
    if (volcanoGroup.visible) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
        volcanoGroup.children.forEach(v => v.material.emissiveIntensity = 0.5 + pulse);
    }
}

function formatTime(s) {
    if (s === Infinity) return "--";
    if (s <= 0) return "ANKOMST";
    const d = Math.floor(s/86400); s %= 86400;
    const h = Math.floor(s/3600); s %= 3600;
    const m = Math.floor(s/60);
    return `${d}d ${h}t ${m}m`;
}

function getMilestoneData(y) {
    for (let m of MILESTONES) if (y <= m.start && y >= m.end) return m;
    return MILESTONES[MILESTONES.length-1];
}

function toggleWarp() {
    // Hvis vi er i event-pause, tving fortsettelse
    if (isPausedForEvent) {
        isPausedForEvent = false;
        ui.popup.classList.remove('active'); // Fjern bildet med en gang
    }
    
    isPlaying = !isPlaying;
    ui.warpBtn.innerText = isPlaying ? "PAUSE REISEN ||" : "FORTSETT REISEN ▶";
    ui.warpBtn.style.color = isPlaying ? "#fff" : "#00ff41";
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (isPlaying) {
        updateSimulation(dt);
        
        // Roter kloden og flytt stjerner
        globe.rotation.y += 0.005;
        const pos = starSystem.geometry.attributes.position.array;
        for(let i=2; i<pos.length; i+=3) {
            // Visuell fart: Log(speed) for å unngå at stjernene blir streker
            let visualSpeed = Math.log(speed) * 10; 
            pos[i] += visualSpeed * dt; 
            if (pos[i] > 50) pos[i] = -400;
        }
        starSystem.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

window.onload = init;

/* Version: #10 */
