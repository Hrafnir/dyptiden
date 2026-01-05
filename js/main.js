/* Version: #9 */
/* === MAIN ENGINE: DYPTIDS-REISEN (WARP EDITION) === */

// Sjekk at data er lastet
if (typeof MILESTONES === 'undefined') {
    console.error("CRITICAL ERROR: Data-modul (data.js) ikke funnet!");
} else {
    console.log("System: Starter Warp-Engine...");
}

// --- GLOBALE VARIABLER ---
let scene, camera, renderer, globe, starSystem, volcanoGroup;
let timeLineGroup; // Gruppe for linjen og markørene
let markers = [];  // Array for å holde styr på tekst-skiltene

// Tids-variabler
let isPlaying = false;
let currentYear = 4600; 
let speed = 100; // Millioner år per sekund (Ma/s)
let clock = new THREE.Clock(); // For å måle delta-tid
let currentEraTitle = ""; 

// DOM Elementer
const ui = {
    year: document.getElementById('year-display'),
    nextEvent: document.getElementById('next-event-display'),
    countdown: document.getElementById('countdown-display'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    warpBtn: document.getElementById('warp-btn'),
    popup: document.getElementById('event-popup'), // Vi bruker den dynamiske fra sist
    popupImg: document.getElementById('popup-img'),
    popupText: document.getElementById('popup-text')
};

// --- INITIERING ---
function init() {
    // 1. Setup UI
    setupUI();
    
    // 2. Injiser Popup HTML hvis den mangler
    injectPopupHTML();

    // 3. Start Three.js
    setupThreeJS();
    
    // 4. Start Animation Loop
    animate();
}

function setupUI() {
    ui.speedSlider.addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        ui.speedValue.innerText = speed;
    });

    ui.warpBtn.addEventListener('click', toggleWarp);
}

function injectPopupHTML() {
    if (!document.getElementById('event-popup')) {
        const popupHTML = `
            <div id="event-popup">
                <img id="popup-img" src="" alt="Event">
                <div class="popup-label" id="popup-text">HENDELSE</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        // Oppdater referansene
        ui.popup = document.getElementById('event-popup');
        ui.popupImg = document.getElementById('popup-img');
        ui.popupText = document.getElementById('popup-text');
    }
}

// --- THREE.JS SETUP ---
function setupThreeJS() {
    const container = document.getElementById('scene-container');
    
    scene = new THREE.Scene();
    
    // Kamera: Flyttet litt for å se både kloden (venstre) og tidslinjen (høyre)
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lys
    const ambientLight = new THREE.AmbientLight(0x222222); 
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // 1. KLODEN (Venstre side)
    createGlobe();

    // 2. TIDSLINJEN (Høyre side)
    createTimeLine();

    // 3. STJERNER (Warp effekt)
    createStars();

    // Responsivitet
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createGlobe() {
    // Icosahedron med detalj 12 for rundhet
    const geometry = new THREE.IcosahedronGeometry(2.5, 12); 
    const material = new THREE.MeshStandardMaterial({
        color: 0xff3300, 
        roughness: 0.7,
        metalness: 0.3
    });
    globe = new THREE.Mesh(geometry, material);
    
    // Plassering: Venstre side av skjermen
    globe.position.set(-4.5, 0, -2); 
    scene.add(globe);

    // Vulkaner
    createVolcanoes();
}

function createVolcanoes() {
    volcanoGroup = new THREE.Group();
    globe.add(volcanoGroup);

    const volcanoGeo = new THREE.ConeGeometry(0.1, 0.4, 6);
    const volcanoMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff5500,
        emissiveIntensity: 1,
        flatShading: true
    });

    for(let i=0; i<40; i++) {
        const v = new THREE.Mesh(volcanoGeo, volcanoMat);
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = 2.5; // Må matche klodens radius

        v.position.x = r * Math.sin(theta) * Math.cos(phi);
        v.position.y = r * Math.sin(theta) * Math.sin(phi);
        v.position.z = r * Math.cos(theta);

        v.lookAt(0,0,0);
        v.rotateX(-Math.PI / 2);
        volcanoGroup.add(v);
    }
}

function createTimeLine() {
    timeLineGroup = new THREE.Group();
    // Plassering: Høyre side, går innover i dypet
    timeLineGroup.position.set(3, -2, 0); 
    scene.add(timeLineGroup);

    // Den fysiske linjen (Tråden)
    const points = [];
    points.push(new THREE.Vector3(0, 0, 10));  // Nær kamera
    points.push(new THREE.Vector3(0, 0, -1000)); // Langt bak
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(lineGeo, lineMat);
    timeLineGroup.add(line);

    // Generer markører for hver 100 Ma
    // Vi lager dem én gang, og flytter dem i animasjonsloopen
    for (let y = 4600; y >= 0; y -= 100) {
        const sprite = createTextSprite(y + " Ma");
        // Lagre årstallet i sprite-objektet så vi kan regne posisjon senere
        sprite.userData = { year: y };
        timeLineGroup.add(sprite);
        markers.push(sprite);
    }
}

// Hjelpefunksjon for å lage tekst i 3D (Canvas -> Texture -> Sprite)
function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 60;
    canvas.width = 400;
    canvas.height = 100;

    ctx.font = `Bold ${fontSize}px "Courier New"`;
    ctx.fillStyle = "rgba(0, 255, 65, 1)";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);
    
    // Ramme rundt teksten (som på skissen)
    ctx.strokeStyle = "rgba(0, 255, 65, 0.8)";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 1, 1); // Skaler opp
    return sprite;
}

function createStars() {
    const geo = new THREE.BufferGeometry();
    const count = 1000;
    const pos = new Float32Array(count * 3);
    
    for(let i=0; i<count*3; i++) {
        pos[i] = (Math.random() - 0.5) * 400; // Større område
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({color: 0xffffff, size: 0.2});
    starSystem = new THREE.Points(geo, mat);
    scene.add(starSystem);
}

// --- LOGIKK ---

function getMilestoneData(year) {
    for (let m of MILESTONES) {
        if (year <= m.start && year >= m.end) {
            return m;
        }
    }
    return MILESTONES[MILESTONES.length - 1];
}

function formatCountdown(seconds) {
    if (seconds <= 0) return "ANKOMST: NÅTID";
    
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${d}d ${h}t ${m}m ${s}s`;
}

function updateSimulation(deltaTime) {
    if (currentYear <= 0) {
        isPlaying = false;
        ui.warpBtn.innerText = "REISEN ER OVER";
        return;
    }

    // WARP LOGIKK: Reduser årstall basert på fart og tid
    // speed = Ma per sekund. deltaTime = sekunder siden forrige frame.
    const yearDrop = speed * deltaTime;
    currentYear -= yearDrop;
    if (currentYear < 0) currentYear = 0;

    // 1. Oppdater HUD
    ui.year.innerText = Math.floor(currentYear) + " Ma";
    
    // Regn ut tid igjen
    const secondsLeft = currentYear / speed;
    ui.countdown.innerText = formatCountdown(secondsLeft);

    // 2. Sjekk Hendelser
    const data = getMilestoneData(currentYear);
    ui.nextEvent.innerText = "NÅ: " + data.title;

    if (currentEraTitle !== data.title) {
        currentEraTitle = data.title;
        triggerPopup(data.title, `images/${data.img}`);
        
        // Endre farge på kloden
        updateGlobeColor(data.color, currentYear);
    }

    // 3. Oppdater Markører (Tidslinjen)
    // Vi må flytte markørene mot kameraet basert på hvor vi er i tiden
    // Z = (MarkerYear - CurrentYear) * Scale
    // Hvis MarkerYear er 4000 og Current er 4600 -> Z = -600 (Langt unna)
    // Hvis MarkerYear er 4000 og Current er 4000 -> Z = 0 (Ved kamera)
    const zScale = 0.5; // Hvor tett markørene står
    
    markers.forEach(sprite => {
        const mYear = sprite.userData.year;
        const zPos = (mYear - currentYear) * -zScale; // Negativ Z er innover i skjermen
        
        // Plasser litt til høyre for linjen
        sprite.position.set(0.5, 0.5, zPos - 10); // -10 for å starte litt bak kamera-fokus
        
        // Skjul hvis de har passert kamera (blitt positive)
        if (zPos > 5) sprite.visible = false;
        else sprite.visible = true;
    });

    // 4. Oppdater Vulkaner
    updateVolcanoes(currentYear);
}

function updateGlobeColor(colorHex, year) {
    // Sjekk snøballjord
    const isSnowball = (year <= 2400 && year >= 2100) || (year <= 720 && year >= 635);
    if (isSnowball) {
        globe.material.color.setHex(0xffffff);
        globe.material.emissive.setHex(0x555555);
    } else {
        globe.material.color.setHex(colorHex);
        globe.material.emissive.setHex(0x000000);
    }
}

function updateVolcanoes(year) {
    if (volcanoGroup) {
        if (year > 2500) {
            volcanoGroup.visible = true;
            const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
            volcanoGroup.children.forEach(v => v.material.emissiveIntensity = 0.5 + pulse);
        } else {
            volcanoGroup.visible = false;
        }
    }
}

function triggerPopup(title, src) {
    if (ui.popup) {
        ui.popupImg.src = src;
        ui.popupText.innerText = title;
        ui.popup.classList.add('active');
        
        // Pause litt ved hendelser? Nei, "årene suser forbi" sa du.
        // Men vi kan vise bildet i 4 sekunder.
        setTimeout(() => {
            ui.popup.classList.remove('active');
        }, 4000);
    }
}

function toggleWarp() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        ui.warpBtn.innerText = "PAUSE REISEN ||";
        ui.warpBtn.style.color = "#fff";
    } else {
        ui.warpBtn.innerText = "FORTSETT REISEN ▶";
        ui.warpBtn.style.color = "#00ff41";
    }
}

// --- ANIMASJON LOOP ---

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta(); // Tid i sekunder siden forrige frame

    // 1. Logikk
    if (isPlaying) {
        updateSimulation(deltaTime);
        
        // Roter kloden fortere når vi reiser
        globe.rotation.y += 0.005; 
        
        // Warp effekt på stjerner (flytt dem mot kamera)
        const positions = starSystem.geometry.attributes.position.array;
        for(let i=2; i<positions.length; i+=3) {
            positions[i] += speed * deltaTime * 0.5; // Fart basert på reisefart
            if (positions[i] > 50) positions[i] = -300; // Reset stjerner som treffer kamera
        }
        starSystem.geometry.attributes.position.needsUpdate = true;

    } else {
        globe.rotation.y += 0.001; // Idle rotasjon
    }

    // 2. Render
    renderer.render(scene, camera);
}

// Start
window.onload = init;

/* Version: #9 */
