/* Version: #15 */
/* 
    DATA KONFIGURASJON FOR DYPTIDS-REISEN
    -------------------------------------
    Fokus: Livets utvikling (Biologi & Zoologi)
    Målgruppe: Ungdomsskole
*/

const MILESTONES = [
    { 
        start: 4600, end: 4000, 
        title: "Hadeikum: Det store smellet", 
        color: 0xff3300, 
        desc: "Jorden er nyfødt og dekket av lava. En kollisjon skaper Månen. Ingen liv kan overleve her ennå.", 
        img: "01_hadean.png" 
    },
    { 
        start: 4000, end: 3600, 
        title: "Eoarkeikum: Vannverdenen", 
        color: 0x0066cc, 
        desc: "Jorden kjøles ned og blir et globalt hav. Dypt nede i varme kilder oppstår det aller første, enkle livet (bakterier).", 
        img: "02_waterworld.png" 
    },
    { 
        start: 3600, end: 3000, 
        title: "Paleoarkeikum: Stromatolitter", 
        color: 0x0088aa, 
        desc: "Bakterier bygger store tuer (stromatolitter) i strandkanten. De er planetens første 'arkitekter'.", 
        img: "03_stromatolites.png" 
    },
    { 
        start: 3000, end: 2300, 
        title: "Neoarkeikum: Oksygen-krisen", 
        color: 0x55aa55, 
        desc: "Cyanobakterier lærer fotosyntese! De lager oksygen, som får havet til å ruste (bli rødt) og dreper nesten alt annet liv.", 
        img: "04_goe.png" 
    },
    { 
        start: 2300, end: 1600, 
        title: "Paleoproterozoikum: Snøballjord", 
        color: 0xffffff, 
        desc: "Uten drivhusgasser fryser hele jorden til is. Livet klamrer seg fast nær vulkaner under isen.", 
        img: "05_snowball.png" 
    },
    { 
        start: 1600, end: 800, 
        title: "Mesoproterozoikum: Første flercellet liv", 
        color: 0xaabb00, 
        desc: "Rødalgen Bangiomorpha er det første livet vi ser som består av flere celler som samarbeider. Kjønnet formering oppstår!", 
        img: "06_bangiomorpha.png" 
    },
    { 
        start: 800, end: 541, 
        title: "Ediacara: De myke dyrene", 
        color: 0xffaa00, 
        desc: "Før skall og tenner fantes Ediacara-faunaen. Rare, flate skapninger som Dickinsonia som lå på havbunnen som levende matter.", 
        img: "07_ediacaran.png" 
    },
    { 
        start: 541, end: 485, 
        title: "Kambrium: Rovdyrene kommer", 
        color: 0x00dddd, 
        desc: "Livets 'Big Bang'. Dyr utvikler øyne, skall og tenner. Kjempe-reken Anomalocaris er verdens første super-rovdyr.", 
        img: "08_cambrian.png" 
    },
    { 
        start: 485, end: 443, 
        title: "Ordovicium: Blekksprutenes tid", 
        color: 0x0099cc, 
        desc: "Havet domineres av Orthoceras, blekkspruter med lange, kjegleformede skall. De første fiskene (uten kjeve) svømmer rundt.", 
        img: "09_ordovician.png" 
    },
    { 
        start: 443, end: 419, 
        title: "Silur: Sjøskorpioner", 
        color: 0xaaeeaa, 
        desc: "Skorpioner på størrelse med mennesker (Pterygotus) jakter i havet. På land begynner små, grønne planter å vokse.", 
        img: "10_silurian.png" 
    },
    { 
        start: 419, end: 359, 
        title: "Devon: Fisken går på land", 
        color: 0x228822, 
        desc: "Tiktaalik er 'missing link' mellom fisk og landdyr. Den bruker finnene sine til å krabbe opp på gjørmete elvebredder.", 
        img: "11_devonian.png" 
    },
    { 
        start: 359, end: 299, 
        title: "Karbon: Kjempeinsekter", 
        color: 0x004400, 
        desc: "Luften har så mye oksygen at insekter blir gigantiske. Øyenstikkeren Meganeura har et vingespenn på 70 cm!", 
        img: "12_carboniferous.png" 
    },
    { 
        start: 299, end: 252, 
        title: "Perm: Panserdyrene", 
        color: 0xcc8800, 
        desc: "Før dinosaurene regjerte pattedyrlignende krypdyr som Dimetrodon (med seil på ryggen). Jorda er tørr og varm.", 
        img: "13_permian.png" 
    },
    { 
        start: 252, end: 145, 
        title: "Jura: Gigantene", 
        color: 0x66cc66, 
        desc: "Dinosaurenes gullalder. Langhalser som Brachiosaurus spiser fra tretoppene. Fugler begynner å utvikle seg.", 
        img: "14_jurassic.png" 
    },
    { 
        start: 145, end: 66, 
        title: "Kritt: T-Rex sin tid", 
        color: 0x44aa44, 
        desc: "Tyrannosaurus Rex er kongen på haugen. Men i himmelen nærmer en asteroide seg som vil endre alt...", 
        img: "15_cretaceous.png" 
    },
    { 
        start: 66, end: 23, 
        title: "Paleogen: Hvalenes retur", 
        color: 0xddddaa, 
        desc: "Pattedyrene tar over verden. Noen går tilbake i havet og blir til hvaler, som rovdyret Basilosaurus.", 
        img: "16_paleogene.png" 
    },
    { 
        start: 23, end: 2, 
        title: "Neogen: Våre forfedre", 
        color: 0xeebb00, 
        desc: "På Afrikas savanner begynner aper å gå på to bein. Australopithecus ('Lucy') er en av våre tidligste slektninger.", 
        img: "17_neogene.png" 
    },
    { 
        start: 2, end: 0, 
        title: "Antropocen: Mennesket", 
        color: 0x0000ff, 
        desc: "Homo Sapiens sprer seg over hele kloden. Vi bygger byer, teknologi og former planeten mer enn noen art før oss.", 
        img: "18_anthropocene.png" 
    }
];

console.log("System: Biologi-data lastet. Antall milepæler:", MILESTONES.length);
/* Version: #15 */
