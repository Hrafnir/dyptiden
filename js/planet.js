/* Version: #3 */
/* === PLANET RENDERER (NATURAL & ATMOSPHERE FIX) === */

const Planet = {
    mesh: null,
    atmosphere: null,
    uniforms: null,

    init: function(scene) {
        
        this.uniforms = {
            uTime: { value: 0.0 },
            uYear: { value: 4600.0 },
            uSunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
            uIceLevel: { value: 0.0 },
            uMagmaLevel: { value: 1.0 },
            uLifeLevel: { value: 0.0 }
        };

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

            // --- IMPROVED NOISE ---
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
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i); 
                vec4 p = permute( permute( permute( 
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                float n_ = 0.142857142857;
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );
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

            float fbm(vec3 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 2.0;
                // Økt til 6 iterasjoner for mer detaljerte kystlinjer
                for (int i = 0; i < 6; i++) {
                    value += amplitude * snoise(p * frequency);
                    frequency *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            void main() {
                // KONTINENTAL DRIFT LOGIKK
                float timeMorph = (4600.0 - uYear) * 0.002; 
                // Økt frekvens (3.5) for å få FLERE kontinenter
                vec3 noiseCoord = vPosition * 3.5 + vec3(0.0, 0.0, timeMorph);
                
                float height = fbm(noiseCoord);
                
                // FARGER
                vec3 deepOcean = vec3(0.0, 0.02, 0.15);
                vec3 shallowOcean = vec3(0.0, 0.2, 0.5);
                vec3 barrenLand = vec3(0.35, 0.25, 0.15); 
                vec3 greenLand = vec3(0.05, 0.35, 0.05);  
                vec3 magma = vec3(1.0, 0.3, 0.0);
                vec3 magmaCool = vec3(0.2, 0.0, 0.0);
                
                vec3 finalColor = vec3(0.0);
                float specularity = 0.0;

                // 1. MAGMA
                if (uMagmaLevel > 0.0) {
                    float lavaNoise = snoise(vPosition * 3.0 + uTime * 0.2);
                    vec3 lavaBase = mix(magma, magmaCool, smoothstep(-0.3, 0.4, lavaNoise));
                    float cracks = smoothstep(0.6, 0.7, snoise(vPosition * 8.0));
                    lavaBase += vec3(1.0, 0.8, 0.2) * cracks * 2.0;
                    finalColor = lavaBase;
                    specularity = 0.2;
                }

                // 2. LAND / HAV
                if (uMagmaLevel < 1.0) {
                    // Lavere terskel for land (-0.05) gir MER landareal
                    float landThreshold = -0.05; 
                    float landFactor = step(landThreshold, height); 
                    
                    vec3 landC;
                    float lifeNoise = fbm(vPosition * 5.0);
                    vec3 bioColor = mix(barrenLand, greenLand, uLifeLevel * (0.5 + 0.5 * lifeNoise));
                    landC = bioColor;

                    vec3 oceanC = mix(deepOcean, shallowOcean, smoothstep(-1.0, landThreshold, height));
                    
                    vec3 earthC = mix(oceanC, landC, landFactor);
                    
                    specularity = mix(1.0, 0.0, landFactor); 
                    finalColor = mix(earthC, finalColor, uMagmaLevel);
                }

                // 3. IS
                if (uIceLevel > 0.0) {
                    float iceN = fbm(vPosition * 8.0);
                    vec3 iceC = mix(vec3(0.9, 0.95, 1.0), vec3(0.7), iceN * 0.5);
                    finalColor = mix(finalColor, iceC, uIceLevel);
                    specularity = mix(specularity, 0.4, uIceLevel);
                }

                // LYS
                vec3 lightDir = normalize(uSunDirection);
                vec3 normal = normalize(vNormal);
                float diff = max(dot(normal, lightDir), 0.0);
                
                vec3 viewDir = normalize(vViewPosition);
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 20.0) * specularity;

                vec3 ambient = vec3(0.02);
                vec3 lighting = ambient + (diff + spec);
                
                if (uMagmaLevel > 0.5) lighting = vec3(1.0); 

                gl_FragColor = vec4(finalColor * lighting, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        const geometry = new THREE.SphereGeometry(2.5, 128, 128);
        this.mesh = new THREE.Mesh(geometry, material);
        
        // ATMOSFÆRE (Tynnere og mer realistisk)
        const atmoGeo = new THREE.SphereGeometry(2.65, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            uniforms: { 
                c: { type: "f", value: 0.25 }, // Lavere intensitet
                p: { type: "f", value: 15.0 }, // MYE høyere power = tynnere kant
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

        scene.add(this.mesh);
        this.mesh.position.set(-5, 0, -2);
    },

    update: function(year, camera) {
        if (!this.mesh) return;

        this.uniforms.uTime.value += 0.01;
        this.uniforms.uYear.value = year;

        if (this.atmosphere) {
            this.atmosphere.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, this.mesh.position);
        }

        // FASER
        if (year > 4000) { 
            this.uniforms.uMagmaLevel.value = 1.0;
            this.uniforms.uIceLevel.value = 0.0;
            this.uniforms.uLifeLevel.value = 0.0;
            this.atmosphere.material.uniforms.glowColor.value.setHex(0xff3300);
        } else if (year > 3800) { 
            let t = (year - 3800) / 200;
            this.uniforms.uMagmaLevel.value = t;
            this.atmosphere.material.uniforms.glowColor.value.setHex(0xffaa00);
        } else { 
            this.uniforms.uMagmaLevel.value = 0.0;
            this.atmosphere.material.uniforms.glowColor.value.setHex(0x00aaff);
        }

        let isSnowball = (year <= 2400 && year >= 2100) || (year <= 720 && year >= 635);
        let targetIce = isSnowball ? 1.0 : 0.0;
        this.uniforms.uIceLevel.value += (targetIce - this.uniforms.uIceLevel.value) * 0.05;

        if (year < 450) {
            let t = (450 - year) / 100;
            this.uniforms.uLifeLevel.value = Math.min(1.0, t);
        } else {
            this.uniforms.uLifeLevel.value = 0.0;
        }

        this.mesh.rotation.y += 0.005;
    }
};
/* Version: #3 */
