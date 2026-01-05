/* Version: #4 */
/* === MAIN ENGINE: DYPTIDS-REISEN === */

// Sjekk at data er lastet
if (typeof MILESTONES === 'undefined') {
    console.error("CRITICAL ERROR: Data-modul (data.js) ikke funnet!");
    alert("Systemfeil: Kunne ikke laste data.js. Sjekk filbanene.");
} else {
    console.log("System: Starter hovedmotor...");
}

// --- GLOBALE VARIABLER ---
let scene, camera, renderer, globe, stars;
let isPlaying = false;
let currentYear = 4600; // Starter i fortiden
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
    setupThreeJS();
    
    // Sett opp event listeners
    slider.addEventListener('input', handleSliderInput);
    autoplayBtn.addEventListener('click', toggleAutoplay);
    window.addEventListener('resize', onWindowResize);

    // Start loopen
    console.log("System: Starter animasjons-loop.");
    updateVisualization(currentYear); // Første oppdatering
    animate();
}

// --- THREE.JS SETUP ---
function setupThreeJS() {
    const container = document.getElementById('globe-container');
    
    // Scene
    scene = new THREE.Scene();
    
    // Kamera (Retro field of view)
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); // False antialias for retro-look
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lys
    const ambientLight = new THREE.AmbientLight(0x404040); // Mykt bakgrunnslys
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Kloden (Low Poly Icosahedron)
    // Radius 2, Detalj 2 (Lav detalj gir "kantete" look)
    const geometry = new THREE.IcosahedronGeometry(2, 2); 
    const material = new THREE.MeshStandardMaterial({
        color: 0xff3300, // Startfarge (Hadeikum)
        flatShading: true, // VIKTIG: Gir low-poly effekten
        roughness: 0.8,
        metalness: 0.2
    });
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Stjernebakgrunn
    createStars();
}

function createStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPos = new Float32Array(starCount * 3);
    
    for(let i=0; i<starCount*3; i++) {
        // Spre stjerner langt unna
        starPos[i] = (Math.random() - 0.5) * 80;
    }
    
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.15});
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}

// --- LOGIKK: BEREGNINGER ---

function getMilestoneData(year) {
    // Finn perioden som "year" faller innenfor
    // Vi bruker .find() fordi vi har sortert dataene, men en enkel loop er sikrere
    for (let m of MILESTONES) {
        if (year <= m.start && year >= m.end) {
            return m;
        }
    }
    // Fallback hvis vi er utenfor range (f.eks. år 0)
    return MILESTONES[MILESTONES.length - 1];
}

function calculateAtmosphere(year) {
    // En forenklet vitenskapelig modell for O2 og CO2
    
    let o2 = 0;
    let co2 = 0;

    // OKSYGEN ($O_2$)
    if (year > 2450) {
        // Før GOE (Great Oxidation Event)
        o2 = 0.0; 
    } else if (year > 850) {
        // "The Boring Billion" - Lavt oksygennivå
        o2 = 1.0 + (Math.sin(year) * 0.5); // Litt støy
    } else if (year > 400) {
        // Neoproterozoikum - Økning mot Kambrium
        // Lineær interpolasjon fra 2% til 15%
        let progress = (850 - year) / (850 - 400);
        o2 = 2 + (progress * 13);
    } else {
        // Fanerozoikum (Nåtid) - Høy O2
        // Svinger rundt 21%
        o2 = 21 + Math.sin(year/50) * 5; 
    }

    // CO2 ($CO_2$) - Generelt omvendt proporsjonal + vulkanisme
    if (year > 4000) {
        co2 = 90; // Ekstrem drivhuseffekt
    } else {
        // Eksponentielt fall
        let progress = (4000 - year) / 4000; 
        co2 = 90 * Math.pow(0.1, progress * 4); 
        // Legg til litt tilfeldig vulkansk aktivitet
        if(year % 100 < 10) co2 += 5; 
    }

    // Sørg for at vi ikke får negative tall
    if (o2 < 0) o2 = 0;
    if (co2 < 0.04) co2 = 0.04; // Dagens nivå ca

    return { 
        o2: o2.toFixed(1), 
        co2: co2.toFixed(1) 
    };
}

// --- VISUALISERING & OPPDATERING ---

function updateVisualization(year) {
    // 1. Hent data
    const data = getMilestoneData(year);
    const atmosphere = calculateAtmosphere(year);

    // 2. Oppdater UI Tekst
    yearDisplay.innerText = year + " Ma";
    
    // Kun oppdater DOM hvis teksten faktisk endres (for ytelse)
    if (uiElements.eraTitle.innerText !== data.title) {
        console.log(`System: Era endret til ${data.title}`);
        uiElements.eraTitle.innerText = data.title;
        uiElements.eraDesc.innerText = data.desc;
        
        // Oppdater bilde-plassholder tekst
        uiElements.placeholder.innerHTML = `
            <div style="text-align:center;">
                <strong>VISUELL DATABASE:</strong><br>
                ${data.img}<br><br>
                <span style="font-size:0.7em; color:#005511;">[RENDERING...]</span>
            </div>
        `;
    }

    // 3. Oppdater Tallverdier
    uiElements.o2Value.innerText = atmosphere.o2 + "%";
    uiElements.co2Value.innerText = atmosphere.co2 + "% (Est.)";

    // 4. Oppdater Grafer
    drawChart(uiElements.o2Canvas, 'o2', year);
    drawChart(uiElements.co2Canvas, 'co2', year);

    // 5. Oppdater 3D Klode Farge
    // Sjekk for spesifikke "Snøball-jord" tilstander som overstyrer fargen
    const isSnowball = (year <= 2400 && year >= 2100) || (year <= 720 && year >= 635);
    
    if (isSnowball) {
        globe.material.color.setHex(0xffffff); // Hvit is
        globe.material.emissive.setHex(0x555555); // Litt glød
    } else {
        globe.material.color.setHex(data.color);
        globe.material.emissive.setHex(0x000000); // Ingen glød
    }
}

function drawChart(canvas, type, currentYear) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Tøm canvas
    ctx.clearRect(0, 0, w, h);
    
    // Tegn rutenett (Retro grid)
    ctx.strokeStyle = '#004411';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); // Midtlinje
    ctx.stroke();

    // Tegn grafen
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Simuler hele historien (fra 4600 til 0) for å tegne kurven
    for (let x = 0; x <= w; x+=5) {
        // Regn om x-posisjon til årstall (X=0 er 4600 Ma, X=w er 0 Ma)
        const yearAtX = 4600 - (x / w) * 4600;
        const vals = calculateAtmosphere(yearAtX);
        
        let val = (type === 'o2') ? parseFloat(vals.o2) : parseFloat(vals.co2);
        
        // Normaliser verdien til Y-aksen (Høyde)
        // O2 max ca 35%, CO2 max ca 100%
        let maxVal = (type === 'o2') ? 35 : 100;
        let y = h - (val / maxVal * h);
        
        // Clamp Y
        if (y < 0) y = 0;
        if (y > h) y = h;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Tegn "Nå-markør"
    const cursorX = ((4600 - currentYear) / 4600) * w;
    
    // Vertikal linje
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, h);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Glødende prikk på kurven
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
    
    // Hvis brukeren drar i slideren mens autoplay kjører, bør vi kanskje pause?
    // For nå lar vi den kjøre, men oppdaterer året manuelt.
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

    // 1. Roter kloden (Alltid litt rotasjon for liv)
    if (globe) {
        globe.rotation.y += 0.002;
        stars.rotation.y -= 0.0005; // Stjerner roterer sakte motsatt vei
    }

    // 2. Håndter Autoplay
    if (isPlaying) {
        // Hvor fort skal tiden gå? 
        // La oss si 10 millioner år per frame
        const speed = 10; 
        
        if (currentYear > 0) {
            currentYear -= speed;
            if (currentYear < 0) currentYear = 0;
            
            // Oppdater slideren visuelt
            slider.value = currentYear;
            
            // Oppdater all grafikk
            updateVisualization(currentYear);
        } else {
            // Ferdig med reisen
            console.log("System: Reisen avsluttet (Nåtid nådd).");
            toggleAutoplay();
        }
    }

    // 3. Render scenen
    renderer.render(scene, camera);
}

// Start applikasjonen når vinduet er lastet
window.onload = init;

/* Version: #4 */
