/* Version: #5 */
/* 
    DATA KONFIGURASJON FOR DYPTIDS-REISEN
    -------------------------------------
    Basert på "Dyptidspedagogikk: En kronostratigrafisk analyse".
*/

const MILESTONES = [
    { 
        start: 4600, 
        end: 4000, 
        title: "Hadeikum: Smeltedigelen", 
        color: 0xff3300, 
        desc: "Jorden dannes av kosmisk støv og stein. 4,53 Ga kolliderer planeten Theia med Jorden; restene danner Månen. En glødende magma-klode kjøles sakte ned, og de første havene kondenserer fra en tykk, trykkende atmosfære.", 
        img: "hadean_magma.jpg" 
    },
    { 
        start: 4000, 
        end: 3600, 
        title: "Eoarkeikum: Vannverdenen", 
        color: 0x0066cc, 
        desc: "En global vannverden med kun små vulkanske øyer. Livet oppstår (Abiogenese) i hydrotermiske skorsteiner. Atmosfæren er oksygenfri og oransje av metan. De eldste bergartene (Acasta Gneiss) bevares.", 
        img: "eoarchean_water.jpg" 
    },
    { 
        start: 3600, 
        end: 3200, 
        title: "Paleoarkeikum: Stromatolitter", 
        color: 0x0088aa, 
        desc: "De første makrofossilene: Stromatolitter bygger rev i grunt vann. Anoksygenisk fotosyntese oppstår – bakterier utnytter sollys men lager svovel, ikke oksygen. Mulig dannelse av ur-kontinentet Vaalbara.", 
        img: "paleoarchean_stromatolites.jpg" 
    },
    { 
        start: 3200, 
        end: 2800, 
        title: "Mesoarkeikum: Is-Paradokset", 
        color: 0x009999, 
        desc: "Kontinentalsoklene vokser og gir livsrom. Cyanobakterier utvikler evnen til å splitte vann og lage Oksygen ($O_2$). Pongola-istiden (2,9 Ga) viser at klimaet svinger selv i en drivhusverden.", 
        img: "mesoarchean_ice.jpg" 
    },
    { 
        start: 2800, 
        end: 2400, 
        title: "Neoarkeikum: Oksygenkatastrofen", 
        color: 0x55aa55, 
        desc: "Havet 'ruster': Oksygen reagerer med jern og danner Båndet Jernmalm (BIF). Dette leder til The Great Oxidation Event (GOE). Oksygenet er giftig for det meste av liv, men åpner for effektiv aerob energi.", 
        img: "goe_red_ocean.jpg" 
    },
    { 
        start: 2400, 
        end: 2000, 
        title: "Paleoproterozoikum: Snøballjord", 
        color: 0xffffff, 
        desc: "Huronian-istiden gjør jorden til en hvit 'Snøball' etter at metan forsvinner. Vredefort-asteroiden treffer. Det største biologiske spranget skjer: Endosymbiose skaper den Eukaryote cellen (med kjerne).", 
        img: "snowball_earth.jpg" 
    },
    { 
        start: 2000, 
        end: 1600, 
        title: "Mesoproterozoikum I: Columbia", 
        color: 0xccaa00, 
        desc: "Superkontinentet Columbia dannes. 'Den kjedelige milliarden' preges av stabilitet. Havene er lagdelte (Canfield Ocean) med giftig svovel i dypet, noe som bremser utviklingen av avansert liv.", 
        img: "columbia_supercontinent.jpg" 
    },
    { 
        start: 1600, 
        end: 1200, 
        title: "Mesoproterozoikum II: Flercellethet", 
        color: 0xaabb00, 
        desc: "Rødalgen Bangiomorpha (1,2 Ga) er det første beviset på spesialisert flercellet liv. Kloroplaster oppstår ved at en celle 'spiser' en cyanobakterie uten å fordøye den – planteriket fødes.", 
        img: "bangiomorpha_algae.jpg" 
    },
    { 
        start: 1200, 
        end: 800,  
        title: "Neoproterozoikum I: Rodinia & Kjønn", 
        color: 0x996633, 
        desc: "Superkontinentet Rodinia samles. Oppfinnelsen av seksuell reproduksjon (kjønn) akselererer evolusjonen drastisk ved å stokke genene. Et evolusjonært våpenkappløp (pigger og panser) begynner.", 
        img: "rodinia_sex.jpg" 
    },
    { 
        start: 800,  
        end: 400,  
        title: "Neoproterozoikum II: Eksplosjon", 
        color: 0x00dddd, 
        desc: "Etter en ny Snøball-jord (Cryogenium) kommer Ediacara-faunaen (bløte dyr). Så smeller det: Den Kambriske Eksplosjon (541 Ma). Dyr får øyne, tenner og skall. Livet krabber opp på land i Silur.", 
        img: "cambrian_explosion.jpg" 
    },
    { 
        start: 400,  
        end: 0,    
        title: "Fanerozoikum: Land & Liv", 
        color: 0x228822, 
        desc: "Karbonskogene, Pangea, Dinosaurenes tidsalder og til slutt Pattedyr. Mennesket (Homo Sapiens) dukker opp helt i siste sekund av denne 4,6 milliarder år lange reisen.", 
        img: "phanerozoic_land.jpg" 
    }
];

console.log("System: Dyptidspedagogikk-data lastet. Antall faser:", MILESTONES.length);
/* Version: #5 */
