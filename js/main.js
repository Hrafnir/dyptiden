/* Version: #12 */
/* === MAIN ENGINE: DYPTIDS-REISEN (HYPER-REALISM) === */

if (typeof MILESTONES === 'undefined') console.error("Data error!");
if (typeof Planet === 'undefined') console.error("Planet renderer error!");

// --- GLOBALE VARIABLER ---
let scene, camera, renderer, starSystem;
let timeLineGroup;
let markers = [];

// Tidsstyring
let isPlaying = false;
let isPausedForEvent = false; 
let currentYear = 4600.000000; 
let clock = new THREE.Clock();
let currentEraTitle = "";

// Hastighets-skala (Faktiske år per sekund)
const speedLevels = [
    1, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000
];
let currentSpeedIdx = 3; 
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
    
    const startData = getMilestoneData(4600);
    updateInfoText(startData);
    
    animate();
}

function setupUI() {
    ui.speedSlider.addEventListener('input', (e) => {
        currentSpeedIdx = parseInt(e.target.value);
        speed = speedLevels[currentSpeedIdx];
        updateSpeedDisplay();
    });
    
    updateSpeedDisplay();
    ui.warpBtn.addEventListener('click', toggleWarp);
}

function updateSpeedDisplay() {
    let val = speed;
    let label = " år";
    if (val >= 1000000000) { val /= 1000000000; label = " mrd år"; }
    else if (val >= 1000000) { val /= 1000000; label = " mill år"; }
    else if (val >= 1000) { val /= 1000; label = " tusen år"; }
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

// --- THREE.JS ---
function setupThreeJS() {
    const container = document.getElementById('scene-container');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 0, 12); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lys trengs ikke for shaderen (den er selvlysende/beregner lys selv), 
    // men vi beholder det for tidslinjen.
    scene.add(new THREE.AmbientLight(0x222222));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // INITIALISER DEN NYE PLANETEN
    Planet.init(scene);

    createTimeLine();
    createStars();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createTimeLine() {
    timeLineGroup = new THREE.Group();
    timeLineGroup.position.set(3, -2, 0);
    scene.add(timeLineGroup);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,10), new THREE.Vector3(0,0,-2000)]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.5 });
    timeLineGroup.add(new THREE.Line(lineGeo, lineMat));

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
    const pos = new Float32Array(4500); 
    for(let i=0; i<4500; i++) pos[i] = (Math.random() - 0.5) * 500;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starSystem = new THREE.Points(geo, new THREE.PointsMaterial({color: 0xffffff, size: 0.3}));
    scene.add(starSystem);
}

// --- SIMULERING & LOGIKK ---

function updateSimulation(dt) {
    if (currentYear <= 0) {
        isPlaying = false;
        ui.warpBtn.innerText = "FREMTIDEN ER NÅ";
        ui.year.innerText = "0 Ma";
        ui.countdown.innerText = "ANKOMST";
        return;
    }

    const yearsTraveled = speed * dt;
    const maTraveled = yearsTraveled / 1000000;
    
    currentYear -= maTraveled;
    if (currentYear < 0) currentYear = 0;

    // Display
    if (speed < 10000) ui.year.innerText = currentYear.toFixed(6) + " Ma";
    else if (speed < 1000000) ui.year.innerText = currentYear.toFixed(3) + " Ma";
    else ui.year.innerText = Math.floor(currentYear) + " Ma";
    
    const totalYearsLeft = currentYear * 1000000;
    const secondsLeft = totalYearsLeft / speed;
    ui.countdown.innerText = formatTime(secondsLeft);

    // Hendelser
    const data = getMilestoneData(currentYear);
    ui.nextEvent.innerText = "NÅ: " + data.title;

    if (currentEraTitle !== data.title) {
        currentEraTitle = data.title;
        isPlaying = false;
        isPausedForEvent = true;
        ui.warpBtn.innerText = "HENDELSE...";

        updateInfoText(data);
        triggerPopup(data.title, `images/${data.img}`, () => {
            if (isPausedForEvent) {
                isPlaying = true;
                isPausedForEvent = false;
                ui.warpBtn.innerText = "PAUSE REISEN ||";
            }
        });
    }

    // Tidslinje
    const zScale = 0.5;
    markers.forEach(m => {
        const z = (m.userData.year - currentYear) * -zScale;
        m.position.set(0.5, 0.5, z - 10);
        m.visible = (z < 10 && z > -500); 
    });

    // --- OPPDATER PLANETEN ---
    // Her kaller vi den nye shader-oppdateringen
    Planet.update(currentYear, camera);
}

function triggerPopup(title, src, onComplete) {
    if (!ui.popup) return;

    ui.popup.classList.remove('active');
    setTimeout(() => {
        ui.popupImg.src = src;
        ui.popupText.innerText = title;
        ui.popup.classList.add('active');
        setTimeout(() => {
            ui.popup.classList.remove('active');
            if (onComplete) onComplete();
        }, 5000); 
    }, 200);
}

function updateInfoText(data) {
    ui.infoTitle.innerText = data.title;
    ui.infoDesc.innerText = data.desc;
}

function formatTime(s) {
    if (s === Infinity) return "--";
    if (s <= 0) return "ANKOMST";
    const years = Math.floor(s / (86400 * 365));
    if (years > 0) return `> ${years} år`;
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
    if (isPausedForEvent) {
        isPausedForEvent = false;
        ui.popup.classList.remove('active');
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
        
        // Stjerner
        const pos = starSystem.geometry.attributes.position.array;
        for(let i=2; i<pos.length; i+=3) {
            let visualSpeed = Math.min(Math.log(speed) * 8, 200); 
            pos[i] += visualSpeed * dt; 
            if (pos[i] > 50) pos[i] = -400;
        }
        starSystem.geometry.attributes.position.needsUpdate = true;
    } else {
        // Selv om vi er pauset, oppdater planeten (for rotasjonens skyld)
        Planet.update(currentYear, camera);
    }

    renderer.render(scene, camera);
}

window.onload = init;

/* Version: #12 */
