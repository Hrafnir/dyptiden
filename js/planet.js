/* Version: #1 */
/* === PLANET RENDERER (SHADER BASED) === */

const Planet = {
    mesh: null,
    atmosphere: null,
    clouds: null,
    uniforms: null,

    init: function(scene) {
        // --- 1. JORDKLODEN (SHADER MATERIAL) ---
        
        // Shader Uniforms (Variabler vi kan endre fra JS)
        this.uniforms = {
            uTime: { value: 0.0 },
            uYear: { value: 4600.0 },
            uSunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
            uIceLevel: { value: 0.0 },     // 0 = Ingen is, 1 = Snøball
            uMagmaLevel: { value: 1.0 },   // 1 = Hadeikum, 0 = Nåtid
            uLifeLevel: { value: 0.0 }     // 0 = Barren, 1 = Grønn
        };

        // Vertex Shader (Form og Posisjon)
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vViewPosition;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        // Fragment Shader (Farger og Detaljer)
        const fragmentShader = `
            uniform float uTime;
            uniform float uYear;
            uniform float uIceLevel;
            uniform float uMagmaLevel;
            uniform float uLifeLevel;
            uniform vec3 uSunDirection;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vViewPosition;

            // --- NOISE FUNCTIONS (Simplex Noise) ---
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) { 
                const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx) ;
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
                i = mod289(i); 
                vec4 p = permute( permute( permute( 
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                float n_ = 0.142857142857; // 1.0/7.0
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            // --- FBM (Fractal Brownian Motion) for detaljer ---
            float fbm(vec3 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 2.0;
                for (int i = 0; i < 6; i++) {
                    value += amplitude * snoise(p * frequency);
                    frequency *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                // Roter støyen basert på tid for å simulere kontinentaldrift
                // Vi bruker uYear for å endre formen sakte, uTime for rotasjon
                float driftSpeed = 0.0005 * (4600.0 - uYear); // Endrer seg over tid
                vec3 noiseCoord = vPosition * 1.5 + vec3(driftSpeed, driftSpeed, 0.0);
                
                // Generer høydekart (-1 til 1)
                float height = fbm(noiseCoord); 
                
                // Fargepaletter
                vec3 oceanColorDeep = vec3(0.0, 0.05, 0.2);
                vec3 oceanColorShallow = vec3(0.0, 0.3, 0.6);
                vec3 landColorBarren = vec3(0.4, 0.3, 0.2); // Brun
                vec3 landColorLife = vec3(0.1, 0.5, 0.1);   // Grønn
                vec3 magmaColor = vec3(1.0, 0.2, 0.0);
                vec3 magmaDark = vec3(0.1, 0.0, 0.0);
                vec3 iceColor = vec3(0.9, 0.95, 1.0);

                vec3 finalColor = vec3(0.0);
                float specularity = 0.0;

                // --- 1. MAGMA FASE (Hadeikum) ---
                if (uMagmaLevel > 0.0) {
                    float lavaNoise = snoise(vPosition * 4.0 + uTime * 0.1);
                    vec3 lava = mix(magmaColor, magmaDark, smoothstep(-0.2, 0.5, lavaNoise));
                    // Legg til glødende sprekker
                    float cracks = 1.0 - abs(snoise(vPosition * 10.0));
                    lava += vec3(1.0, 0.8, 0.0) * smoothstep(0.95, 1.0, cracks) * 2.0;
                    
                    finalColor = lava;
                    specularity = 0.1; // Litt gjenskinn i flytende stein
                }

                // --- 2. VANLIG JORD (Arkeikum -> Nåtid) ---
                // Hvis magma avtar, bland inn vann og land
                if (uMagmaLevel < 1.0) {
                    // Definer land vs vann
                    float landThreshold = 0.05; // Juster denne for havnivå
                    bool isLand = height > landThreshold;

                    vec3 earthColor;
                    
                    if (isLand) {
                        // Landfarge: Bland brun og grønn basert på uLifeLevel
                        float mountainFactor = smoothstep(landThreshold, 1.0, height);
                        vec3 baseLand = mix(landColorBarren, vec3(0.3, 0.2, 0.1), mountainFactor); // Fjell er mørkere
                        earthColor = mix(baseLand, landColorLife, uLifeLevel * (1.0 - mountainFactor)); // Liv i lavlandet
                        specularity = 0.0;
                    } else {
                        // Havfarge: Dyp vs Grunt
                        earthColor = mix(oceanColorDeep, oceanColorShallow, smoothstep(-1.0, landThreshold, height));
                        specularity = 1.0;
                    }

                    // Bland magma med jord basert på uMagmaLevel
                    finalColor = mix(earthColor, finalColor, uMagmaLevel);
                }

                // --- 3. IS FASE (Snøballjord) ---
                if (uIceLevel > 0.0) {
                    // Is dekker alt hvis uIceLevel er 1.0, eller polene hvis mindre
                    // Her gjør vi det enkelt: uIceLevel blender alt mot hvitt
                    float iceNoise = fbm(vPosition * 10.0);
                    vec3 icySurface = mix(iceColor, vec3(0.7, 0.8, 0.9), iceNoise);
                    finalColor = mix(finalColor, icySurface, uIceLevel);
                    specularity = mix(specularity, 0.5, uIceLevel); // Is skinner litt
                }

                // --- LYSBEREGNING (Lambert + Specular) ---
                vec3 lightDir = normalize(uSunDirection);
                vec3 normal = normalize(vNormal);
                
                // Diffuse (Sollys)
                float diff = max(dot(normal, lightDir), 0.0);
                
                // Specular (Gjenskinn på hav)
                vec3 viewDir = normalize(vViewPosition);
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * specularity;

                // Ambient (Bakgrunnslys)
                vec3 ambient = vec3(0.05);

                // Legg sammen
                vec3 lighting = ambient + (diff + spec) * vec3(1.0);
                
                // Emissive (Magma skal lyse i mørket)
                if (uMagmaLevel > 0.5) {
                    lighting = vec3(1.0); // Ignorer skygger for lava
                }

                gl_FragColor = vec4(finalColor * lighting, 1.0);
            }
        `;

        // Lag materialet
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        // Geometri: Mye høyere oppløsning for at støyen skal se bra ut
        const geometry = new THREE.SphereGeometry(2.5, 128, 128);
        this.mesh = new THREE.Mesh(geometry, material);
        
        // --- 2. ATMOSFÆRE (GLØD) ---
        const atmoGeo = new THREE.SphereGeometry(2.65, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            uniforms: { 
                c: { type: "f", value: 0.5 },
                p: { type: "f", value: 4.0 },
                glowColor: { type: "c", value: new THREE.Color(0x00aaff) },
                viewVector: { type: "v3", value: new THREE.Vector3() }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 1.0);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        this.mesh.add(this.atmosphere);

        // --- 3. SKYER ---
        // En enkel transparent kule som roterer litt fortere
        const cloudGeo = new THREE.SphereGeometry(2.55, 64, 64);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            roughness: 1,
            metalness: 0
        });
        // Note: For ekte skyer trengs en tekstur, men vi bruker støy i shaderen for bakken.
        // For nå lar vi skyene være subtile eller dropper dem for å spare GPU hvis shaderen er tung.
        // Vi dropper sky-mesh for nå og lar shaderen ta seg av detaljene.

        scene.add(this.mesh);
        
        // Posisjon (samme som før)
        this.mesh.position.set(-5, 0, -2);
    },

    update: function(year, camera) {
        if (!this.mesh) return;

        // Oppdater Uniforms
        this.uniforms.uTime.value += 0.01;
        this.uniforms.uYear.value = year;

        // Oppdater Atmosfære-vinkel
        if (this.atmosphere) {
            this.atmosphere.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, this.mesh.position);
        }

        // --- STYR VERDENSTILSTAND BASERT PÅ ÅR ---
        
        // 1. Magma (Hadeikum: 4600 -> 4000)
        if (year > 4000) {
            this.uniforms.uMagmaLevel.value = 1.0;
            this.uniforms.uIceLevel.value = 0.0;
            this.uniforms.uLifeLevel.value = 0.0;
            this.atmosphere.material.uniforms.glowColor.value.setHex(0xff3300); // Rød atmosfære
        } 
        // Overgang Hadeikum -> Arkeikum
        else if (year > 3800) {
            let t = (year - 3800) / 200; // 0 til 1
            this.uniforms.uMagmaLevel.value = t;
            this.atmosphere.material.uniforms.glowColor.value.setHex(0xffaa00);
        }
        else {
            this.uniforms.uMagmaLevel.value = 0.0;
            this.atmosphere.material.uniforms.glowColor.value.setHex(0x00aaff); // Blå atmosfære
        }

        // 2. Snøballjord (Huronian: 2400-2100, Cryogenian: 720-635)
        let isSnowball = (year <= 2400 && year >= 2100) || (year <= 720 && year >= 635);
        if (isSnowball) {
            // Fade inn is
            this.uniforms.uIceLevel.value += 0.05; 
        } else {
            // Fade ut is
            this.uniforms.uIceLevel.value -= 0.05;
        }
        // Clamp (Hold mellom 0 og 1)
        this.uniforms.uIceLevel.value = Math.max(0, Math.min(1, this.uniforms.uIceLevel.value));

        // 3. Liv (Vegetasjon) - Starter rundt 450 Ma (Silur/Devon)
        if (year < 450) {
            let t = (450 - year) / 100; // Øker etterhvert som vi nærmer oss 0
            this.uniforms.uLifeLevel.value = Math.min(1.0, t);
        } else {
            this.uniforms.uLifeLevel.value = 0.0;
        }

        // Roter planeten
        this.mesh.rotation.y += 0.002;
    }
};
/* Version: #1 */
