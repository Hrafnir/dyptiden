/* Version: #8 */
/* === MAIN ENGINE: DYPTIDS-REISEN === */

// Sjekk at data er lastet
if (typeof MILESTONES === 'undefined') {
    console.error("CRITICAL ERROR: Data-modul (data.js) ikke funnet!");
    alert("Systemfeil: Kunne ikke laste data.js. Sjekk filbanene.");
} else {
    console.log("System: Starter hovedmotor...");
}

// --- GLOBALE VARIABLER ---
let scene, camera, renderer, globe, stars, volcanoGroup;
let isPlaying = false;
let currentYear = 4600; // Starter i fortiden
let currentEraTitle = ""; // For å spore endringer
const slider = document.getElementById('time-slider');
const yearDisplay = document.getElementById('year-display');
const autoplayBtn = document.getElementById('autoplay-btn');

// DOM Elementer for UI
const uiElements = {
    eraTitle: document.getElementById('era-title'),
    eraDesc: document.getElementById('era-description'),
    placeholder: document.getElementById('placeholder-visual'),
    o2Canvas: document.getElementById('o2-chart'),
    co2Canvas: document.getElementById('co2-chart'),
    o2Value: document.getElementById('o2-value'),
    co2Value: document.getElementById('co2-value')
};

// --- INITIERING ---
function init() {
    console.log("System: Initialiserer 3D-miljø...");
    
    // 1. Injiser Pop-up HTML (så vi slipper å endre index.html)
    injectPopupHTML();

    // 2. Start Three.js
    setupThreeJS();
    
    // 3. Sett opp event listeners
    slider.addEventListener('input', handleSliderInput);
    autoplayBtn.addEventListener('click', toggleAutoplay);
    window.addEventListener('resize', onWindowResize);

    // 4. Start loopen
    console.log("System: Starter animasjons-loop.");
    updateVisualization(currentYear); // Første oppdatering
    animate();
}

function injectPopupHTML() {
    // Sjekk om den allerede finnes for sikkerhets skyld
    if (!document.getElementById('event-popup')) {
        const popupHTML = `
            <div id="event-popup">
                <img id="popup-img" src="" alt="Event Bilde">
                <div class="popup-label" id="popup-text">HENDELSE</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    }
}

// --- THREE.JS SETUP ---
function setupThreeJS() {
    const container = document.getElementById('globe-container');
    
    // Scene
    scene = new THREE.Scene();
    
    // Kamera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lys
    const ambientLight = new THREE.AmbientLight(0x404040); 
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // KLODEN
    // Økt detaljgrad (fra 2 til 12) for en rundere, mer detaljert sfære
    const geometry = new THREE.IcosahedronGeometry(2, 12); 
    const material = new THREE.MeshStandardMaterial({
        color: 0xff3300, 
        roughness: 0.8,
        metalness: 0.2
    });
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // VULKANER (Legges til som barn av globe, så de roterer med den)
    createVolcanoes();

    // Stjernebakgrunn
    createStars();
}

function createVolcanoes() {
    volcanoGroup = new THREE.Group();
    globe.add(volcanoGroup); // Legg gruppen til kloden

    const volcanoCount = 30;
    const volcanoGeo = new THREE.ConeGeometry(0.08, 0.3, 5); // Små kjegler
    const volcanoMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff4400, // Glødende effekt
        emissiveIntensity: 0.8,
        flatShading: true
    });

    for(let i=0; i<volcanoCount; i++) {
        const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
        
        // Matematikk for å plassere dem tilfeldig på overflaten av en kule (radius 2)
        const phi = Math.random() * Math.PI * 2; // Vinkel rundt Y
        const theta = Math.random() * Math.PI;   // Vinkel fra topp til bunn
        const r = 2.0; // Radius på kloden

        // Kartesisk konvertering
        volcano.position.x = r * Math.sin(theta) * Math.cos(phi);
        volcano.position.y = r * Math.sin(theta) * Math.sin(phi);
        volcano.position.z = r * Math.cos(theta);

        // Roter vulkanen slik at den peker "utover" fra sentrum
        volcano.lookAt(0, 0, 0); 
        // lookAt peker fronten (Z) mot sentrum. Kjegler peker opp (Y). 
        // Vi må rotere den 90 grader for å få bunnen mot kloden.
        volcano.rotateX(-Math.PI / 2);

        volcanoGroup.add(volcano);
    }
}

function createStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    
    for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 80;
    }
    
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.15});
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}

// --- LOGIKK: BEREGNINGER ---

function getMilestoneData(year) {
    for (let m of MILESTONES) {
        if (year <= m.start && year >= m.end) {
            return m;
        }
    }
    return MILESTONES[MILESTONES.length - 1];
}

function calculateAtmosphere(year) {
    let o2 = 0;
    let co2 = 0;

    // OKSYGEN ($O_2$)
    if (year > 2450) o2 = 0.0; 
    else if (year > 850) o2 = 1.0 + (Math.sin(year) * 0.5); 
    else if (year > 400) {
        let progress = (850 - year) / (850 - 400);
        o2 = 2 + (progress * 13);
    } else o2 = 21 + Math.sin(year/50) * 5; 

    // CO2 ($CO_2$)
    if (year > 4000) co2 = 90; 
    else {
        let progress = (4000 - year) / 4000; 
        co2 = 90 * Math.pow(0.1, progress * 4); 
        if(year % 100 < 10) co2 += 5; 
    }

    if (o2 < 0) o2 = 0;
    if (co2 < 0.04) co2 = 0.04; 

    return { o2: o2.toFixed(1), co2: co2.toFixed(1) };
}

// --- VISUALISERING & OPPDATERING ---

function updateVisualization(year) {
    // 1. Hent data
    const data = getMilestoneData(year);
    const atmosphere = calculateAtmosphere(year);

    // 2. Oppdater UI Tekst
    yearDisplay.innerText = year + " Ma";
    
    // Sjekk om vi har byttet epoke/hendelse
    if (currentEraTitle !== data.title) {
        console.log(`System: Era endret til ${data.title}`);
        currentEraTitle = data.title;
        
        // Oppdater tekst
        uiElements.eraTitle.innerText = data.title;
        uiElements.eraDesc.innerText = data.desc;
        
        // Oppdater Dashbord-bilde
        const imagePath = `images/${data.img}`;
        uiElements.placeholder.innerHTML = `
            <img src="${imagePath}" alt="${data.title}">
        `;

        // UTLØS POP-UP EFFEKT
        triggerPopup(data.title, imagePath);
    }

    // 3. Oppdater Tallverdier & Grafer
    uiElements.o2Value.innerText = atmosphere.o2 + "%";
    uiElements.co2Value.innerText = atmosphere.co2 + "% (Est.)";
    drawChart(uiElements.o2Canvas, 'o2', year);
    drawChart(uiElements.co2Canvas, 'co2', year);

    // 4. Oppdater 3D Klode Farge
    const isSnowball = (year <= 2400 && year >= 2100) || (year <= 720 && year >= 635);
    
    if (isSnowball) {
        globe.material.color.setHex(0xffffff); 
        globe.material.emissive.setHex(0x555555); 
    } else {
        globe.material.color.setHex(data.color);
        globe.material.emissive.setHex(0x000000); 
    }

    // 5. Vulkan-logikk (Synlig kun før 2500 Ma)
    if (volcanoGroup) {
        if (year > 2500) {
            volcanoGroup.visible = true;
            // Pulserende glød
            const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
            volcanoGroup.children.forEach(v => {
                v.material.emissiveIntensity = 0.5 + pulse;
            });
        } else {
            volcanoGroup.visible = false;
        }
    }
}

function triggerPopup(title, imageSrc) {
    const popup = document.getElementById('event-popup');
    const popupImg = document.getElementById('popup-img');
    const popupText = document.getElementById('popup-text');

    if(popup && popupImg && popupText) {
        // Sett innhold
        popupImg.src = imageSrc;
        popupText.innerText = title;

        // Vis popup
        popup.classList.add('active');

        // Skjul etter 3 sekunder
        setTimeout(() => {
            popup.classList.remove('active');
        }, 3000);
    }
}

function drawChart(canvas, type, currentYear) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = '#004411';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.stroke();

    // Graf
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x <= w; x+=5) {
        const yearAtX = 4600 - (x / w) * 4600;
        const vals = calculateAtmosphere(yearAtX);
        let val = (type === 'o2') ? parseFloat(vals.o2) : parseFloat(vals.co2);
        let maxVal = (type === 'o2') ? 35 : 100;
        let y = h - (val / maxVal * h);
        if (y < 0) y = 0; if (y > h) y = h;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Markør
    const cursorX = ((4600 - currentYear) / 4600) * w;
    const currentVals = calculateAtmosphere(currentYear);
    let curVal = (type === 'o2') ? parseFloat(currentVals.o2) : parseFloat(currentVals.co2);
    let maxVal = (type === 'o2') ? 35 : 100;
    let curY = h - (curVal / maxVal * h);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cursorX, curY, 4, 0, Math.PI*2);
    ctx.fill();
}

// --- INTERAKSJON ---

function handleSliderInput(e) {
    currentYear = parseInt(e.target.value);
    updateVisualization(currentYear);
}

function toggleAutoplay() {
    isPlaying = !isPlaying;
    console.log("System: Autoplay status:", isPlaying);
    
    if (isPlaying) {
        autoplayBtn.innerText = "PAUSE SIMULERING ⏸";
        autoplayBtn.style.backgroundColor = "#00ff41";
        autoplayBtn.style.color = "#000";
    } else {
        autoplayBtn.innerText = "START SIMULERING [AUTOPLAY]";
        autoplayBtn.style.backgroundColor = "transparent";
        autoplayBtn.style.color = "#00ff41";
    }
}

function onWindowResize() {
    const container = document.getElementById('globe-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- ANIMASJON LOOP ---

function animate() {
    requestAnimationFrame(animate);

    // 1. Roter kloden
    if (globe) {
        globe.rotation.y += 0.002;
        stars.rotation.y -= 0.0005;
        
        // Få vulkaner til å pulsere hvis de er synlige
        if (volcanoGroup && volcanoGroup.visible) {
             // (Dette håndteres nå i updateVisualization for å spare ressurser)
        }
    }

    // 2. Autoplay
    if (isPlaying) {
        const speed = 10; 
        if (currentYear > 0) {
            currentYear -= speed;
            if (currentYear < 0) currentYear = 0;
            slider.value = currentYear;
            updateVisualization(currentYear);
        } else {
            console.log("System: Reisen avsluttet.");
            toggleAutoplay();
        }
    }

    // 3. Render
    renderer.render(scene, camera);
}

// Start applikasjonen når vinduet er lastet
window.onload = init;

/* Version: #8 */
