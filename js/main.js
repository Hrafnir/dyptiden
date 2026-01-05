/* Version: #14 */
/* === MAIN ENGINE: DYPTIDS-REISEN (MONITOR) === */

if (typeof MILESTONES === 'undefined') console.error("Data error!");
if (typeof Planet === 'undefined') console.error("Planet renderer error!");

// GLOBALE
let scene, camera, renderer, starSystem;
let timeLineGroup;
let markers = [];

let isPlaying = false;
let currentYear = 4600.000000; 
let clock = new THREE.Clock();
let currentEraTitle = "";

const speedLevels = [1, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
let currentSpeedIdx = 3; 
let speed = speedLevels[currentSpeedIdx];

const ui = {
    year: document.getElementById('year-display'),
    nextEvent: document.getElementById('next-event-display'),
    countdown: document.getElementById('countdown-display'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    warpBtn: document.getElementById('warp-btn'),
    infoTitle: document.getElementById('info-title'),
    infoDesc: document.getElementById('info-desc'),
    sideImage: document.getElementById('side-image'),
    sideImageContainer: document.getElementById('side-image-container'),
    modal: document.getElementById('fullscreen-modal'),
    modalImage: document.getElementById('modal-image'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    // Monitorer
    o2Canvas: document.getElementById('o2-canvas'),
    co2Canvas: document.getElementById('co2-canvas'),
    o2Val: document.getElementById('o2-val'),
    co2Val: document.getElementById('co2-val')
};

function init() {
    setupUI();
    setupThreeJS();
    
    const startData = getMilestoneData(4600);
    updateInfoText(startData);
    updateSideImage(startData.img);
    
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
    ui.sideImageContainer.addEventListener('click', openModal);
    ui.closeModalBtn.addEventListener('click', closeModal);
}

function openModal() {
    if (isPlaying) toggleWarp();
    ui.modalImage.src = ui.sideImage.src;
    ui.modal.classList.add('active');
}
function closeModal() { ui.modal.classList.remove('active'); }

function updateSpeedDisplay() {
    let val = speed; let label = " år";
    if (val >= 1000000000) { val /= 1000000000; label = " mrd år"; }
    else if (val >= 1000000) { val /= 1000000; label = " mill år"; }
    else if (val >= 1000) { val /= 1000; label = " tusen år"; }
    ui.speedValue.innerText = val + label;
}

function setupThreeJS() {
    const container = document.getElementById('scene-container');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 0, 12); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x222222));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);

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

// --- ATMOSFÆRE DATA (Graph Logic) ---
function calculateAtmosphere(year) {
    let o2 = 0;
    let co2 = 0;

    // O2 Logikk
    if (year > 2450) o2 = 0.0; // Før GOE
    else if (year > 850) o2 = 1.0 + (Math.sin(year * 0.1) * 0.5); // Boring Billion
    else if (year > 400) {
        let p = (850 - year) / (850 - 400);
        o2 = 2 + (p * 18); // Stiger mot 20%
    } else {
        o2 = 21 + Math.sin(year * 0.05) * 5; // Nåtid
    }

    // CO2 Logikk
    if (year > 4000) co2 = 90;
    else {
        let p = (4000 - year) / 4000;
        co2 = 90 * Math.pow(0.01, p * 4); // Raskt fall
        if (year % 200 < 50) co2 += 0.5; // Vulkanske utbrudd
    }

    if(o2<0) o2=0; if(co2<0.04) co2=0.04;
    return { o2, co2 };
}

function drawMiniGraph(canvas, type, currentYear) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height;
    
    // Fade effekt
    ctx.fillStyle = 'rgba(0, 20, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = '#00ff41'; ctx.lineWidth = 2; ctx.beginPath();

    // Tegn en liten historikk (siste 500 mill år fra currentYear)
    for (let i = 0; i < w; i+=5) {
        let plotYear = currentYear + (i/w)*500; 
        if (plotYear > 4600) plotYear = 4600;
        
        const vals = calculateAtmosphere(plotYear);
        let val = (type === 'o2') ? vals.o2 : vals.co2;
        let max = (type === 'o2') ? 35 : 100;
        
        let y = h - (val / max * h);
        if (i===0) ctx.moveTo(w-i, y); else ctx.lineTo(w-i, y);
    }
    ctx.stroke();
}

// --- SIMULERING ---
function updateSimulation(dt) {
    if (currentYear <= 0) {
        isPlaying = false;
        ui.warpBtn.innerText = "FREMTIDEN ER NÅ";
        ui.year.innerText = "0 Ma";
        return;
    }

    const yearsTraveled = speed * dt;
    currentYear -= yearsTraveled / 1000000;
    if (currentYear < 0) currentYear = 0;

    // Display
    if (speed < 10000) ui.year.innerText = currentYear.toFixed(6) + " Ma";
    else if (speed < 1000000) ui.year.innerText = currentYear.toFixed(3) + " Ma";
    else ui.year.innerText = Math.floor(currentYear) + " Ma";
    
    const totalYearsLeft = currentYear * 1000000;
    const secondsLeft = totalYearsLeft / speed;
    ui.countdown.innerText = formatTime(secondsLeft);

    // Grafer
    const atmo = calculateAtmosphere(currentYear);
    ui.o2Val.innerText = atmo.o2.toFixed(1) + "%";
    ui.co2Val.innerText = atmo.co2.toFixed(1) + "%";
    drawMiniGraph(ui.o2Canvas, 'o2', currentYear);
    drawMiniGraph(ui.co2Canvas, 'co2', currentYear);

    // Hendelser
    const data = getMilestoneData(currentYear);
    ui.nextEvent.innerText = "NÅ: " + data.title;

    if (currentEraTitle !== data.title) {
        currentEraTitle = data.title;
        updateInfoText(data);
        updateSideImage(data.img);
        
        ui.warpBtn.style.boxShadow = "0 0 30px #fff";
        setTimeout(() => ui.warpBtn.style.boxShadow = "", 500);
    }

    // Tidslinje
    const zScale = 0.5;
    markers.forEach(m => {
        const z = (m.userData.year - currentYear) * -zScale;
        m.position.set(0.5, 0.5, z - 10);
        m.visible = (z < 10 && z > -500); 
    });

    Planet.update(currentYear, camera);
}

function updateInfoText(data) {
    ui.infoTitle.innerText = data.title;
    ui.infoDesc.innerText = data.desc;
}

function updateSideImage(imgName) {
    ui.sideImage.src = `images/${imgName}`;
    ui.sideImage.style.opacity = 0;
    setTimeout(() => ui.sideImage.style.opacity = 1, 200);
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
    isPlaying = !isPlaying;
    ui.warpBtn.innerText = isPlaying ? "PAUSE REISEN ||" : "FORTSETT REISEN ▶";
    ui.warpBtn.style.color = isPlaying ? "#fff" : "#00ff41";
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (isPlaying) {
        updateSimulation(dt);
        const pos = starSystem.geometry.attributes.position.array;
        for(let i=2; i<pos.length; i+=3) {
            let visualSpeed = Math.min(Math.log(speed) * 8, 200); 
            pos[i] += visualSpeed * dt; 
            if (pos[i] > 50) pos[i] = -400;
        }
        starSystem.geometry.attributes.position.needsUpdate = true;
    } else {
        Planet.update(currentYear, camera);
    }

    renderer.render(scene, camera);
}

window.onload = init;

/* Version: #14 */
