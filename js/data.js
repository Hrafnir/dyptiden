/* Version: #3 */
/* 
    DATA KONFIGURASJON FOR DYPTIDS-REISEN
    -------------------------------------
    Denne filen inneholder en liste over geologiske tidsaldre (milepæler).
    Hvert objekt definerer:
    - start/end: Tidsintervall i millioner år før nåtid (Ma).
    - title: Navnet på perioden.
    - color: Hex-fargekode for 3D-kloden (0xRrGgBb).
    - desc: Tekstlig beskrivelse av hva som skjer.
    - img: Navn på bilde/plassholder tekst.
*/

const MILESTONES = [
    { 
        start: 4600, 
        end: 4000, 
        title: "Hadeikum", 
        color: 0xff3300, // Rød (Magma)
        desc: "Solsystemet dannes. Jorden er en vulkansk, smeltet klode. Månen dannes etter kollisjon med Theia. De første havene kondenserer mot slutten av perioden.", 
        img: "hadeikum_magma.jpg" 
    },
    { 
        start: 4000, 
        end: 3600, 
        title: "Eoarkeikum", 
        color: 0x0066cc, // Dyp Blå (Vannverden)
        desc: "Livets begynnelse? Jordskorpen størkner. En global vannverden oppstår. De aller første encellede organismene (prokaryoter) dukker opp rundt hydrotermiske skorsteiner.", 
        img: "eoarkeikum_water.jpg" 
    },
    { 
        start: 3600, 
        end: 3200, 
        title: "Paleoarkeikum", 
        color: 0x0088aa, // Blågrønn
        desc: "De første stromatolittene dannes. Anoksygenisk fotosyntese utvikles (lager ikke oksygen ennå). Mikrobielle matter dominerer i grunt vann.", 
        img: "stromatolitter.jpg" 
    },
    { 
        start: 3200, 
        end: 2800, 
        title: "Mesoarkeikum", 
        color: 0x009999, // Turkis (Cyanobakterier start)
        desc: "De første superkontinentene (Vaalbara) begynner å ta form. Cyanobakterier utvikler seg og begynner sakte å produsere oksygen som et avfallsstoff.", 
        img: "cyanobakterier.jpg" 
    },
    { 
        start: 2800, 
        end: 2400, 
        title: "Neoarkeikum", 
        color: 0x55aa55, // Rust-grønn
        desc: "Oksygenproduksjonen øker, men absorberes umiddelbart av jern i havet, noe som skaper 'Banded Iron Formations'. Tektonisk aktivitet øker.", 
        img: "iron_formations.jpg" 
    },
    { 
        start: 2400, 
        end: 2000, 
        title: "Paleoproterozoikum", 
        color: 0xffffff, // Hvit (Snøballjord)
        desc: "The Great Oxidation Event (GOE)! Oksygen dreper anaerobt liv. Metan i atmosfæren brytes ned, noe som utløser Huronian istid – Jorden blir en 'Snøball'. Første eukaryote celler oppstår.", 
        img: "snowball_earth.jpg" 
    },
    { 
        start: 2000, 
        end: 1600, 
        title: "Mesoproterozoikum (Columbia)", 
        color: 0xccaa00, // Gul-brun (Landmasse/Kjedelig)
        desc: "Superkontinentet Columbia dannes. Perioden kalles ofte 'Den kjedelige milliarden' på grunn av geologisk stabilitet og langsom evolusjon. Eukaryoter sprer seg.", 
        img: "columbia_continent.jpg" 
    },
    { 
        start: 1600, 
        end: 1200, 
        title: "Mesoproterozoikum (Bangiomorpha)", 
        color: 0xaabb00, // Lys grønn
        desc: "Flercellet liv oppstår (f.eks. rødalgen Bangiomorpha). Kloroplaster utvikles gjennom endosymbiose, som gir alger evnen til fotosyntese.", 
        img: "multicellular_life.jpg" 
    },
    { 
        start: 1200, 
        end: 800,  
        title: "Neoproterozoikum (Rodinia)", 
        color: 0x996633, // Brun (Rodinia)
        desc: "Superkontinentet Rodinia samles. En revolusjonær oppfinnelse skjer: Seksuell reproduksjon (kjønn). Dette akselererer evolusjonstakten betraktelig.", 
        img: "rodinia.jpg" 
    },
    { 
        start: 800,  
        end: 400,  
        title: "Kambrium & Tidlig Liv", 
        color: 0x00dddd, // Is til Liv (Overgang)
        desc: "Kryogenisk istid (Snøballjord igjen) etterfølges av Ediacara-faunaen og den Kambriske eksplosjonen. Livet tar sine første steg opp på land.", 
        img: "cambrian_explosion.jpg" 
    },
    { 
        start: 400,  
        end: 0,    
        title: "Fanerozoikum (Nåtid)", 
        color: 0x228822, // Frodig Grønn (Jorden i dag)
        desc: "Dinosaurenes tidsalder, fremveksten av pattedyr, og til slutt: Mennesket. Oksygennivået stabiliseres rundt 21%.", 
        img: "modern_earth.jpg" 
    }
];

// Logg til konsollen for å bekrefte at data er lastet
console.log("System: Data-modul lastet. Antall milepæler:", MILESTONES.length);
/* Version: #3 */
