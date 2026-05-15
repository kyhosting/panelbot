const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const cheerio = require("cheerio");
const TelegramBot = require('node-telegram-bot-api');
const xlsx = require("xlsx");

// ==========================================
// ⚙️ DATA CONFIG & TELEGRAM BOT
// ==========================================
const TELEGRAM_TOKEN = "8794764974:AAHVdtg0hOlaQ8NfYd-LMWv0ecYEH12Qpfo"; 
const TELEGRAM_CHAT_ID = "-1003957189534"; 
const ADMIN_ID = "6396177371";  

// 📢 KONFIGURASI MULTI-FSUB DINAMIS
const FSUB_FILE = path.join(__dirname, 'fsub.json');
let WAJIB_GABUNG = [];

// Load data FSUB dari file (biar gak hilang kalau direstart)
if (fs.existsSync(FSUB_FILE)) {
    WAJIB_GABUNG = JSON.parse(fs.readFileSync(FSUB_FILE, 'utf8'));
} else {
    fs.writeFileSync(FSUB_FILE, JSON.stringify(WAJIB_GABUNG, null, 2));
}
            

const TOOLS_URL = "https://lamix.org/tools"; 

// 1. BUAT BOTNYA DULU
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// 2. BUAT FUNGSI LOG
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

// 3. BARU PASANG ANTI-CRASHNYA
// === ANTI CRASH KONEKSI TELEGRAM ===
bot.on("polling_error", (error) => {
    log(`⚠️ [TELEGRAM] Koneksi ngelag: ${error.message} (Aman, mencoba reconnect...)`);
});

let state = {
    lamix1: { cookie: "", lastId: null },
    roxy: { cookie: "", lastId: null },
    msi: { cookie: "", lastId: null },
    npanel: { cookie: "", lastId: null },
    proton: { cookie: "", lastId: null },
    purple: { cookie: "", lastId: null },
    flyn: { cookie: "", lastId: null },
    konekta: { cookie: "", lastId: null },
    ims: { cookie: "", lastId: null },
    sven1tel: { cookie: "", lastId: null },
    flex: { cookie: "", lastId: null },
    flex2: { cookie: "", lastId: null }
};

let banned_users = new Set();

// ==========================================
// 🌍 DATA BENDERA NEGARA (FULL PREMIUM EMOJI)
// ==========================================
let prefixes = {
    "1242": ["BAHAMA", "🇧🇸", "5294031587321600012"],
    "1246": ["BARBADOS", "🇧🇧", "5294526187165471742"],
    "1268": ["ANTIGUA DAN BARBUDA", "🇦🇬", "5294005972136647964"],
    "1473": ["GRENADA", "🇬🇩", "5222234560359577687"],
    "1758": ["SAINT LUCIA", "🇱🇨", "5224541228380467535"],
    "1767": ["DOMINIKA", "🇩🇲", "5294485513825178032"],
    "1784": ["SAINT VINCENT DAN GRENADINE", "🇻🇨", "5224660353593387686"],
    "1809": ["REPUBLIK DOMINIKA", "🇩🇴", "5294522197140857947"],
    "1868": ["TRINIDAD DAN TOBAGO", "🇹🇹", "5293993400767367408"],
    "1869": ["SAINT KITTS DAN NEVIS", "🇰🇳", "5222000927023577045"],
    "1876": ["JAMAIKA", "🇯🇲", "5294505107465982830"],
    "211": ["SUDAN SELATAN", "🇸🇸", "5294013428199869487"],
    "212": ["MAROKO", "🇲🇦", "5292108962391414885"],
    "213": ["ALJAZAIR", "🇩🇿", "5294048127240655242"],
    "216": ["TUNISIA", "🇹🇳", "5294484680601521871"],
    "218": ["LIBYA", "🇱🇾", "5291858711826946840"],
    "220": ["GAMBIA", "🇬🇲", "5294399820637688352"],
    "221": ["SENEGAL", "🇸🇳", "5292087023698466689"],
    "222": ["MAURITANIA", "🇲🇷", "5294429743674840973"],
    "223": ["MALI", "🇲🇱", "5292086972158858331"],
    "224": ["GUINEA", "🇬🇳", "5291892096607739008"],
    "225": ["IVORY COAST", "🇨🇮", "5293991322003200135"],
    "226": ["BURKINA FASO", "🇧🇫", "5294153164960848949"],
    "227": ["NIGER", "🇳🇪", "5291809418487290691"],
    "228": ["TOGO", "🇹🇬", "5294097669688415562"],
    "229": ["BENIN", "🇧🇯", "5293984969746566866"],
    "230": ["MAURITIUS", "🇲🇺", "5294127824653797277"],
    "231": ["LIBERIA", "🇱🇷", "5291793810576137439"],
    "232": ["SIERRA LEONE", "🇸🇱", "5294494314213167952"],
    "233": ["GHANA", "🇬🇭", "5294347396266873249"],
    "234": ["NIGERIA", "🇳🇬", "5294456308047563965"],
    "235": ["CHAD", "🇹🇩", "5291780728105753403"],
    "236": ["REPUBLIK AFRIKA TENGAH", "🇨🇫", "5294210571493724819"],
    "237": ["KAMERUN", "🇨🇲", "5291997306126626950"],
    "238": ["TANJUNG VERDE", "🇨🇻", "5292146096678658977"],
    "239": ["SAO TOME DAN PRINCIPE", "🇸🇹", "5294189019347833274"],
    "240": ["GUINEA KHATULISTIWA", "🇬🇶", "5292170045416297012"],
    "241": ["GABON", "🇬🇦", "5294321325815389139"],
    "242": ["REPUBLIK KONGO", "🇨🇬", "5294035229453865597"],
    "243": ["REPUBLIK DEMOKRATIK KONGO", "🇨🇩", "5224398158724871677"],
    "244": ["ANGOLA", "🇦🇴", "5294516785482062829"],
    "245": ["GUINEABISSAU", "🇬🇼", "5294409819321550432"],
    "248": ["SEYCHELLES", "🇸🇨", "5294494314213167952"],
    "249": ["SUDAN", "🇸🇩", "5224618146949773268"],
    "250": ["RWANDA", "🇷🇼", "5294191265615729158"],
    "251": ["ETIOPIA", "🇪🇹", "5292245976143124155"],
    "252": ["SOMALIA", "🇸🇴", "5294513087515216901"],
    "254": ["KENYA", "🇰🇪", "5292111852904416801"],
    "255": ["TANZANIA", "🇹🇿", "5293994384314882755"],
    "256": ["UGANDA", "🇺🇬", "5294192317882716626"],
    "257": ["BURUNDI", "🇧🇮", "5294051631933967760"],
    "258": ["MOZAMBIK", "🇲🇿", "5294086708931874940"],
    "260": ["ZAMBIA", "🇿🇲", "5294422158762592930"],
    "261": ["MADAGASKAR", "🇲🇬", "5291991568050312348"],
    "263": ["ZIMBABWE", "🇿🇼", "5294422158762592930"],
    "264": ["NAMIBIA", "🇳🇦", "5292021761670404922"],
    "265": ["MALAWI", "🇲🇼", "5294241881805312589"],
    "266": ["LESOTHO", "🇱🇸", "5292040693886247604"],
    "267": ["BOTSWANA", "🇧🇼", "5294026179957772585"],
    "268": ["ESWATINI", "🇸🇿", "5294312482477724867"],
    "269": ["KOMORO", "🇰🇲", "5294351381996521508"],
    "291": ["ERITREA", "🇪🇷", "5291922054004625949"],
    "351": ["PORTUGAL", "🇵🇹", "5294436555492973610"],
    "352": ["LUKSEMBURG", "🇱🇺", "5294423709245787718"],
    "353": ["IRLANDIA", "🇮🇪", "5294471971793293647"],
    "354": ["ISLANDIA", "🇮🇸", "5294354358408859664"],
    "355": ["ALBANIA", "🇦🇱", "5294202819077756005"],
    "356": ["MALTA", "🇲🇹", "5294532213004588353"],
    "357": ["SIPRUS", "🇨🇾", "5294279359689938006"],
    "358": ["FINLANDIA", "🇫🇮", "5294049961191690629"],
    "359": ["BULGARIA", "🇧🇬", "5294308947719640437"],
    "370": ["LITUANIA", "🇱🇹", "5294343084119708700"],
    "371": ["LATVIA", "🇱🇻", "5292236016113966127"],
    "372": ["ESTONIA", "🇪🇪", "5291951143818123103"],
    "373": ["MOLDOVA", "🇲🇩", "5294158486425325375"],
    "374": ["ARMENIA", "🇦🇲", "5291978717508164018"],
    "375": ["BELARUS", "🇧🇾", "5294134426018536120"],
    "376": ["ANDORRA", "🇦🇩", "5294215205763434181"],
    "377": ["MONAKO", "🇲🇨", "5294378161117614233"],
    "378": ["SAN MARINO", "🇸🇲", "5292183188016222701"],
    "379": ["VATIKAN", "🇻🇦", "5294235963340379688"],
    "380": ["UKRAINA", "🇺🇦", "5291928449210932974"],
    "381": ["SERBIA", "🇷🇸", "5291891186074672309"],
    "382": ["MONTENEGRO", "🇲🇪", "5224463399278096980"],
    "383": ["KOSOVO", "🇽🇰", "5433884162090088194"],
    "385": ["KROASIA", "🇭🇷", "5291999676948569127"],
    "386": ["SLOVENIA", "🇸🇮", "5294538440707166931"],
    "387": ["BOSNIA DAN HERZEGOVINA", "🇧🇦", "5224496092569155254"],
    "389": ["MAKEDONIA UTARA", "🇲🇰", "5294023611567332075"],
    "420": ["CEKO", "🇨🇿", "5294242852467923382"],
    "421": ["SLOWAKIA", "🇸🇰", "5294058817414255960"],
    "423": ["LIECHTENSTEIN", "🇱🇮", "5292048742654957785"],
    "501": ["BELIZE", "🇧🇿", "5294171848068584842"],
    "502": ["GUATEMALA", "🇬🇹", "5294336633078831209"],
    "503": ["EL SALVADOR", "🇸🇻", "5294337307388695687"],
    "504": ["HONDURAS", "🇭🇳", "5291901034434682297"],
    "505": ["NIKARAGUA", "🇳🇮", "5294240825243358100"],
    "506": ["KOSTA RIKA", "🇨🇷", "5292063805105263554"],
    "507": ["PANAMA", "🇵🇦", "5291959935616178405"],
    "509": ["HAITI", "🇭🇹", "5292045130587462814"],
    "591": ["BOLIVIA", "🇧🇴", "5294201479047957700"],
    "592": ["GUYANA", "🇬🇾", "5292062692708736193"],
    "593": ["EKUADOR", "🇪🇨", "5292083733753517221"],
    "595": ["PARAGUAY", "🇵🇾", "5294525611639852679"],
    "597": ["SURINAME", "🇸🇷", "5291737091238026321"],
    "598": ["URUGUAY", "🇺🇾", "5294448585696368047"],
    "670": ["TIMOR LESTE", "🇹🇱", "5294283689016973348"],
    "673": ["BRUNEI DARUSSALAM", "🇧🇳", "5292098293692650297"],
    "674": ["NAURU", "🇳🇷", "5294463274484521342"],
    "675": ["PAPUA NUGINI", "🇵🇬", "5291917995260533077"],
    "676": ["TONGA", "🇹🇴", "5294362935458548705"],
    "677": ["KEPULAUAN SOLOMON", "🇸🇧", "5294283890880433237"],
    "678": ["VANUATU", "🇻🇺", "5294476442854247878"],
    "679": ["FIJI", "🇫🇯", "5433640560134994324"],
    "680": ["PALAU", "🇵🇼", "5433852121634060293"],
    "685": ["SAMOA", "🇼🇸", "5292147350809106831"],
    "686": ["KIRIBATI", "🇰🇮", "5294538934628405146"],
    "688": ["TUVALU", "🇹🇻", "5294263837678131580"],
    "691": ["MIKRONESIA", "🇫🇲", "5291838156113470124"],
    "692": ["KEPULAUAN MARSHALL", "🇲🇭", "5294180730060954484"],
    "850": ["KOREA UTARA", "🇰🇵", "5294193812531333564"],
    "855": ["KAMBOJA", "🇰🇭", "5294225191562400452"],
    "856": ["LAOS", "🇱🇦", "5291981530711746037"],
    "880": ["BANGLADESH", "🇧🇩", "5291824687096027834"],
    "960": ["MALADEWA", "🇲🇻", "5292004203844097218"],
    "961": ["LEBANON", "🇱🇧", "5294193108156699621"],
    "962": ["YORDANIA", "🇯🇴", "5294100109229838880"],
    "963": ["SURIAH", "🇸🇾", "5294396668131692138"],
    "964": ["IRAK", "🇮🇶", "5294325010897327367"],
    "965": ["KUWAIT", "🇰🇼", "5292066437920218075"],
    "966": ["ARAB SAUDI", "🇸🇦", "5294163983983463099"],
    "967": ["YAMAN", "🇾🇪", "5291948395039054764"],
    "968": ["OMAN", "🇴🇲", "5291813666209946812"],
    "970": ["PALESTINA", "🇵🇸", "5294289826525238172"],
    "971": ["UNI EMIRAT ARAB", "🇦🇪", "5294314831824835370"],
    "972": ["ISRAEL", "🇮🇱", "5294069056616289553"],
    "973": ["BAHRAIN", "🇧🇭", "5294108398516720753"],
    "974": ["QATAR", "🇶🇦", "5292166360334357676"],
    "975": ["BHUTAN", "🇧🇹", "5294121983498277263"],
    "976": ["MONGOLIA", "🇲🇳", "5294316532631883496"],
    "977": ["NEPAL", "🇳🇵", "5294458756178924088"],
    "992": ["TAJIKISTAN", "🇹🇯", "5294120269806328883"],
    "993": ["TURKMENISTAN", "🇹🇲", "5294098958178603764"],
    "994": ["AZERBAIJAN", "🇦🇿", "5294323533428579078"],
    "995": ["GEORGIA", "🇬🇪", "5294349389131697267"],
    "996": ["KIRGISTAN", "🇰🇬", "5292091954320922577"],
    "998": ["UZBEKISTAN", "🇺🇿", "5294217645304864345"],
    "1": ["AMERIKA SERIKAT", "🇺🇸", "5294244076533600593"],
    "20": ["MESIR", "🇪🇬", "5293992082212409502"],
    "27": ["AFRIKA SELATAN", "🇿🇦", "5294325281480266304"],
    "30": ["YUNANI", "🇬🇷", "5294422158762592930"],
    "31": ["BELANDA", "🇳🇱", "5291917797692042265"],
    "32": ["BELGIA", "🇧🇪", "5291774466043435275"],
    "33": ["PRANCIS", "🇫🇷", "5291817660529533837"],
    "34": ["SPANYOL", "🇪🇸", "5292102670264328257"],
    "36": ["HUNGARIA", "🇭🇺", "5294229581018975260"],
    "39": ["ITALIA", "🇮🇹", "5291826830284709120"],
    "40": ["RUMANIA", "🇷🇴", "5294107724206856227"],
    "41": ["SWISS", "🇨🇭", "5294120269806328883"],
    "43": ["AUSTRIA", "🇦🇹", "5291975174160145850"],
    "44": ["BRITANIA RAYA", "🇬🇧", "5293993521026453119"],
    "45": ["DENMARK", "🇩🇰", "5294531860817268837"],
    "46": ["SWEDIA", "🇸🇪", "5291791748991835084"],
    "47": ["NORWEGIA", "🇳🇴", "5291761718580502030"],
    "48": ["POLANDIA", "🇵🇱", "5292190970496963836"],
    "49": ["JERMAN", "🇩🇪", "5292013274815028523"],
    "51": ["PERU", "🇵🇪", "5292099427564018941"],
    "52": ["MEKSIKO", "🇲🇽", "5294535073452809778"],
    "53": ["KUBA", "🇨🇺", "5291963947115631526"],
    "54": ["ARGENTINA", "🇦🇷", "5292208210495689627"],
    "55": ["BRASIL", "🇧🇷", "5291892229751723900"],
    "56": ["CHILI", "🇨🇱", "5294231037012888049"],
    "57": ["KOLOMBIA", "🇨🇴", "5294351381996521508"],
    "58": ["VENEZUELA", "🇻🇪", "5294476442854247878"],
    "60": ["MALAYSIA", "🇲🇾", "5291858351049696702"],
    "61": ["AUSTRALIA", "🇦🇺", "5294444247779399477"],
    "62": ["INDONESIA", "🇮🇩", "5224405893960969756"],
    "63": ["FILIPINA", "🇵🇭", "5291798075478661634"],
    "64": ["SELANDIA BARU", "🇳🇿", "5292087023698466689"],
    "65": ["SINGAPURA", "🇸🇬", "5294062721539526918"],
    "66": ["THAILAND", "🇹🇭", "5433629779767081651"],
    "7": ["RUSIA", "🇷🇺", "5294335323113807278"],
    "81": ["JEPANG", "🇯🇵", "5291799063321139445"],
    "82": ["KOREA SELATAN", "🇰🇷", "5294408281723262763"],
    "84": ["VIETNAM", "🇻🇳", "5291988613112814801"],
    "86": ["TIONGKOK", "🇨🇳", "5294068833277990704"],
    "90": ["TURKI", "🇹🇷", "5433684690923961019"],
    "91": ["INDIA", "🇮🇳", "5291933173674957761"],
    "92": ["PAKISTAN", "🇵🇰", "5291825606219029010"],
    "93": ["AFGHANISTAN", "🇦🇫", "5291937511591925566"],
    "94": ["SRI LANKA", "🇱🇰", "5292102670264328257"],
    "95": ["MYANMAR", "🇲🇲", "5294254478944393569"],
    "98": ["IRAN", "🇮🇷", "5294220170745630736"]
};

// ==========================================
// 📊 FUNGSI DATABASE EXCEL
// ==========================================
function saveComboXlsx(countryCode, numbersArray) {
    const filePath = path.join(__dirname, `${countryCode}.xlsx`);
    let existingData = [];
    if (fs.existsSync(filePath)) {
        const wb = xlsx.readFile(filePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        existingData = xlsx.utils.sheet_to_json(ws, { header: 1 }).map(row => String(row[0]));
    }
    const combined = [...new Set([...existingData, ...numbersArray])];
    const newWb = xlsx.utils.book_new();
    const newWs = xlsx.utils.aoa_to_sheet(combined.map(num => [num]));
    xlsx.utils.book_append_sheet(newWb, newWs, "Numbers");
    xlsx.writeFile(newWb, filePath);
}

function getComboXlsx(countryCode) {
    const filePath = path.join(__dirname, `${countryCode}.xlsx`);
    if (!fs.existsSync(filePath)) return [];
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    return xlsx.utils.sheet_to_json(ws, { header: 1 }).map(row => String(row[0])).filter(n => n && n !== "undefined");
}

function updateComboXlsx(countryCode, remainingNumbers) {
    const filePath = path.join(__dirname, `${countryCode}.xlsx`);
    if (remainingNumbers.length === 0) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return;
    }
    const newWb = xlsx.utils.book_new();
    const newWs = xlsx.utils.aoa_to_sheet(remainingNumbers.map(num => [num]));
    xlsx.utils.book_append_sheet(newWb, newWs, "Numbers");
    xlsx.writeFile(newWb, filePath);
}

function getCountryInfo(phone) {
    let p = phone.replace(/\D/g, '');
    for (let i = 4; i >= 1; i--) {
        let prefix = p.substring(0, i);
        if (prefixes[prefix]) {
            return { 
                code: prefixes[prefix][0], 
                flag: prefixes[prefix][1], 
                emojiId: prefixes[prefix][2]
            };
        }
    }
    return { code: "UNKNOWN", flag: "🌏", emojiId: null }; 
}


// --- Fungsi Bawaan Format Python (Ujung 4 Digit) ---
function maskNumber(number) {
    let num = number.replace(/[\+\s\-]/g, "");
    const mask = "⭒⭒TS⭒⭒";
    
    // Jika nomor cukup panjang, munculkan 5 digit awal dan 4 digit akhir
    if (num.length >= 9) {
        return `${num.substring(0, 5)}${mask}${num.substring(num.length - 4)}`;
    } 
    // Jika nomor pas 8 digit, munculkan 4 digit awal dan 4 digit akhir agar tidak tumpang tindih
    else if (num.length >= 8) {
        return `${num.substring(0, 4)}${mask}${num.substring(num.length - 4)}`;
    } 
    // Untuk nomor yang sangat pendek
    else if (num.length > 4) {
        return `${num.substring(0, 3)}${mask}${num.substring(num.length - 2)}`;
    }
    
    return `${num}${mask}`;
}

// ==========================================
// 📱 DATABASE LAYANAN & EMOJI PREMIUM
// ==========================================
let SERVICES = [
    // Sosmed & Chat
    { keys: ["whatsapp", "واتساب", "wtsapp", "wa"], tag: "WHATSAPP", fallback: "📱", id: "5334998226636390258" },
    { keys: ["telegram", "تيليجرام", "tg"], tag: "TELEGRAM", fallback: "✈️", id: "5330237710655306682" },
    { keys: ["instagram", "ig", "انستقرام"], tag: "INSTAGRAM", fallback: "📸", id: "5319160079465857105" },
    { keys: ["facebook", "fb", "meta", "فيسبوك"], tag: "FACEBOOK", fallback: "📘", id: "5323261730283863478" },
    { keys: ["tiktok"], tag: "TIKTOK", fallback: "🎵", id: "5327982530702359565" },
    { keys: ["twitter", "x.com"], tag: "TWITTER", fallback: "🐦", id: "5330337435500951363" },
    { keys: ["youtube"], tag: "YOUTUBE", fallback: "▶️", id: "5334681713316479679" },
    { keys: ["discord"], tag: "DISCORD", fallback: "🎮", id: "5325612636467903082" },
    { keys: ["tinder"], tag: "TINDER", fallback: "🔥", id: "5328029650788563621" },
    { keys: ["bumble"], tag: "BUMBLE", fallback: "🐝", id: "5323764984486837459" },
    { keys: ["line"], tag: "LINE", fallback: "💬", id: "5323608076446613036" },
    { keys: ["wechat"], tag: "WECHAT", fallback: "💬", id: "5330081305126255700" },
    { keys: ["snapchat"], tag: "SNAPCHAT", fallback: "👻", id: "5330248916224983855" },
    { keys: ["kakao", "kakaotalk"], tag: "KAKAOTALK", fallback: "🟡", id: "5334933574493683027" },
    { keys: ["viber"], tag: "VIBER", fallback: "📞", id: "5332449498553663205" },
    { keys: ["skype"], tag: "SKYPE", fallback: "☁️", id: "5328175271654736902" },
    { keys: ["signal"], tag: "SIGNAL", fallback: "🔵", id: "5328050550099427291" },
    { keys: ["linkedin"], tag: "LINKEDIN", fallback: "💼", id: "5346024520081751155" },
    { keys: ["twitch"], tag: "TWITCH", fallback: "🟣", id: "5334678011054669335" },
    { keys: ["reddit"], tag: "REDDIT", fallback: "👽", id: "5330321861949539755" },
    { keys: ["pinterest"], tag: "PINTEREST", fallback: "📌", id: "5346103513120258857" },
    { keys: ["vk", "vkontakte"], tag: "VK", fallback: "🔵", id: "5334853932915114338" },
    { keys: ["qq"], tag: "QQ", fallback: "🐧", id: "5328064671951896068" },
    { keys: ["weibo"], tag: "WEIBO", fallback: "👁️", id: "5332823323917173335" },
    
    // Tech & Akun
    { keys: ["gmail"], tag: "GMAIL", fallback: "📧", id: "5373246052868571826" },
    { keys: ["google"], tag: "GOOGLE", fallback: "🌐", id: "5359758030198031389" },
    { keys: ["apple", "icloud"], tag: "APPLE", fallback: "🍏", id: "5334955749409834455" },
    { keys: ["microsoft", "outlook", "hotmail", "live"], tag: "MICROSOFT", fallback: "🪟", id: "5370857634440170316" },
    { keys: ["amazon", "aws"], tag: "AMAZON", fallback: "🛒", id: "5346056560537779652" },
    { keys: ["github"], tag: "GITHUB", fallback: "🐱", id: "5346181118884331907" },
    { keys: ["chatgpt", "openai"], tag: "CHATGPT", fallback: "🤖", id: "5359726582447487916" },
    { keys: ["slack"], tag: "SLACK", fallback: "💬", id: "5363899233369868662" },
    { keys: ["notion"], tag: "NOTION", fallback: "📓", id: "5364199932620194408" },
    { keys: ["zoom"], tag: "ZOOM", fallback: "📹", id: "5334932883003949665" },
    
    // Hiburan & Game
    { keys: ["netflix"], tag: "NETFLIX", fallback: "🎬", id: "5318911503938634641" },
    { keys: ["spotify"], tag: "SPOTIFY", fallback: "🎧", id: "5346074681004801565" },
    { keys: ["disney"], tag: "DISNEY", fallback: "🏰", id: "5332394707655869572" },
    { keys: ["hulu"], tag: "HULU", fallback: "📺", id: "5346024142124633117" },
    { keys: ["steam"], tag: "STEAM", fallback: "💨", id: "5373144051690258848" },
    { keys: ["playstation", "sony"], tag: "PLAYSTATION", fallback: "🎮", id: "5373306783706137993" },
    { keys: ["xbox"], tag: "XBOX", fallback: "🎮", id: "5373019729566908647" },
    { keys: ["capcut"], tag: "CAPCUT", fallback: "✂️", id: "5364339557712020484" },

    // Keuangan & Belanja
    { keys: ["shopee"], tag: "SHOPEE", fallback: "🛍️", id: "5373265917092316632" },
    { keys: ["paypal"], tag: "PAYPAL", fallback: "💳", id: "5364111181415996352" },
    { keys: ["binance"], tag: "BINANCE", fallback: "💱", id: "5359584650958226302" },
    { keys: ["tether", "usdt"], tag: "TETHER", fallback: "🪙", id: "5359437015752401733" },
    { keys: ["ethereum", "eth"], tag: "ETHEREUM", fallback: "🪙", id: "5359321266383766546" },
    { keys: ["mastercard"], tag: "MASTERCARD", fallback: "💳", id: "5364036341610858181" },
    { keys: ["visa"], tag: "VISA", fallback: "💳", id: "5364075889669718872" },
    { keys: ["stripe"], tag: "STRIPE", fallback: "💳", id: "5346259862814734771" }
];

// 🔥 SYSTEM OTOMATIS MEMBUAT REGEX DARI DAFTAR DI ATAS
let APP_REGEX = new RegExp('\\b(' + SERVICES.flatMap(s => s.keys).join('|') + ')\\b', 'i');

// ==========================================
// 💾 SISTEM AUTO-SAVE DATABASE KE JSON
// ==========================================
const PREFIX_FILE = path.join(__dirname, 'prefixes.json');
const SERVICE_FILE = path.join(__dirname, 'services.json');

// Auto-Load / Auto-Create Data Negara
if (fs.existsSync(PREFIX_FILE)) {
    prefixes = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
} else {
    fs.writeFileSync(PREFIX_FILE, JSON.stringify(prefixes, null, 2));
}

// Auto-Load / Auto-Create Data Service
if (fs.existsSync(SERVICE_FILE)) {
    SERVICES = JSON.parse(fs.readFileSync(SERVICE_FILE, 'utf8'));
} else {
    fs.writeFileSync(SERVICE_FILE, JSON.stringify(SERVICES, null, 2));
}

// Fungsi Re-build Regex & Simpan
function updateAppRegex() {
    APP_REGEX = new RegExp('\\b(' + SERVICES.flatMap(s => s.keys).join('|') + ')\\b', 'i');
}
updateAppRegex();

const savePrefixes = () => fs.writeFileSync(PREFIX_FILE, JSON.stringify(prefixes, null, 2));
const saveServices = () => {
    fs.writeFileSync(SERVICE_FILE, JSON.stringify(SERVICES, null, 2));
    updateAppRegex();
};

function getServiceInfo(smsText) {
    function buildEmoji(id, fallback) {
        return id ? `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>` : fallback;
    }

    for (let svc of SERVICES) {
        for (let keyword of svc.keys) {
            // Jika kata kunci kurang dari 3 huruf (seperti "wa", "ig", "qq")
            // Gunakan deteksi kata utuh (\b) agar tidak salah baca
            if (keyword.length < 3 && !/[\u0600-\u06FF]/.test(keyword)) {
                let regex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (regex.test(smsText)) return { icon: buildEmoji(svc.id, svc.fallback), tag: svc.tag };
            } else {
                // Untuk kata panjang (whatsapp, telegram), pakai cara biasa
                if (smsText.toLowerCase().includes(keyword.toLowerCase())) {
                    return { icon: buildEmoji(svc.id, svc.fallback), tag: svc.tag };
                }
            }
        }
    }

    return { icon: "❓", tag: "UN" }; 
}

function detectLanguageFormat(text) {
    if (!text) return "ENGLISH";
    if (/[\u0600-\u06FF]/.test(text)) return "ARABIC";
    if (/[\u0400-\u04FF]/.test(text)) return "RUSSIAN";
    if (/[\u4E00-\u9FFF]/.test(text)) return "CHINESE";
    let t = text.toLowerCase();
    if (t.includes("kode") || t.includes("rahasia") || t.includes("jangan berikan") || t.includes("verifikasi")) return "INDONESIAN";
    if (t.includes("votre") || t.includes("code de") || t.includes("sécurité")) return "FRENCH";
    if (t.includes("código") || t.includes("codigo") || t.includes("cuenta")) return "SPANISH";
    if (t.includes("senha") || t.includes("verificação")) return "PORTUGUESE";
    if (t.includes("ihr code") || t.includes("bestätigung")) return "GERMAN";
    return "ENGLISH";
}

// --- Fungsi Pengubah Font Aesthetic (Small Caps) ---
function toCoolFont(text) {
    if (!text) return "";
    const chars = {
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ',
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(c => chars[c] || c).join('');
}

async function sendOTPTg(panelTag, sms) {
    let cInfo = getCountryInfo(sms.number);
    let serviceInfo = getServiceInfo(sms.rawMsg);
    let maskedNum = maskNumber(sms.number);
    let langTag = detectLanguageFormat(sms.rawMsg);

    // --- TAMBAHAN BARU: Terapkan font keren ---
    let coolCountry = toCoolFont(cInfo.code);
    let coolLang = toCoolFont(langTag);

    // ========================================================
    // 🔥 FILTER OTP MURNI (ANTI GABUNG ANGKA LINK) 🔥
    // ========================================================
    let pureOTP = sms.otpCode;
    
    // 1. Prioritaskan format khas WhatsApp (xxx-xxx) atau (xxx xxx)
    let waMatch = sms.rawMsg.match(/\d{3}[-\s]\d{3}/);
    
    // 2. Cari angka 4-8 digit yang tidak menempel dengan angka lain
    let digitsMatch = sms.rawMsg.match(/(?:^|\D)(\d{4,8})(?:\D|$)/);

    if (waMatch) {
        pureOTP = waMatch[0]; 
    } else if (digitsMatch) {
        pureOTP = digitsMatch[1]; 
    } else {
        // 3. Fallback jika format hancur
        let numbersOnly = sms.rawMsg.match(/\d+/g);
        if (numbersOnly) {
            let validOtp = numbersOnly.find(n => n.length >= 4 && n.length <= 8);
            if (validOtp) pureOTP = validOtp;
        }
    }
    // ========================================================

    let flagDisplay = cInfo.emojiId 
        ? `<tg-emoji emoji-id="${cInfo.emojiId}">${cInfo.flag}</tg-emoji>` 
        : cInfo.flag;

    const msg = `${flagDisplay} #${coolCountry}\n${serviceInfo.icon} | <i><code>${maskedNum}</code></i> | <tg-emoji emoji-id="6267229004311303657">🌐</tg-emoji> #${coolLang}`; 
    
    let btn = [
        [{ text: ` ${pureOTP}`, copy_text: { text: pureOTP }, style: "success" }], 
        [
            { 
                text: "𝘕𝘶𝘮𝘣𝘦𝘳", 
                url: "https://t.me/filets2bot?start=_tgr_KtD-15szMWE1", 
                style: "danger", // Mengubah warna tombol jadi merah
                icon_custom_emoji_id: "6215173330668884439" // ID Ikon Merah
            },
            { 
                text: "𝘊𝘩𝘢𝘯𝘯𝘦𝘭", 
                url: "https://t.me/thunderts1/5", 
                style: "danger", // Mengubah warna tombol jadi merah
                icon_custom_emoji_id: "6217644714980544148" // ID Ikon Doge
            }
        ]
    ];

    try {
        const sentMsg = await bot.sendMessage(TELEGRAM_CHAT_ID, msg, { parse_mode: "HTML", reply_markup: { inline_keyboard: btn } });
        log(`🔔 [${panelTag}] OTP TERKIRIM: ${pureOTP} (Akan dihapus otomatis dalam 5 menit)`);
        
        // 🕒 TIMER HAPUS PESAN OTOMATIS (5 Menit = 300000 ms)
        setTimeout(() => {
            bot.deleteMessage(TELEGRAM_CHAT_ID, sentMsg.message_id).catch(() => {});
        }, 300000);
    } catch (e) {
        log(`❌ [${panelTag}] Gagal kirim OTP ke Telegram: ${e.message}`);
    }
}

function updateCookie(existing, resHeaders) {
    let cookies = {};
    if (existing) {
        existing.split(';').forEach(c => {
            let [k, ...v] = c.trim().split('=');
            if (k) cookies[k] = v.join('=');
        });
    }
    if (resHeaders && resHeaders['set-cookie']) {
        resHeaders['set-cookie'].forEach(c => {
            let main = c.split(';')[0];
            let [k, ...v] = main.trim().split('=');
            if (k) cookies[k] = v.join('=');
        });
    }
    return Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ');
}

function getPanelDate(offsetDays = 0) {
    let d = new Date(); d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const otpClient = axios.create({
    timeout: 30000,
    headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest'
    }
});


async function processOTPData(allSms, stateKey, panelTag) {
    let smsToSend = [];
    if (state[stateKey].lastId === null || state[stateKey].lastId === "KOSONG") {
        smsToSend = allSms.slice(0, 3); 
    } else {
        for (let sms of allSms) {
            if (sms.id === state[stateKey].lastId) break;
            smsToSend.push(sms);
        }
    }
    if (smsToSend.length > 0) {
        state[stateKey].lastId = allSms[0].id;
        smsToSend.reverse(); 
        log(`🚀 [${panelTag}] Menarik ${smsToSend.length} OTP terbaru...`);
        for (let sms of smsToSend) {
            await sendOTPTg(panelTag, sms);
            await new Promise(r => setTimeout(r, 1500)); 
        }
    }
}

// ==========================================
// 1. LAMIX LOGIC
// ==========================================
const LAMIX1 = { url: "http://51.210.208.26", user: "rafli6281", pass: "@Rafli6336" };

async function checkLamix(config, stateKey, tag) {
    try {
        if (!state[stateKey].cookie) {
            log(`🔑 [${tag}] Membuka halaman login...`);
            const getReq = await otpClient.get(`${config.url}/ints/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [${tag}] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', config.user);
            params.append('password', config.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${config.url}/ints/signin`, params.toString(), {
                headers: { 'Origin': config.url, 'Referer': `${config.url}/ints/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: status => true
            });

            state[stateKey].cookie = updateCookie(currentCookie, res.headers);
            if (res.status === 302 || res.status === 301 || res.status === 303) {
                log(`🍪 [${tag}] Berhasil Login! Sesi diamankan.`);
            } else {
                log(`❌ [${tag}] Gagal login.`);
                state[stateKey].cookie = ""; return;
            }
        }
        
        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let sCol = encodeURIComponent(",,,,,,,,");
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fclient=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgclient=&fgnumber=&fgcli=&fg=0&sEcho=1&iColumns=9&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&mDataProp_7=7&sSearch_7=&bRegex_7=false&bSearchable_7=true&bSortable_7=true&mDataProp_8=8&sSearch_8=&bRegex_8=false&bSearchable_8=true&bSortable_8=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${config.url}/ints/agent/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state[stateKey].cookie, 'Referer': `${config.url}/ints/agent/SMSCDRReports` }, maxRedirects: 0, validateStatus: status => true });
        
        state[stateKey].cookie = updateCookie(state[stateKey].cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log(`⚠️ [${tag}] Sesi terputus.`); state[stateKey].cookie = ""; return; }
        if (!res.data || !res.data.aaData) return; 

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = row[5] ? String(row[5]).trim() : "";      
            
            if (!number || !rawMsg || rawMsg === "SMS") return;
            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        processOTPData(allSms, stateKey, tag);
    } catch(e) { log(`⚠️ [${tag}] Error: ${e.message}`); }
}

// ==========================================
// 2. ROXY PANEL (ORIGINAL LOGIC)
// ==========================================
const ROXY = { url: "http://www.roxysms.net", user: "Yurafli", pass: "@Rafli6336" };
async function checkRoxy() {
    try {
        if (!state.roxy.cookie) {
            log("🔑 [ROXY] Membuka halaman login...");
            const getReq = await otpClient.get(`${ROXY.url}/Login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [ROXY] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
                params.append('capt', jawaban.toString());
            }

            params.append('username', ROXY.user);
            params.append('password', ROXY.pass);

            const res = await otpClient.post(`${ROXY.url}/signin`, params.toString(), {
                headers: { 'Origin': ROXY.url, 'Referer': `${ROXY.url}/Login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie, 'Upgrade-Insecure-Requests': '1' },
                maxRedirects: 0, validateStatus: status => true
            });

            state.roxy.cookie = updateCookie(currentCookie, res.headers);
            
            if (res.status === 302 && res.headers.location === 'agent/') {
                log(`🍪 [ROXY] Berhasil Login! Sesi diamankan.`);
            } else if (state.roxy.cookie.includes("session") || state.roxy.cookie.includes("PHPSESSID")) {
                log(`🍪 [ROXY] Sesi PHPSESSID terdeteksi.`);
            } else {
                log("❌ [ROXY] Gagal login.");
                state.roxy.cookie = ""; return;
            }
        }

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fclient=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgclient=&fgnumber=&fgcli=&fg=0&sEcho=1&iColumns=7&sColumns=%2C%2C%2C%2C%2C%2C&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${ROXY.url}/agent/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.roxy.cookie, 'Referer': `${ROXY.url}/agent/SMSCDRReports` }, maxRedirects: 0, validateStatus: status => true });
        
        state.roxy.cookie = updateCookie(state.roxy.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [ROXY] Sesi terputus."); state.roxy.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = row[4] ? String(row[4]).trim() : ""; 
            if (!number || !rawMsg || rawMsg === "SMS") return;
            // Radar otomatis membaca 4 digit angka
            const otpMatch = rawMsg.match(/\d{4}[-\s]?\d{4}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        processOTPData(allSms, 'roxy', "ROXY");
    } catch(e) { log(`⚠️ [ROXY] Error: ${e.message}`); }
}

// ==========================================
// 3. MSI (ORIGINAL LOGIC WITH PHPSESSID)
// ==========================================
const MSI = { url: "http://145.239.130.45/ints", user: "zexxmix1", pass: "zexxmix1" };
async function checkMSI() {
    try {
        if (!state.msi.cookie) {
            log("🔑 [MSI] Membuka halaman login...");
            const getReq = await otpClient.get(`${MSI.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [MSI] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', MSI.user);
            params.append('password', MSI.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${MSI.url}/signin`, params.toString(), {
                headers: { 'Origin': "http://145.239.130.45", 'Referer': `${MSI.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: status => true
            });

            state.msi.cookie = updateCookie(currentCookie, res.headers);
            if (res.status === 302 || res.status === 301 || res.status === 303 || state.msi.cookie.includes("session") || state.msi.cookie.includes("PHPSESSID")) {
                log(`🍪 [MSI] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [MSI] Gagal login.");
                state.msi.cookie = ""; return;
            }
        }

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgnumber=&fgcli=&fg=0&sEcho=1&iColumns=7&sColumns=%2C%2C%2C%2C%2C%2C&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${MSI.url}/client/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.msi.cookie, 'Referer': `${MSI.url}/client/SMSCDRStats` }, maxRedirects: 0, validateStatus: status => true });
        
        state.msi.cookie = updateCookie(state.msi.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [MSI] Sesi terputus."); state.msi.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = row[4] ? String(row[4]).trim() : ""; 
            if (!number || !rawMsg || rawMsg === "SMS") return;
            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        processOTPData(allSms, 'msi', "MSI");
    } catch(e) { log(`⚠️ [MSI] Error: ${e.message}`); }
}

// ==========================================
// 4. NUMBER PANEL (ORIGINAL LOGIC WITH SESSKEY)
// ==========================================
const NPANEL = { url: "http://51.89.99.105/NumberPanel", user: "4workkteam", pass: "ranzotp" };
async function checkNPanel() {
    try {
        if (!state.npanel.cookie) {
            log("🔑 [NPANEL] Membuka halaman login...");
            const getReq = await otpClient.get(`${NPANEL.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [NPANEL] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', NPANEL.user);
            params.append('password', NPANEL.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${NPANEL.url}/signin`, params.toString(), {
                headers: { 'Origin': "http://51.89.99.105", 'Referer': `${NPANEL.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: status => true
            });

            state.npanel.cookie = updateCookie(currentCookie, res.headers);
            if (res.status === 302 || res.status === 301 || res.status === 303 || state.npanel.cookie.includes("session")) {
                log(`🍪 [NPANEL] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [NPANEL] Gagal login.");
                state.npanel.cookie = ""; return;
            }
        }

        let sesskey = "Q05RR0FQUUZCUg=="; 
        try {
            const dashReq = await otpClient.get(`${NPANEL.url}/client/SMSCDRStats`, { headers: { 'Cookie': state.npanel.cookie } });
            let match = dashReq.data.match(/sesskey=['"]?([^&'"\s>]+)/) || dashReq.data.match(/sesskey=([^&"'\s]+)/);
            if (match && match[1]) sesskey = match[1];
        } catch (e) {}

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let sCol = encodeURIComponent(",,,,,,"); 

        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgnumber=&fgcli=&fg=0&sesskey=${sesskey}&sEcho=1&iColumns=7&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${NPANEL.url}/client/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.npanel.cookie, 'Referer': `${NPANEL.url}/client/SMSCDRStats` }, maxRedirects: 0, validateStatus: status => true });
        
        state.npanel.cookie = updateCookie(state.npanel.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [NPANEL] Sesi terputus."); state.npanel.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = row[4] ? String(row[4]).trim() : ""; 
            if (!number || !rawMsg || rawMsg === "SMS") return;
            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        processOTPData(allSms, 'npanel', "NPANEL");
    } catch(e) { log(`⚠️ [NPANEL] Error: ${e.message}`); }
}

// ==========================================
// 5. PROTON SMS (ORIGINAL LOGIC WITH PHPSESSID & DYNAMIC ORIGIN)
// ==========================================
const PROTON = { url: "http://109.236.84.81/ints", user: "4ranzzotp", pass: "4ranzzotp" };
async function checkProton() {
    try {
        if (!state.proton.cookie) {
            log("🔑 [PROTON] Membuka halaman login...");
            const getReq = await otpClient.get(`${PROTON.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [PROTON] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', PROTON.user);
            params.append('password', PROTON.pass);
            params.append('capt', jawaban.toString()); 

            const originUrl = new URL(PROTON.url).origin; 
            const res = await otpClient.post(`${PROTON.url}/signin`, params.toString(), {
                headers: { 'Origin': originUrl, 'Referer': `${PROTON.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: status => true
            });

            state.proton.cookie = updateCookie(currentCookie, res.headers);
            if (res.status === 302 || res.status === 301 || res.status === 303 || state.proton.cookie.includes("session") || state.proton.cookie.includes("PHPSESSID")) {
                log(`🍪 [PROTON] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [PROTON] Gagal login.");
                state.proton.cookie = ""; return;
            }
        }

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgnumber=&fgcli=&fg=0&sEcho=1&iColumns=7&sColumns=%2C%2C%2C%2C%2C%2C&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${PROTON.url}/client/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.proton.cookie, 'Referer': `${PROTON.url}/client/SMSCDRStats` }, maxRedirects: 0, validateStatus: status => true });
        
        state.proton.cookie = updateCookie(state.proton.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [PROTON] Sesi terputus."); state.proton.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = row[4] ? String(row[4]).trim() : ""; 
            if (!number || !rawMsg || rawMsg === "SMS") return;
            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        processOTPData(allSms, 'proton', "PROTON");
    } catch(e) { log(`⚠️ [PROTON] Error: ${e.message}`); }
}

// ==========================================
// 6. PURPLE NUMBER (PENGGANTI SMS PRIVATE)
// ==========================================
const PURPLE = { base: "http://85.195.94.50/sms", url: "http://85.195.94.50/sms/reseller", user: "zyro28", pass: "@Rafli6336" };

async function checkPurple() {
    try {
        if (!state.purple.cookie) {
            log("🔑 [PURPLE NUMBER] Membuka halaman login Reseller...");
            const getReq = await otpClient.get(`${PURPLE.base}/SignIn`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            if (mathMatch) {
                let jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [PURPLE NUMBER] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
                params.append('capt', jawaban.toString());
            }

            params.append('username', PURPLE.user);
            params.append('password', PURPLE.pass);

            const res = await otpClient.post(`${PURPLE.base}/signmein`, params.toString(), {
                headers: { 'Origin': "http://85.195.94.50", 'Referer': `${PURPLE.base}/SignIn`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie, 'Upgrade-Insecure-Requests': '1' },
                maxRedirects: 0, validateStatus: status => true
            });

            state.purple.cookie = updateCookie(currentCookie, res.headers);
            
            if (res.status === 302 && (res.headers.location === 'reseller/' || res.headers.location === '/sms/reseller/' || res.headers.location === './')) {
                log(`🍪 [PURPLE NUMBER] Berhasil Login! Mampir ke dashboard reseller...`);
                const dashRes = await otpClient.get(`${PURPLE.url}/SMSReports`, { headers: { 'Cookie': state.purple.cookie, 'Referer': `${PURPLE.base}/SignIn` } });
                state.purple.cookie = updateCookie(state.purple.cookie, dashRes.headers);
            } else if (state.purple.cookie.includes("session") || state.purple.cookie.includes("PHPSESSID")) {
                log(`🍪 [PURPLE NUMBER] Sesi terdeteksi.`);
            } else {
                log(`❌ [PURPLE NUMBER] Gagal login. Cek user/pass.`);
                state.purple.cookie = ""; return;
            }
        }

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&ftermination=&fclient=&fnum=&fgcli=&fgdate=0&fgtermination=3&fgclient=0&fgnumber=0&fgcli=0&fg=0&sEcho=1&iColumns=11&sColumns=%2C%2C%2C%2C%2C%2C%2C%2C%2C%2C&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&mDataProp_7=7&sSearch_7=&bRegex_7=false&bSearchable_7=true&bSortable_7=true&mDataProp_8=8&sSearch_8=&bRegex_8=false&bSearchable_8=true&bSortable_8=true&mDataProp_9=9&sSearch_9=&bRegex_9=false&bSearchable_9=true&bSortable_9=true&mDataProp_10=10&sSearch_10=&bRegex_10=false&bSearchable_10=true&bSortable_10=true&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${PURPLE.url}/ajax/dt_reports.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.purple.cookie, 'Referer': `${PURPLE.url}/SMSReports` }, maxRedirects: 0, validateStatus: status => true });
        
        state.purple.cookie = updateCookie(state.purple.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [PURPLE NUMBER] Sesi terputus."); state.purple.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            if (row[0] === "0" && row[1] === "0") return;

            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = (row[8] || row[9] || row[10]) ? String(row[8] || row[9] || row[10]).trim() : ""; 
            
            if (!number || !rawMsg || rawMsg === "SMS" || rawMsg === "0") return;

            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        processOTPData(allSms, 'purple', "PURPLE NUMBER");
    } catch(e) { log(`⚠️ [PURPLE NUMBER] Error: ${e.message}`); }
}

// ==========================================
// 7. FLYN SMS (CLIENT PANEL)
// ==========================================
const FLYN = { url: "http://91.232.105.47/ints", user: "Pakistan", pass: "Pakistan" };

async function checkFlyn() {
    try {
        if (!state.flyn.cookie) {
            log("🔑 [FLYN] Membuka halaman login...");
            const getReq = await otpClient.get(`${FLYN.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [FLYN] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', FLYN.user);
            params.append('password', FLYN.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${FLYN.url}/signin`, params.toString(), {
                headers: { 'Origin': "http://91.232.105.47", 'Referer': `${FLYN.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: status => true
            });

            state.flyn.cookie = updateCookie(currentCookie, res.headers);
            if (res.status === 302 || res.status === 301 || res.status === 303 || state.flyn.cookie.includes("session") || state.flyn.cookie.includes("PHPSESSID")) {
                log(`🍪 [FLYN] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [FLYN] Gagal login.");
                state.flyn.cookie = ""; return;
            }
        }

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        
        let sCol = encodeURIComponent(",,,,,,");
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgnumber=&fgcli=&fg=0&sEcho=1&iColumns=7&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${FLYN.url}/client/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.flyn.cookie, 'Referer': `${FLYN.url}/client/SMSCDRStats` }, maxRedirects: 0, validateStatus: status => true });
        
        state.flyn.cookie = updateCookie(state.flyn.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [FLYN] Sesi terputus."); state.flyn.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            const rawMsg = row[4] ? String(row[4]).trim() : ""; 

            if (!number || !rawMsg || rawMsg === "SMS" || rawMsg === "0" || number === "0") return;

            // Radar otomatis membaca 4 digit angka
            const otpMatch = rawMsg.match(/\d{4}[-\s]?\d{4}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        
        processOTPData(allSms, 'flyn', "FLYN");
    } catch(e) { log(`⚠️ [FLYN] Error: ${e.message}`); }
}

// ==========================================
// 8. KONEKTA PREMIUM (AGENT) - FINAL FIX
// ==========================================
const KONEKTA = { base: "https://www.konektapremium.net", user: "rafli6281", pass: "@Rafli6336" };

async function checkKonekta() {
    try {
        if (!state.konekta.cookie) {
            log("🔑 [KONEKTA AGENT] Membuka halaman login...");
            const getReq = await otpClient.get(`${KONEKTA.base}/sign-in`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [KONEKTA AGENT] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            // Sapu bersih hidden token
            $('input[type="hidden"]').each((i, el) => {
                let name = $(el).attr('name');
                if(name) params.append(name, $(el).val());
            });

            params.append('username', KONEKTA.user);
            params.append('password', KONEKTA.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${KONEKTA.base}/signin`, params.toString(), {
                headers: { 'Origin': KONEKTA.base, 'Referer': `${KONEKTA.base}/sign-in`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: () => true
            });

            state.konekta.cookie = updateCookie(currentCookie, res.headers);
            
            if (res.status === 302 || res.status === 301 || state.konekta.cookie.includes("session")) {
                log(`🍪 [KONEKTA AGENT] Berhasil Login! Menyusuri sesi...`);
                // Mampir ke dashboard untuk generate Sesskey
                const reqDash = await otpClient.get(`${KONEKTA.base}/agent/SMSCDRReports`, { headers: { 'Cookie': state.konekta.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.konekta.cookie = updateCookie(state.konekta.cookie, reqDash.headers);
            } else {
                log("❌ [KONEKTA AGENT] Gagal login. Cek kredensial.");
                state.konekta.cookie = ""; return;
            }
        }

        // 1. Ambil Sesskey
        let sesskey = "Q05RR0FQUUZCUg=="; 
        try {
            const dashReq = await otpClient.get(`${KONEKTA.base}/agent/SMSCDRReports`, { headers: { 'Cookie': state.konekta.cookie } });
            state.konekta.cookie = updateCookie(state.konekta.cookie, dashReq.headers);
            let match = dashReq.data.match(/sesskey=['"]?([^&'"\s>]+)/) || dashReq.data.match(/sesskey=([^&"'\s]+)/);
            if (match && match[1]) sesskey = match[1];
        } catch (e) {}

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let sCol = encodeURIComponent(",,,,,,,,"); // 9 Kolom
        
        // 🔥 FIX UTAMA: Angka 0 di fgdate, fgmonth, fgrange, dll. HARUS ADA!
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fclient=&fnum=&fcli=&fgdate=0&fgmonth=0&fgrange=0&fgclient=0&fgnumber=0&fgcli=0&fg=0&sesskey=${sesskey}&sEcho=1&iColumns=9&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&mDataProp_7=7&sSearch_7=&bRegex_7=false&bSearchable_7=true&bSortable_7=true&mDataProp_8=8&sSearch_8=&bRegex_8=false&bSearchable_8=true&bSortable_8=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${KONEKTA.base}/agent/res/data_smscdr.php?${payload}`;
        
        const res = await otpClient.get(apiUrl, { 
            headers: { 'Cookie': state.konekta.cookie, 'Referer': `${KONEKTA.base}/agent/SMSCDRReports`, 'X-Requested-With': 'XMLHttpRequest' }, 
            maxRedirects: 0, validateStatus: () => true 
        });
        
        state.konekta.cookie = updateCookie(state.konekta.cookie, res.headers);
        
        if (!res.data || res.data === "" || res.status === 302) {
            state.konekta.cookie = ""; return; 
        }

        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { 
            state.konekta.cookie = ""; return; 
        }

        let data = res.data;
        if (typeof data === "string") {
            try { data = JSON.parse(data); } 
            catch (e) { return; }
        }

        let tableData = data.aaData || data.data;
        if (!tableData) return;

        let allSms = [];
        tableData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";
            
            // 🔥 RADAR PINTAR: Mencari SMS dengan lebih akurat
            let rawMsg = row[5] || ""; 
            if (!rawMsg || rawMsg === "SMS" || rawMsg === "0" || typeof rawMsg !== 'string') {
                // Jika row[5] kosong/bukan SMS, cari teks di array yang mengandung huruf/angka OTP
                let fallbackMsg = row.find(x => typeof x === 'string' && x.length > 10 && /\d/.test(x) && !x.includes('2026-'));
                if (fallbackMsg) rawMsg = fallbackMsg;
            }
            
            if (!number || !rawMsg || rawMsg === "SMS" || rawMsg === "0") return;

            // Bersihkan teks (terkadang ada newline 'n' nyasar seperti di screenshot)
            const cleanMsg = String(rawMsg).replace(/\n/g, " ").trim();
            
            // Deteksi 4-8 Digit OTP atau Format Khusus seperti "165-860"
            const otpMatch = cleanMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : cleanMsg; 
            
            // App Detector (Pakai regex global kamu)
            const senderApp = cleanMsg.match(APP_REGEX) ? cleanMsg.match(APP_REGEX)[0].toUpperCase() : "UN";

            const id = crypto.createHash("md5").update(number + cleanMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg: cleanMsg, otpCode, id });
        });
        
        if (allSms.length > 0) {
            processOTPData(allSms, 'konekta', "KONEKTA AGENT");
        }
    } catch(e) { log(`⚠️ [KONEKTA AGENT] Error: ${e.message}`); }
}

// ==========================================
// 9. IMS SMS (PERFECT REDIRECT & AXIOS PARAMS)
// ==========================================
const IMS = { url: "https://imssms.org", user: "Jakariya900", pass: "Jakariya900" };

async function checkIMS() {
    try {
        if (!state.ims.cookie) {
            log("🔑 [IMS] Membuka halaman login...");
            const getReq = await otpClient.get(`${IMS.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            // Sapu bersih semua token keamanan
            $('input[type="hidden"]').each((i, el) => {
                let name = $(el).attr('name');
                if(name) params.append(name, $(el).val());
            });

            // 🔥 FIX: Deteksi Captcha Anti Gagal & Validasi Login Akurat
            let htmlText = $.html().replace(/<[^>]*>?/gm, ''); // Bersihkan semua tag HTML
            let mathMatch = htmlText.match(/(\d+)\s*\+\s*(\d+)/); // Cari angka bebas
            
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [IMS] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            } else {
                log(`⚠️ [IMS] Captcha tidak terbaca, menggunakan jawaban default 0.`);
            }
            params.append('capt', jawaban.toString());

            params.append('username', IMS.user);
            params.append('password', IMS.pass);

            const res = await otpClient.post(`${IMS.url}/signin`, params.toString(), {
                headers: { 'Origin': IMS.url, 'Referer': `${IMS.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: () => true
            });

            state.ims.cookie = updateCookie(currentCookie, res.headers);
            
            // Cek lokasi redirect (Sukses = dilempar ke client/, Gagal = dilempar balik ke login/)
            let redirectUrl = res.headers.location || "";
            if ((res.status === 302 || res.status === 301) && redirectUrl.includes("client")) {
                log(`🍪 [IMS] Login sukses beneran! Menyusuri jalur redirect...`);
                
                // 1. MAMPIR KE /client/ (Ini yang sebelumnya terlewat!)
                const reqClient = await otpClient.get(`${IMS.url}/client/`, { headers: { 'Cookie': state.ims.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.ims.cookie = updateCookie(state.ims.cookie, reqClient.headers);
                
                // 2. MAMPIR KE /client/SMSDashboard
                const reqDash = await otpClient.get(`${IMS.url}/client/SMSDashboard`, { headers: { 'Cookie': state.ims.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.ims.cookie = updateCookie(state.ims.cookie, reqDash.headers);
                
                log(`✅ [IMS] Sesi terkunci sempurna.`);
            } else {
                log("❌ [IMS] Gagal login. Cek kembali user/pass.");
                state.ims.cookie = ""; return;
            }
        }

        let sesskey = "Q05RR0FQUUZCUg==";
        try {
            const dashReq = await otpClient.get(`${IMS.url}/client/SMSCDRStats`, { headers: { 'Cookie': state.ims.cookie } });
            state.ims.cookie = updateCookie(state.ims.cookie, dashReq.headers);
            let match = dashReq.data.match(/sesskey=['"]?([^&'"\s>]+)/) || dashReq.data.match(/sesskey=([^&"'\s]+)/);
            if (match && match[1]) sesskey = match[1];
        } catch (e) {}

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let sCol = encodeURIComponent(",,,,,,");
        
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgnumber=&fgcli=&fg=0&sesskey=${sesskey}&sEcho=1&iColumns=7&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${IMS.url}/client/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { 
            headers: { 'Cookie': state.ims.cookie, 'Referer': `${IMS.url}/client/SMSCDRStats`, 'X-Requested-With': 'XMLHttpRequest' }, 
            maxRedirects: 0, validateStatus: () => true 
        });
        
        state.ims.cookie = updateCookie(state.ims.cookie, res.headers);
        
if (!res.data || res.data === "" || res.status === 302) {
    log(`⚠️ [IMS] Server diam/Redirect (Status: ${res.status}). Mereset sesi...`);
    state.ims.cookie = ""; // 👈 INI KUNCI UTAMANYA
    return; 
}

// cek session putus
if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { 
    log("⚠️ [IMS] Sesi kedaluwarsa. Bot akan login ulang."); 
    state.ims.cookie = ""; 
    return; 
}

// 🔥 FIX UTAMA IMS (WAJIB)
let data = res.data;

if (typeof data === "string") {
    try {
        data = JSON.parse(data);
    } catch (e) {
        log("❌ [IMS] Gagal parse JSON (Response masih string)");
        return;
    }
}

// 🚨 TAMBAHAN ANTI-BOT IMS: JIKA MINTA REFRESH, RESET SESI!
if (JSON.stringify(data).includes("Refresh must be done")) {
    log("🔄 [IMS] Sesi basi (Refresh must be done). Bot akan login ulang otomatis...");
    state.ims.cookie = ""; // Kosongkan cookie agar bot login ulang di putaran berikutnya
    return;
}

// ambil data tabel
let tableData = data.aaData || data.data;
if (!tableData) return;

let allSms = [];
tableData.forEach(row => {
    // 🔥 AUTO DETECT (ANTI SALAH INDEX IMS)
    const number = row[2] || row.find(x => String(x).match(/^\d{8,15}$/)) || "";
    const senderApp = row[3] || row.find(x => String(x).match(APP_REGEX)) || "UN";
    // Langsung ambil kolom pesan (row[4]) agar tidak salah membaca tanggal server
    let rawMsg = row[4] || "";

    if (!number || !rawMsg) return;

    const cleanMsg = String(rawMsg).replace(/\n/g, " ").trim();
    const otpRegexMatch = cleanMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
    if (!otpRegexMatch) return; 

    const otpCode = otpRegexMatch[0]; 
    const id = crypto.createHash("md5").update(number + cleanMsg).digest("hex");

    allSms.push({ number, senderApp, rawMsg: cleanMsg, otpCode, id });
});

if (allSms.length > 0) {
    processOTPData(allSms, 'ims', "IMS");
}
    } catch(e) { log(`⚠️ [IMS] Error: ${e.message}`); }
} // <-- Ini kurung penutup yang hilang

// ==========================================
// 10. SVEN1TEL SMS PANEL
// ==========================================
const SVEN1TEL = { url: "http://94.23.120.156/ints", user: "Milon890", pass: "Milon890" };

async function checkSven1tel() {
    try {
        if (!state.sven1tel.cookie) {
            log("🔑 [SVEN1TEL] Membuka halaman login...");
            const getReq = await otpClient.get(`${SVEN1TEL.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            let mathMatch = $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [SVEN1TEL] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', SVEN1TEL.user);
            params.append('password', SVEN1TEL.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${SVEN1TEL.url}/signin`, params.toString(), {
                headers: { 'Origin': "http://94.23.120.156", 'Referer': `${SVEN1TEL.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: status => true
            });

            state.sven1tel.cookie = updateCookie(currentCookie, res.headers);
            if (res.status === 302 || res.status === 301 || res.status === 303 || state.sven1tel.cookie.includes("session") || state.sven1tel.cookie.includes("PHPSESSID")) {
                log(`🍪 [SVEN1TEL] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [SVEN1TEL] Gagal login.");
                state.sven1tel.cookie = ""; return;
            }
        }

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        let sCol = encodeURIComponent(",,,,,,");
        
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgnumber=&fgcli=&fg=0&sEcho=1&iColumns=7&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${SVEN1TEL.url}/client/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.sven1tel.cookie, 'Referer': `${SVEN1TEL.url}/client/SMSCDRStats` }, maxRedirects: 0, validateStatus: status => true });
        
        state.sven1tel.cookie = updateCookie(state.sven1tel.cookie, res.headers);
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { log("⚠️ [SVEN1TEL] Sesi terputus."); state.sven1tel.cookie = ""; return; }
        if (!res.data || !res.data.aaData) return;

        let allSms = [];
        res.data.aaData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            
            // Bersihkan tag HTML (seperti <div>) yang ada di log DevTools-mu
            let rawMsg = row[4] ? String(row[4]).replace(/<[^>]*>?/gm, '').trim() : ""; 
            if (!rawMsg && row[4]) rawMsg = String(row[4]).replace(/<[^>]*>?/gm, '').trim(); 

            if (!number || !rawMsg || rawMsg === "SMS" || rawMsg === "0" || number === "0") return;

            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        
        processOTPData(allSms, 'sven1tel', "SVEN1TEL");
    } catch(e) { log(`⚠️ [SVEN1TEL] Error: ${e.message}`); }
}
// ==========================================
// 11. FLEX SMS PANEL (IP: 168.119.13.175) - JALUR AGENT
// ==========================================
const FLEX = { url: "http://168.119.13.175/ints", user: "Zellya678900", pass: "Zellya678900" };

async function checkFlex() {
    try {
        if (!state.flex.cookie) {
            log("🔑 [FLEX] Membuka halaman login...");
            const getReq = await otpClient.get(`${FLEX.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            // Sapu bersih token tersembunyi
            $('input[type="hidden"]').each((i, el) => {
                let name = $(el).attr('name');
                if(name) params.append(name, $(el).val());
            });

            let htmlText = $.html().replace(/<[^>]*>?/gm, '');
            let mathMatch = htmlText.match(/(\d+)\s*\+\s*(\d+)/) || $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [FLEX] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', FLEX.user);
            params.append('password', FLEX.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${FLEX.url}/signin`, params.toString(), {
                headers: { 'Origin': "http://168.119.13.175", 'Referer': `${FLEX.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: () => true
            });

            state.flex.cookie = updateCookie(currentCookie, res.headers);
            
            // MAMPIR KE JALUR AGENT & DASHBOARD
            let redirectUrl = res.headers.location || "";
            if (res.status === 302 && redirectUrl.includes("agent")) {
                log(`🍪 [FLEX] Login sukses! Menyusuri jalur agent...`);
                const reqAgent = await otpClient.get(`${FLEX.url}/agent/`, { headers: { 'Cookie': state.flex.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.flex.cookie = updateCookie(state.flex.cookie, reqAgent.headers);
                const reqDash = await otpClient.get(`${FLEX.url}/agent/SMSDashboard`, { headers: { 'Cookie': state.flex.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.flex.cookie = updateCookie(state.flex.cookie, reqDash.headers);
                log(`✅ [FLEX] Sesi terkunci sempurna.`);
            } else if (res.status === 302 || res.status === 301 || state.flex.cookie.includes("session") || state.flex.cookie.includes("PHPSESSID")) {
                log(`🍪 [FLEX] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [FLEX] Gagal login. Cek user/pass.");
                state.flex.cookie = ""; return;
            }
        }

        // 🔥 FIX UTAMA: PANEL INI PAKAI 'csstr' BUKAN 'sesskey'!
        let csstr = ""; 
        try {
            const dashReq = await otpClient.get(`${FLEX.url}/agent/SMSCDRStats`, { headers: { 'Cookie': state.flex.cookie } });
            state.flex.cookie = updateCookie(state.flex.cookie, dashReq.headers);
            let match = dashReq.data.match(/csstr\s*=\s*['"]?([^&'"\s>]+)/i);
            if (match && match[1]) csstr = match[1];
        } catch (e) {}

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        
        // 🔥 FIX UTAMA KE-2: HARUS 9 KOLOM!
        let sCol = encodeURIComponent(",,,,,,,,"); 
        
        // Payload disamakan PERSIS dengan request DevTools Mises lu
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fclient=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgclient=&fgnumber=&fgcli=&fg=0&csstr=${csstr}&sEcho=1&iColumns=9&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&mDataProp_7=7&sSearch_7=&bRegex_7=false&bSearchable_7=true&bSortable_7=true&mDataProp_8=8&sSearch_8=&bRegex_8=false&bSearchable_8=true&bSortable_8=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${FLEX.url}/agent/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.flex.cookie, 'Referer': `${FLEX.url}/agent/SMSCDRStats`, 'X-Requested-With': 'XMLHttpRequest' }, maxRedirects: 0, validateStatus: () => true });
        
        state.flex.cookie = updateCookie(state.flex.cookie, res.headers);
        
        if (!res.data || res.data === "" || res.status === 302) { 
            state.flex.cookie = ""; 
            return; 
        }
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { 
            log("⚠️ [FLEX] Sesi terputus. Mengulang login..."); 
            state.flex.cookie = ""; 
            return; 
        }
        
        let data = res.data;
        if (typeof data === "string") { try { data = JSON.parse(data); } catch(e) { return; } }
        let tableData = data.aaData || data.data;
        if (!tableData) return;

        let allSms = [];
        tableData.forEach(row => {
            // Indeks sudah fix berdasarkan Pratinjau JSON lu:
            // [0]Date [1]Range [2]Number [3]CLI [4]Client [5]SMS
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            
            // Isi SMS ada di index 5, dibersihkan dari tag HTML (kalau ada)
            let rawMsg = row[5] ? String(row[5]).replace(/<[^>]*>?/gm, '').trim() : ""; 

            // Pengaman ekstra jika kolom bergeser
            if (!rawMsg || rawMsg === "SMS" || rawMsg === "0") {
                let fallbackMsg = row.find(x => typeof x === 'string' && x.length > 10 && /\d/.test(x) && !x.includes('2026-'));
                if (fallbackMsg) rawMsg = String(fallbackMsg).replace(/<[^>]*>?/gm, '').trim();
            }

            if (!number || !rawMsg || rawMsg === "SMS" || rawMsg === "0" || number === "0") return;

            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        
        if (allSms.length > 0) {
            processOTPData(allSms, 'flex', "FLEX SMS");
        }
    } catch(e) { log(`⚠️ [FLEX] Error: ${e.message}`); }
}

// ==========================================
// 12. FLEX SMS PANEL 2 (IP: 168.119.13.175) - JALUR AGENT
// ==========================================
const FLEX2 = { url: "http://168.119.13.175/ints", user: "rafli6281", pass: "@Rafli6336" };

async function checkFlex2() {
    try {
        if (!state.flex2.cookie) {
            log("🔑 [FLEX 2] Membuka halaman login...");
            const getReq = await otpClient.get(`${FLEX2.url}/login`);
            let currentCookie = updateCookie("", getReq.headers);
            const $ = cheerio.load(getReq.data);
            const params = new URLSearchParams();

            // Sapu bersih token tersembunyi
            $('input[type="hidden"]').each((i, el) => {
                let name = $(el).attr('name');
                if(name) params.append(name, $(el).val());
            });

            let htmlText = $.html().replace(/<[^>]*>?/gm, '');
            let mathMatch = htmlText.match(/(\d+)\s*\+\s*(\d+)/) || $('body').text().match(/(?:What is)?\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/i);
            let jawaban = 0;
            if (mathMatch) {
                jawaban = parseInt(mathMatch[1]) + parseInt(mathMatch[2]);
                log(`🤖 [FLEX 2] Menjawab Captcha: ${mathMatch[1]} + ${mathMatch[2]} = ${jawaban}`);
            }

            params.append('username', FLEX2.user);
            params.append('password', FLEX2.pass);
            params.append('capt', jawaban.toString()); 

            const res = await otpClient.post(`${FLEX2.url}/signin`, params.toString(), {
                headers: { 'Origin': "http://168.119.13.175", 'Referer': `${FLEX2.url}/login`, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': currentCookie },
                maxRedirects: 0, validateStatus: () => true
            });

            state.flex2.cookie = updateCookie(currentCookie, res.headers);
            
            // MAMPIR KE JALUR AGENT & DASHBOARD
            let redirectUrl = res.headers.location || "";
            if (res.status === 302 && redirectUrl.includes("agent")) {
                log(`🍪 [FLEX 2] Login sukses! Menyusuri jalur agent...`);
                const reqAgent = await otpClient.get(`${FLEX2.url}/agent/`, { headers: { 'Cookie': state.flex2.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.flex2.cookie = updateCookie(state.flex2.cookie, reqAgent.headers);
                const reqDash = await otpClient.get(`${FLEX2.url}/agent/SMSDashboard`, { headers: { 'Cookie': state.flex2.cookie }, maxRedirects: 0, validateStatus: () => true });
                state.flex2.cookie = updateCookie(state.flex2.cookie, reqDash.headers);
                log(`✅ [FLEX 2] Sesi terkunci sempurna.`);
            } else if (res.status === 302 || res.status === 301 || state.flex2.cookie.includes("session") || state.flex2.cookie.includes("PHPSESSID")) {
                log(`🍪 [FLEX 2] Berhasil Login! Sesi diamankan.`);
            } else {
                log("❌ [FLEX 2] Gagal login. Cek user/pass.");
                state.flex2.cookie = ""; return;
            }
        }

        let csstr = ""; 
        try {
            const dashReq = await otpClient.get(`${FLEX2.url}/agent/SMSCDRStats`, { headers: { 'Cookie': state.flex2.cookie } });
            state.flex2.cookie = updateCookie(state.flex2.cookie, dashReq.headers);
            let match = dashReq.data.match(/csstr\s*=\s*['"]?([^&'"\s>]+)/i);
            if (match && match[1]) csstr = match[1];
        } catch (e) {}

        let fdate1 = `${getPanelDate(-2)}%2000:00:00`;
        let fdate2 = `${getPanelDate(1)}%2023:59:59`;
        let timestamp = Date.now();
        
        let sCol = encodeURIComponent(",,,,,,,,"); 
        
        let payload = `fdate1=${fdate1}&fdate2=${fdate2}&frange=&fclient=&fnum=&fcli=&fgdate=&fgmonth=&fgrange=&fgclient=&fgnumber=&fgcli=&fg=0&csstr=${csstr}&sEcho=1&iColumns=9&sColumns=${sCol}&iDisplayStart=0&iDisplayLength=25&mDataProp_0=0&sSearch_0=&bRegex_0=false&bSearchable_0=true&bSortable_0=true&mDataProp_1=1&sSearch_1=&bRegex_1=false&bSearchable_1=true&bSortable_1=true&mDataProp_2=2&sSearch_2=&bRegex_2=false&bSearchable_2=true&bSortable_2=true&mDataProp_3=3&sSearch_3=&bRegex_3=false&bSearchable_3=true&bSortable_3=true&mDataProp_4=4&sSearch_4=&bRegex_4=false&bSearchable_4=true&bSortable_4=true&mDataProp_5=5&sSearch_5=&bRegex_5=false&bSearchable_5=true&bSortable_5=true&mDataProp_6=6&sSearch_6=&bRegex_6=false&bSearchable_6=true&bSortable_6=true&mDataProp_7=7&sSearch_7=&bRegex_7=false&bSearchable_7=true&bSortable_7=true&mDataProp_8=8&sSearch_8=&bRegex_8=false&bSearchable_8=true&bSortable_8=false&sSearch=&bRegex=false&iSortCol_0=0&sSortDir_0=desc&iSortingCols=1&_=${timestamp}`;

        const apiUrl = `${FLEX2.url}/agent/res/data_smscdr.php?${payload}`;
        const res = await otpClient.get(apiUrl, { headers: { 'Cookie': state.flex2.cookie, 'Referer': `${FLEX2.url}/agent/SMSCDRStats`, 'X-Requested-With': 'XMLHttpRequest' }, maxRedirects: 0, validateStatus: () => true });
        
        state.flex2.cookie = updateCookie(state.flex2.cookie, res.headers);
        
        if (!res.data || res.data === "" || res.status === 302) { 
            state.flex2.cookie = ""; 
            return; 
        }
        if (typeof res.data === 'string' && res.data.toLowerCase().includes('<html')) { 
            log("⚠️ [FLEX 2] Sesi terputus. Mengulang login..."); 
            state.flex2.cookie = ""; 
            return; 
        }
        
        let data = res.data;
        if (typeof data === "string") { try { data = JSON.parse(data); } catch(e) { return; } }
        let tableData = data.aaData || data.data;
        if (!tableData) return;

        let allSms = [];
        tableData.forEach(row => {
            const number = row[2] ? String(row[2]).trim() : "";      
            const senderApp = row[3] ? String(row[3]).trim() : "";   
            
            let rawMsg = row[5] ? String(row[5]).replace(/<[^>]*>?/gm, '').trim() : ""; 

            if (!rawMsg || rawMsg === "SMS" || rawMsg === "0") {
                let fallbackMsg = row.find(x => typeof x === 'string' && x.length > 10 && /\d/.test(x) && !x.includes('2026-'));
                if (fallbackMsg) rawMsg = String(fallbackMsg).replace(/<[^>]*>?/gm, '').trim();
            }

            if (!number || !rawMsg || rawMsg === "SMS" || rawMsg === "0" || number === "0") return;

            const otpMatch = rawMsg.match(/\d{3}[-\s]?\d{3}|\d{4,8}/);
            const otpCode = otpMatch ? otpMatch[0] : rawMsg; 
            const id = crypto.createHash("md5").update(number + rawMsg).digest("hex");
            allSms.push({ number, senderApp, rawMsg, otpCode, id });
        });
        
        if (allSms.length > 0) {
            processOTPData(allSms, 'flex2', "FLEX SMS 2");
        }
    } catch(e) { log(`⚠️ [FLEX 2] Error: ${e.message}`); }
}

function isAdmin(userId) { return String(userId) === String(ADMIN_ID); }
function isBanned(userId) { return banned_users.has(userId); }

async function checkFsub(userId) {
    if (isAdmin(userId)) return { joined: true, unjoinedList: [] }; 
    let unjoinedList = [];
    for (let ch of WAJIB_GABUNG) {
        try {
            let member = await bot.getChatMember(ch.id, userId);
            if (!['creator', 'administrator', 'member', 'restricted'].includes(member.status)) { unjoinedList.push(ch); }
        } catch (e) { unjoinedList.push(ch); }
    }
    return { joined: unjoinedList.length === 0, unjoinedList };
}

function buildMainMenu() {
    return {
        keyboard: [ 
            [{ text: "📱 Get Number" }, { text: "📂 Get File Number" }], 
            [{ text: "📊 Status" }, { text: "🛠 Admin Panel" }] 
        ],
        resize_keyboard: true
    };
}

bot.onText(/\/start/, async (msg) => {
    let userId = msg.from.id; let chatId = msg.chat.id;
    if (isBanned(userId)) return;

    let fsub = await checkFsub(userId);
    if (!fsub.joined) {
        let keyboard = fsub.unjoinedList.map(ch => [{ text: ch.text, url: ch.url }]);
        return bot.sendMessage(chatId, "⚠️ <b>Akses Ditolak!</b>\n\nUntuk menggunakan bot ini, kamu <b>wajib</b> bergabung dengan SEMUA channel utama kami terlebih dahulu.", { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
    }
    bot.sendMessage(chatId, "👋 <b>Selamat datang di Bot Distribusi OTP (Super Hybrid 8-in-1)</b>\n\n• 📱 Get Number - Dapatkan Nomor\n• 📂 Get File Number - Download file (.txt)\n", { parse_mode: "HTML", reply_markup: buildMainMenu() });
});

bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    let text = msg.text; let chatId = msg.chat.id; let userId = msg.from.id;
    if (isBanned(userId)) return;

    let fsub = await checkFsub(userId);
    if (!fsub.joined) {
        let keyboard = fsub.unjoinedList.map(ch => [{ text: ch.text, url: ch.url }]);
        return bot.sendMessage(chatId, "⚠️ Kamu harus gabung semua channel dulu!", { reply_markup: { inline_keyboard: keyboard } });
    }

    if (text === "📊 Status") {
        bot.sendMessage(chatId, `📊 <b>Status Super Hybrid Bot</b>\n✅ LAMIX 1: Aktif\n✅ ROXY: Aktif\n✅ MSI: Aktif\n✅ NPanel: Aktif\n✅ PROTON: Aktif\n✅ PURPLE: Aktif\n✅ FLYN: Aktif\n✅ KONEKTA: Aktif\n✅ IMS: Aktif\n✅ SVEN1TEL: Aktif\n✅ FLEX SMS: Aktif\n✅ FLEX 2: Aktif`, { parse_mode: "HTML" });
    }

    else if (text === "📱 Get Number") {
        let keys = [];
        Object.keys(prefixes).forEach(code => {
            if (fs.existsSync(path.join(__dirname, `${code}.xlsx`))) {
                let info = prefixes[code];
                keys.push([{ text: `${info[1]} ${info[0]} (+${code})`, callback_data: `getnum_${code}` }]);
            }
        });
        if (keys.length === 0) bot.sendMessage(chatId, "😕 Belum ada stock nomor di database.");
        else bot.sendMessage(chatId, "🌍 <b>Pilih Negara</b>:", { parse_mode: "HTML", reply_markup: { inline_keyboard: keys } });
    }
    else if (text === "📂 Get File Number") {
        let keys = [];
        Object.keys(prefixes).forEach(code => {
            if (fs.existsSync(path.join(__dirname, `${code}.xlsx`))) {
                let info = prefixes[code];
                keys.push([{ text: `📁 ${info[1]} ${info[0]} (+${code})`, callback_data: `getfile_${code}` }]);
            }
        });
        if (keys.length === 0) bot.sendMessage(chatId, "😕 Belum ada file yang tersedia.");
        else bot.sendMessage(chatId, "📂 <b>Pilih Negara untuk Download File</b>:", { parse_mode: "HTML", reply_markup: { inline_keyboard: keys } });
    }
    // 👇 BARIS INI YANG HILANG 👇
    else if (text === "🛠 Admin Panel") {
        if (!isAdmin(userId)) return;
        let keys = [
            [{ text: "📩 Add Combo", callback_data: "add_combo" }, { text: "🗑️ Del Combo", callback_data: "del_combo" }],
            [{ text: "➕ Add Country", callback_data: "add_country" }, { text: "➖ Del Country", callback_data: "del_country" }],
            [{ text: "➕ Add Service", callback_data: "add_service" }, { text: "➖ Del Service", callback_data: "del_service" }],
            [{ text: "📜 List Country", callback_data: "list_country" }, { text: "📜 List Service", callback_data: "list_service" }],
            [{ text: "📢 List FSUB", callback_data: "list_fsub" }],
            [{ text: "➕ Add FSUB", callback_data: "add_fsub" }, { text: "➖ Del FSUB", callback_data: "del_fsub" }]
        ];
        bot.sendMessage(chatId, "🔐 <b>Admin Panel</b>\nPilih menu pengaturan di bawah ini:", { parse_mode: "HTML", reply_markup: { inline_keyboard: keys } });
    }
});

bot.on('document', async (msg) => {
    // Cek apakah yang upload adalah Admin
    if (!isAdmin(msg.from.id)) return;
    
    const fileName = msg.document.file_name || "";
    // Cek ekstensi file, harus .xlsx atau .txt (sudah dibuat tahan banting huruf besar/kecil)
    if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.txt')) return;

    bot.sendMessage(msg.chat.id, `⏳ Mengunduh dan memindai file ${fileName}...`);
    try {
        const link = await bot.getFileLink(msg.document.file_id);
        
        // Memakai Native Fetch bawaan Node.js (Jauh lebih stabil untuk narik file besar)
        const response = await fetch(link);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        let numbers = [];

        // --- JIKA FILE EXCEL (.xlsx) ---
        if (fileName.toLowerCase().endsWith('.xlsx')) {
            const wb = xlsx.read(buffer, { type: 'buffer' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
            for (let row of rows) {
                for (let cell of row) {
                    if (cell) {
                        let cleanCell = String(cell).replace(/[\s\+\-]/g, '');
                        if (/^\d{8,16}$/.test(cleanCell)) { numbers.push(cleanCell); break; }
                    }
                }
            }
        } 
        // --- JIKA FILE TEKS (.txt) ---
        else if (fileName.toLowerCase().endsWith('.txt')) {
            const textData = buffer.toString('utf-8');
            const lines = textData.split(/\r?\n/);
            for (let line of lines) {
                let cleanLine = line.replace(/[\s\+\-]/g, '');
                if (/^\d{8,16}$/.test(cleanLine)) { numbers.push(cleanLine); }
            }
        }

        // --- PROSES PENYIMPANAN ---
        if (numbers.length > 0) {
            let firstNum = numbers[0];
            let detectedCode = Object.keys(prefixes).sort((a,b) => b.length - a.length).find(code => firstNum.startsWith(code));
            
            if (detectedCode) {
                saveComboXlsx(detectedCode, numbers);
                bot.sendMessage(msg.chat.id, `✅ Sukses menyedot ${numbers.length} nomor ke database (+${detectedCode}).`);
            } else {
                bot.sendMessage(msg.chat.id, `❌ Gagal deteksi kode negara dari nomor: ${firstNum}`);
            }
        } else {
            bot.sendMessage(msg.chat.id, "❌ File kosong atau format nomor tidak terbaca. Pastikan isinya nomor yang benar.");
        }
    } catch (e) { 
        log(`❌ Error Document: ${e.stack || e.message || e}`);
        bot.sendMessage(msg.chat.id, `❌ Error: Gagal membaca file Excel. Coba gunakan opsi file TXT.`); 
    }
});


bot.on('callback_query', async (call) => {
    let data = call.data; let chatId = call.message.chat.id; let msgId = call.message.message_id;
    try {
        if (data === "copy_dummy") await bot.answerCallbackQuery(call.id, { text: "✅ Tersalin!" });
        else if (data === "add_combo") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id, { text: "✅ Silakan kirim/upload file .xlsx ke chat ini sekarang!", show_alert: true });
        }
        else if (data === "changecountry") {
            await bot.answerCallbackQuery(call.id); 
            let keys = [];
            Object.keys(prefixes).forEach(code => {
                if (fs.existsSync(path.join(__dirname, `${code}.xlsx`))) {
                    let info = prefixes[code];
                    keys.push([{ text: `${info[1]} ${info[0]} (+${code})`, callback_data: `getnum_${code}` }]);
                }
            });
            await bot.editMessageText(keys.length === 0 ? "😕 Belum ada stock." : "🌍 <b>Pilih Negara</b>:", { chat_id: chatId, message_id: msgId, parse_mode: "HTML", reply_markup: { inline_keyboard: keys } });
        }
        else if (data.startsWith("getnum_")) {
            let country = data.split("_")[1];
            let availableNumbers = getComboXlsx(country);
            if (availableNumbers.length === 0) return bot.answerCallbackQuery(call.id, { text: "❌ Nomor habis!", show_alert: true });
            await bot.answerCallbackQuery(call.id, { text: "⏳ Menyiapkan nomor..." });
            
            let count = Math.min(5, availableNumbers.length); let selected = [];
            for(let i=0; i<count; i++) selected.push(availableNumbers.splice(Math.floor(Math.random() * availableNumbers.length), 1)[0]);
            updateComboXlsx(country, availableNumbers); 

             let info = prefixes[country] || [country, "🏳️"];
            
            // Tampilan teks disamakan dengan script sebelah
            let msg = `${info[1]} <b>${info[0]}</b>\n\n` + selected.map(num => `<code>+${num}</code>\n`).join('') + `\n⏳ <i>Waiting for OTP...</i>\n🔔 <i>You will be notified instantly!</i>`;
            
            await bot.editMessageText(msg, { 
                chat_id: chatId, 
                message_id: msgId, 
                parse_mode: "HTML", 
                reply_markup: { 
                    inline_keyboard: [
                        // Baris 1: Tombol Change
                        [{ text: "🔁 Change Number", callback_data: `getnum_${country}` }, { text: "🌍 Change Country", callback_data: "changecountry" }],
                        // Baris 2: Tombol Link Grup OTP (Ganti linknya dengan link grup/channel kamu)
                        [{ text: "📣 OTP Group", url: "https://t.me/+bxLWPREYzKE3ODc1" }] 
                    ] 
                } 
            }).catch(()=>{});
       }
        else if (data.startsWith("getfile_")) {
            let country = data.split("_")[1];
            await bot.answerCallbackQuery(call.id, { text: "⏳ Mengirim file TXT..." });
            let filePath = path.join(__dirname, `${country}.xlsx`);
            if (fs.existsSync(filePath)) {
                let numbers = getComboXlsx(country);
                if (numbers.length > 0) {
                    let txtPath = path.join(__dirname, `${country}.txt`);
                    fs.writeFileSync(txtPath, numbers.map(num => '+' + num).join('\n')); 
                    let info = prefixes[country];
                    await bot.sendDocument(chatId, txtPath, { caption: `📁 File Nomor TXT ${info[1]} ${info[0]} (+${country})\nTotal: ${numbers.length} nomor siap dipakai!` });
                    fs.unlinkSync(txtPath); 
                } else await bot.sendMessage(chatId, "❌ Stok nomor kosong.");
            } else await bot.sendMessage(chatId, "❌ File tidak ditemukan."); 
        }
        else if (data === "del_combo") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id); 
            let sentMsg = await bot.sendMessage(chatId, "🗑️ Balas pesan ini dengan kode negara yang ingin dihapus (Contoh: 62)", { reply_markup: { force_reply: true } });
            bot.onReplyToMessage(sentMsg.chat.id, sentMsg.message_id, (reply) => {
                let code = reply.text.trim().replace("+", "");
                let filePath = path.join(__dirname, `${code}.xlsx`);
                if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); bot.sendMessage(chatId, `✅ Berhasil menghapus stok +${code}`); }
                else bot.sendMessage(chatId, `❌ Stok +${code} tidak ditemukan.`);
            });
        }
        // ==========================================
        // 🌍 FITUR ADD/DEL NEGARA VIA TELEGRAM
        // ==========================================
        else if (data === "add_country") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            let sentMsg = await bot.sendMessage(chatId, "🌍 <b>Tambah Negara Baru</b>\nFormat: <code>Kode|Nama Negara|Bendera|ID_Premium</code>\n\nContoh:\n<code>999|NEGARA BARU|🏴‍☠️|123456789</code>", { parse_mode: "HTML", reply_markup: { force_reply: true } });
            bot.onReplyToMessage(chatId, sentMsg.message_id, (reply) => {
                let [kode, nama, emoji, id] = reply.text.split("|");
                if (!kode || !nama || !emoji || !id) return bot.sendMessage(chatId, "❌ Format salah! Pastikan pakai pembatas garis lurus |");
                prefixes[kode.trim()] = [nama.trim().toUpperCase(), emoji.trim(), id.trim()];
                savePrefixes();
                bot.sendMessage(chatId, `✅ Negara <b>${nama}</b> (+${kode}) berhasil ditambahkan ke sistem!`, { parse_mode: "HTML" });
            });
        }
        else if (data === "del_country") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            let sentMsg = await bot.sendMessage(chatId, "➖ <b>Hapus Negara</b>\nKirim Kode Negaranya (Contoh: <code>62</code>)", { parse_mode: "HTML", reply_markup: { force_reply: true } });
            bot.onReplyToMessage(chatId, sentMsg.message_id, (reply) => {
                let kode = reply.text.trim();
                if (prefixes[kode]) {
                    delete prefixes[kode];
                    savePrefixes();
                    bot.sendMessage(chatId, `✅ Negara +${kode} berhasil dihapus.`);
                } else {
                    bot.sendMessage(chatId, `❌ Kode negara +${kode} tidak ditemukan.`);
                }
            });
        }

        // ==========================================
        // 📱 FITUR ADD/DEL SERVICE VIA TELEGRAM
        // ==========================================
        else if (data === "add_service") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            let sentMsg = await bot.sendMessage(chatId, "➕ <b>Tambah Service Baru</b>\nFormat: <code>Nama|EmojiBiasa|ID_Premium|keyword1,keyword2</code>\n\nContoh:\n<code>GOJEK|🏍️|123456789|gojek,gopay</code>", { parse_mode: "HTML", reply_markup: { force_reply: true } });
            bot.onReplyToMessage(chatId, sentMsg.message_id, (reply) => {
                let [tag, fallback, id, keys] = reply.text.split("|");
                if (!tag || !fallback || !id || !keys) return bot.sendMessage(chatId, "❌ Format salah! Cek pembatas |");
                
                let exists = SERVICES.findIndex(s => s.tag === tag.trim().toUpperCase());
                let newSvc = { 
                    keys: keys.split(",").map(k => k.trim().toLowerCase()), 
                    tag: tag.trim().toUpperCase(), 
                    fallback: fallback.trim(), 
                    id: id.trim() 
                };
                
                if (exists !== -1) SERVICES[exists] = newSvc; 
                else SERVICES.push(newSvc); 

                saveServices();
                bot.sendMessage(chatId, `✅ Service <b>${tag}</b> berhasil ditambahkan/diupdate!`, { parse_mode: "HTML" });
            });
        }
        else if (data === "del_service") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            let sentMsg = await bot.sendMessage(chatId, "➖ <b>Hapus Service</b>\nKirim NAMA service-nya (Contoh: <code>GOJEK</code>)", { parse_mode: "HTML", reply_markup: { force_reply: true } });
            bot.onReplyToMessage(chatId, sentMsg.message_id, (reply) => {
                let tag = reply.text.trim().toUpperCase();
                let awal = SERVICES.length;
                SERVICES = SERVICES.filter(s => s.tag !== tag);
                if (SERVICES.length < awal) {
                    saveServices();
                    bot.sendMessage(chatId, `✅ Service <b>${tag}</b> berhasil dihapus dari sistem.`, { parse_mode: "HTML" });
                } else {
                    bot.sendMessage(chatId, `❌ Service <b>${tag}</b> tidak ditemukan.`);
                }
            });
        }

        // ==========================================
        // 📜 FITUR LIST COUNTRY & SERVICE (FIXED LIMIT)
        // ==========================================
        else if (data === "list_country") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            
            let txt = "🌍 <b>Daftar Negara Terdaftar:</b>\n\n";
            let count = 0;
            let msgs = [];
            
            for (let code in prefixes) {
                let info = prefixes[code];
                let item = `+${code} | ${info[1]} ${info[0]}\n`;
                
                // Jika teks hampir mencapai limit Telegram, simpan ke array dan reset
                if ((txt.length + item.length) > 3900) {
                    msgs.push(txt);
                    txt = ""; 
                }
                txt += item;
                count++;
            }
            txt += `\n📊 <b>Total:</b> ${count} Negara`;
            msgs.push(txt); // Masukkan sisa teks terakhir
            
            // Kirim semua pesan secara berurutan
            for (let m of msgs) {
                await bot.sendMessage(chatId, m, { parse_mode: "HTML" });
            }
        }

        else if (data === "list_service") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            
            if (SERVICES.length === 0) return bot.sendMessage(chatId, "📋 Daftar Service masih kosong.");
            
            let txt = "📱 <b>Daftar Service Terdaftar:</b>\n\n";
            let msgs = [];
            
            SERVICES.forEach((svc, i) => {
                let item = `<b>${i+1}. ${svc.tag}</b> ${svc.fallback}\n   🔑 <i>Keywords:</i> <code>${svc.keys.join(", ")}</code>\n\n`;
                
                // Pisahkan pesan jika hampir melanggar limit Telegram
                if ((txt.length + item.length) > 3900) {
                    msgs.push(txt);
                    txt = "";
                }
                txt += item;
            });
            msgs.push(txt);

            // Kirim beruntun tanpa bikin error HTML
            for (let m of msgs) {
                await bot.sendMessage(chatId, m, { parse_mode: "HTML" });
            }
        }

        else if (data === "list_fsub") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            if (WAJIB_GABUNG.length === 0) return bot.sendMessage(chatId, "📋 Daftar FSUB masih kosong.");
            
            let txt = "📋 <b>Daftar Wajib Gabung (FSUB):</b>\n\n";
            WAJIB_GABUNG.forEach((ch, i) => {
                txt += `${i+1}. <b>ID:</b> ${ch.id}\n   <b>URL:</b> ${ch.url}\n   <b>Tombol:</b> ${ch.text}\n\n`;
            });
            bot.sendMessage(chatId, txt, { parse_mode: "HTML", disable_web_page_preview: true });
        }
                else if (data === "add_fsub") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            let sentMsg = await bot.sendMessage(chatId, "➕ <b>Tambah FSUB (Mode Pintar)</b>\nCukup kirimkan <b>Link Channel</b> kamu saja.\n\nContoh:\n<code>https://t.me/ranzzyx</code>", { parse_mode: "HTML", reply_markup: { force_reply: true } });
            
            bot.onReplyToMessage(chatId, sentMsg.message_id, (reply) => {
                let input = reply.text.trim();
                let url, id, text;

                // Cek apakah input mengandung link Telegram
                let match = input.match(/t\.me\/([a-zA-Z0-9_]+)/);
                
                if (match && match[1]) {
                    url = input;
                    id = "@" + match[1]; // Otomatis jadi @username
                    text = "📢 Gabung Channel"; // Nama tombol otomatis
                } else {
                    return bot.sendMessage(chatId, "❌ Link tidak valid! Pastikan kirim link dengan format <code>https://t.me/username</code>", { parse_mode: "HTML" });
                }
                
                // Simpan ke database
                if (WAJIB_GABUNG.find(ch => ch.id === id)) return bot.sendMessage(chatId, `❌ Channel ${id} sudah ada dalam daftar.`);
                
                WAJIB_GABUNG.push({ id, url, text });
                fs.writeFileSync(FSUB_FILE, JSON.stringify(WAJIB_GABUNG, null, 2));
                
                bot.sendMessage(chatId, `✅ <b>Berhasil Ditambahkan!</b>\n\n🆔 ID: <code>${id}</code>\n🔗 Link: ${url}\n🔘 Tombol: ${text}`, { parse_mode: "HTML" });
            });
        }
                else if (data === "del_fsub") {
            if (!isAdmin(call.from.id)) return bot.answerCallbackQuery(call.id, { text: "❌ Akses Ditolak!", show_alert: true });
            await bot.answerCallbackQuery(call.id);
            
            let sentMsg = await bot.sendMessage(chatId, "➖ <b>Hapus FSUB (Mode Pintar)</b>\nSilakan kirim <b>Link Channel</b> atau <b>Username</b> yang ingin dihapus.\n\nContoh:\n<code>https://t.me/ranzzyx</code> atau <code>@ranzzyx</code>", { parse_mode: "HTML", reply_markup: { force_reply: true } });
            
            bot.onReplyToMessage(chatId, sentMsg.message_id, (reply) => {
                let input = reply.text.trim();
                let targetId = "";

                // Logika Pendeteksi: Jika input adalah Link, ambil usernamenya
                let linkMatch = input.match(/t\.me\/([a-zA-Z0-9_]+)/);
                if (linkMatch && linkMatch[1]) {
                    targetId = "@" + linkMatch[1];
                } else {
                    // Jika bukan link, pastikan berawalan @
                    targetId = input.startsWith("@") ? input : "@" + input;
                }

                let awal = WAJIB_GABUNG.length;
                // Proses penghapusan berdasarkan ID/Username yang ditemukan
                WAJIB_GABUNG = WAJIB_GABUNG.filter(ch => ch.id.toLowerCase() !== targetId.toLowerCase());
                
                if (WAJIB_GABUNG.length < awal) {
                    fs.writeFileSync(FSUB_FILE, JSON.stringify(WAJIB_GABUNG, null, 2));
                    bot.sendMessage(chatId, `✅ <b>Berhasil Dihapus!</b>\nChannel <code>${targetId}</code> telah dikeluarkan dari daftar Wajib Gabung.`, { parse_mode: "HTML" });
                } else {
                    bot.sendMessage(chatId, `❌ <b>Gagal!</b>\nChannel <code>${targetId}</code> tidak ditemukan dalam daftar FSUB kamu.`, { parse_mode: "HTML" });
                }
            });
        }
    } catch (e) { log(`❌ Callback Error: ${e.message}`); }
});

(async () => {
    log("🚀 SUPER BOT HYBRID (12-in-1 FULL ORIGINAL LOGIC) STARTED...");
    
    // Tarikan Pertama (Staggered biar gak nabrak IP)
    setTimeout(() => checkLamix(LAMIX1, 'lamix1', 'LAMIX-1'), 0); 
    setTimeout(checkRoxy, 3000); 
    setTimeout(checkMSI, 6000); 
    setTimeout(checkNPanel, 9000); 
    setTimeout(checkProton, 12000); 
    setTimeout(checkPurple, 15000); 
    setTimeout(checkFlyn, 18000); 
    setTimeout(checkKonekta, 21000); 
    setTimeout(checkIMS, 24000); 
    setTimeout(checkSven1tel, 27000); 
    setTimeout(checkFlex, 30000);
    setTimeout(checkFlex2, 33000);
    
    // Looping Berulang
    setInterval(() => checkLamix(LAMIX1, 'lamix1', 'LAMIX-1'), 30000); 
    setInterval(checkRoxy, 30000); 
    setInterval(checkMSI, 30000);
    setInterval(checkNPanel, 30000); 
    setInterval(checkProton, 30000); 
    setInterval(checkPurple, 30000);
    setInterval(checkFlyn, 30000); 
    setInterval(checkKonekta, 30000); 
    setInterval(checkIMS, 30000); 
    setInterval(checkSven1tel, 30000); 
    setInterval(checkFlex, 30000);
    setInterval(checkFlex2, 30000);
})();

