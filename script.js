// ========================================
// ARTIFACT WORLD (optimized)
// ========================================

let scene;
let camera;
let renderer;
let clock;
let elapsedTime = 0;

let player;

let leftLeg;
let rightLeg;
let leftArm;
let rightArm;

let strength = 0;
let coins = 500;

let power = 1;
let capacity = 100;

let powerCost = 25;
let bagCost = 50;

let level = 1;

let currentSkin = "blue";

let pets = [];
let artifacts = [];
let swords = [];

// REBIRTH holati (rebirths = manba; multiplierlar undan hisoblanadi va keshlanadi)
let rebirths = 0;
let rebirthMultiplier = 1;  // 1 + rebirths * 5
let moneyMultiplier = 1;    // 2 ^ rebirths

// PRESTIGE vizual effektlari
let playerAura = null;        // player atrofidagi doimiy porlash halqasi
let prestigeParticles = [];   // rebirth paytidagi vaqtinchalik zarralar

// PLAYER HP = 10,000,000 (NPC hujum qilmaydi, kamaymaydi)
let playerMaxHp = 10000000;
let playerHp = 10000000;

let npcs = [];
let swordDrops = [];

const MAX_ACTIVE_PETS = 5;     // bir vaqtda faol pet limiti
const MAX_PET_INVENTORY = 999;  // umumiy pet inventory (quantity uchun katta)
const MAX_ARTIFACTS = 2;
const MAX_SWORDS_EQUIPPED = 2;

// REBIRTH uchun kerakli Strength (1-Rebirth uchun baza)
const REBIRTH_BASE_STRENGTH = 1000000;
// Maksimal Rebirth soni
const MAX_REBIRTHS = 10;

// ========================================
// PRESTIGE TIERS (rebirth soniga qarab daraja, rang va aura)
// ========================================
const PRESTIGE_TIERS = [
    { min: 0,  name: "None",     icon: "",   color: 0x000000, glow: false },
    { min: 1,  name: "Bronze",   icon: "🥉", color: 0xcd7f32, glow: true },
    { min: 3,  name: "Silver",   icon: "🥈", color: 0xc0c0c0, glow: true },
    { min: 5,  name: "Gold",     icon: "🥇", color: 0xffd700, glow: true },
    { min: 8,  name: "Platinum", icon: "💎", color: 0x5fe0e0, glow: true },
    { min: 12, name: "Diamond",  icon: "💚", color: 0x7dff9a, glow: true },
    { min: 18, name: "Cosmic",   icon: "🌌", color: 0xc77dff, glow: true }
];

// Berilgan rebirth soniga mos prestige tier'ni qaytaradi
function getPrestigeTier(count) {
    let tier = PRESTIGE_TIERS[0];
    for (let i = 0; i < PRESTIGE_TIERS.length; i++) {
        if (count >= PRESTIGE_TIERS[i].min) { tier = PRESTIGE_TIERS[i]; }
    }
    return tier;
}

// Movement (deltaTime asosida, FPS'ga bog'liq emas)
const NORMAL_SPEED = 25;
const SPRINT_SPEED = 50;

const ATTACK_RANGE = 5;
const PICKUP_RANGE = 2.2;

const keys = {};

// ========================================
// SKINS
// ========================================

const SKINS = {
    blue:   { name: "Blue Hero",    body: 0x1688ff, dark: 0x104fae, accent: 0x4de3ff },
    red:    { name: "Red Warrior",  body: 0xff334d, dark: 0x9e1027, accent: 0xffb51b },
    purple: { name: "Purple Ninja", body: 0xc45cff, dark: 0x651db9, accent: 0xe4a5ff }
};

// ========================================
// ARTIFACTS
// ========================================

const ARTIFACTS = {
    crystal: { name: "Power Crystal", icon: "💎", rarity: "Common",    bonus: 0.25, price: 250,  level: 1 },
    fire:    { name: "Fire Core",     icon: "🔥", rarity: "Rare",      bonus: 0.50, price: 500,  level: 2 },
    crown:   { name: "Golden Crown",  icon: "👑", rarity: "Epic",      bonus: 1,    price: 1000, level: 3 },
    void:    { name: "Void Heart",    icon: "🌌", rarity: "Legendary", bonus: 2,    price: 2500, level: 5 }
};

// ========================================
// PETS
// ========================================

const PETS = {
    dog:    { name: "Dog",    icon: "🐶", multiplier: .5, rarity: "Common" },
    cat:    { name: "Cat",    icon: "🐱", multiplier: 1,  rarity: "Rare" },
    fox:    { name: "Fox",    icon: "🦊", multiplier: 2,  rarity: "Epic" },
    dragon: { name: "Dragon", icon: "🐉", multiplier: 4,  rarity: "Legendary" }
};

// Pet type tartibi (inventory ko'rinishi uchun barqaror tartib)
const PET_ORDER = ["dog", "cat", "fox", "dragon"];

// ========================================
// NPC TYPES (katta HP qiymatlari, damage endi ishlatilmaydi)
// ========================================

const NPC_TYPES = {
    weak:   { label: "Weak NPC",   hp: 100000,   respawnTime: 8000,  color: 0x8fbf5a },
    normal: { label: "Normal NPC", hp: 500000,   respawnTime: 12000, color: 0x4a90d9 },
    strong: { label: "Strong NPC", hp: 2000000,  respawnTime: 18000, color: 0xd9822b },
    elite:  { label: "Elite NPC",  hp: 10000000, respawnTime: 26000, color: 0xb23bd9 },
    boss:   { label: "Boss NPC",   hp: 50000000, respawnTime: 45000, color: 0xd92b2b }
};

// ========================================
// SWORD DROP TABLES (NPC kuchiga bog'liq)
// ========================================

const SWORD_DROP_CHANCE = 0.20;

const SWORD_TIERS = {
    weak:   { options: [ { name: "Wooden Sword", power: 5 },  { name: "Stone Sword", power: 10 },  { name: "Iron Dagger", power: 15 } ] },
    normal: { options: [ { name: "Iron Sword", power: 15 },   { name: "Steel Sword", power: 20 },  { name: "Silver Blade", power: 25 } ] },
    strong: { options: [ { name: "Battle Sword", power: 25 }, { name: "Flame Blade", power: 35 },  { name: "War Saber", power: 45 } ] },
    elite:  { options: [ { name: "Fire Sword", power: 45 },   { name: "Storm Blade", power: 60 },  { name: "Shadow Reaper", power: 80 } ] },
    boss:   { options: [ { name: "Demon Sword", power: 80 },  { name: "Void Blade", power: 100 },  { name: "Dragon Sword", power: 150 } ] }
};

function getSwordRarity(powerPercent) {
    if (powerPercent >= 80) return "Legendary";
    if (powerPercent >= 35) return "Epic";
    if (powerPercent >= 15) return "Rare";
    return "Common";
}

// ========================================
// SAFE DOM HELPERS
// ========================================

function byId(id) { return document.getElementById(id); }

function setText(id, value) {
    const el = byId(id);
    if (el) { el.textContent = value; }
}

function on(id, event, handler) {
    const el = byId(id);
    if (el) { el.addEventListener(event, handler); }
    else { console.warn("Element topilmadi:", id); }
}

function formatNumber(n) {
    // Faqat UI ko'rinishi uchun: har 3 raqamdan keyin "." (de-DE): 1000000 -> 1.000.000
    const value = Math.floor(Math.max(0, Number(n) || 0));
    return value.toLocaleString("de-DE");
}

// Katta sonlar uchun qisqartma format: 1K, 1M, 1B, 1T, 1Qa
// 1000 dan kichik sonlar to'liq (nuqtali) ko'rsatiladi.
// Masalan: 1500 -> 1.5K, 1000000 -> 1M, 2500000000 -> 2.5B
function formatShort(n) {
    const value = Math.floor(Math.max(0, Number(n) || 0));
    if (value < 1000) { return String(value); }

    const units = [
        { v: 1e15, s: "Qa" },
        { v: 1e12, s: "T" },
        { v: 1e9,  s: "B" },
        { v: 1e6,  s: "M" },
        { v: 1e3,  s: "K" }
    ];

    for (let i = 0; i < units.length; i++) {
        if (value >= units[i].v) {
            let num = value / units[i].v;
            // 2 xonagacha, keraksiz nollarni olib tashlaymiz (1.50 -> 1.5, 1.0 -> 1)
            let str = num.toFixed(2).replace(/\.?0+$/, "");
            return str + units[i].s;
        }
    }
    return String(value);
}
// ========================================
// ERROR HANDLING
// ========================================

function isWebGLAvailable() {
    try {
        const canvas = document.createElement("canvas");
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
    } catch (e) {
        return false;
    }
}

function reportFatalError(message, error) {
    if (error) { console.error(message, error); }
    else { console.error(message); }
    if (typeof window.showFatalError === "function") {
        window.showFatalError(message);
    }
}

// ========================================
// START
// ========================================

window.addEventListener("DOMContentLoaded", startGame);

function startGame() {
    if (typeof THREE === "undefined") {
        reportFatalError("❌ Three.js yuklanmadi. Internetni tekshirib, sahifani qayta yuklang (F5).");
        return;
    }
    if (!isWebGLAvailable()) {
        reportFatalError("❌ Brauzeringiz WebGL'ni qo‘llab-quvvatlamaydi yoki u o‘chirilgan. Boshqa brauzer yoki qurilmada urinib ko‘ring.");
        return;
    }
    try {
        initThree();
        createWorld();
        createPlayer();
        createMerchant();
        loadGame();
        updateUI();
        setupButtons();
        animate();
    } catch (error) {
        reportFatalError("❌ O‘yinni ishga tushirishda xatolik yuz berdi.", error);
    }
}

// ========================================
// THREE.JS
// ========================================

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x82c8f5);

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        .1,
        300
    );
    camera.position.set(0, 15, 20);

    renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;

    const container = byId("game");
    if (container) { container.appendChild(renderer.domElement); }
    else { throw new Error("#game konteyneri topilmadi"); }

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(20, 30, 10);
    scene.add(sun);
}

// ========================================
// WORLD
// ========================================

function createWorld() {
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(180, 180),
        new THREE.MeshLambertMaterial({ color: 0x4e9d4f })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const village = new THREE.Mesh(
        new THREE.CylinderGeometry(19, 19, .2, 32),
        new THREE.MeshLambertMaterial({ color: 0x65ad5c })
    );
    village.position.y = .1;
    scene.add(village);

    createRoads();

    createHouse(-13, -8);
    createHouse(13, -8);
    createHouse(-13, 9);
    createHouse(13, 9);
    createHouse(0, 16);

    createSellArea();
    createTrees();
    createLevelSigns();
    createZoneMarkers();
    spawnAllNpcs();
}

function createRoads() {
    const material = new THREE.MeshLambertMaterial({ color: 0x707070 });

    const vertical = new THREE.Mesh(new THREE.PlaneGeometry(7, 48), material);
    vertical.rotation.x = -Math.PI / 2;
    vertical.position.y = .15;
    scene.add(vertical);

    const horizontal = new THREE.Mesh(new THREE.PlaneGeometry(48, 7), material);
    horizontal.rotation.x = -Math.PI / 2;
    horizontal.position.y = .16;
    scene.add(horizontal);
}

function createHouse(x, z) {
    const house = new THREE.Group();

    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(7, 5, 6),
        new THREE.MeshLambertMaterial({ color: 0xd8aa76 })
    );
    walls.position.y = 2.5;
    house.add(walls);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(5.3, 3.5, 4),
        new THREE.MeshLambertMaterial({ color: 0x762d35 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 6.7;
    house.add(roof);

    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.5, .2),
        new THREE.MeshLambertMaterial({ color: 0x4a2818 })
    );
    door.position.set(0, 1.25, 3.05);
    house.add(door);

    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x6bd9ff });
    const window1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, .15), windowMaterial);
    window1.position.set(-2, 3, 3.05);
    house.add(window1);

    const window2 = window1.clone();
    window2.position.x = 2;
    house.add(window2);

    house.position.set(x, 0, z);
    scene.add(house);
}

function createTrees() {
    const positions = [
        [-27, -22], [27, -22], [-30, 2], [30, 2], [-28, 25],
        [28, 25], [-38, -5], [38, -5], [-38, 20], [38, 20]
    ];
    positions.forEach(position => {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(.35, .45, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x704522 })
        );
        trunk.position.y = 1.5;
        tree.add(trunk);
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2.2, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0x188c3c })
        );
        leaves.position.y = 4;
        tree.add(leaves);
        tree.position.set(position[0], 0, position[1]);
        scene.add(tree);
    });
}

function createSellArea() {
    const sell = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 4.5, .15, 24),
        new THREE.MeshBasicMaterial({ color: 0x00d084 })
    );
    sell.position.set(0, .2, -14);
    scene.add(sell);

    const text = createText("SELL");
    text.position.set(0, 2, -14);
    text.scale.set(4, 1, 1);
    scene.add(text);
}

function createLevelSigns() {
    const positions = [ [-5, 4], [5, 4], [-5, 8], [5, 8], [0, 12] ];
    positions.forEach((position, index) => {
        const sign = createText("LEVEL " + (index + 1));
        sign.position.set(position[0], 2, position[1]);
        sign.scale.set(3.5, .8, 1);
        scene.add(sign);
    });
}

function createZoneMarkers() {
    createZone(-45, 0, 20, 0x1f5c33, "FOREST");
    createZone(45, 0, 20, 0xc9a35f, "DESERT");
    createZone(0, 46, 20, 0xdfefff, "SNOW AREA");
    createZone(0, -58, 14, 0x3a0a0a, "BOSS AREA");
}

function createZone(x, z, radius, color, label) {
    const patch = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, .12, 24),
        new THREE.MeshLambertMaterial({ color: color })
    );
    patch.position.set(x, .05, z);
    scene.add(patch);

    const text = createText(label);
    text.position.set(x, 3, z);
    text.scale.set(5, 1.1, 1);
    scene.add(text);
}
// ========================================
// MERCHANT NPC (savdogar, jang qilmaydi)
// ========================================

function createMerchant() {
    const npc = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.8, 1),
        new THREE.MeshLambertMaterial({ color: 0x713cff })
    );
    body.position.y = 1.7;
    npc.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(.65, 12, 10),
        new THREE.MeshLambertMaterial({ color: 0xffc49b })
    );
    head.position.y = 3.1;
    npc.add(head);

    const hat = new THREE.Mesh(
        new THREE.ConeGeometry(.8, 1.2, 12),
        new THREE.MeshLambertMaterial({ color: 0x2d0a63 })
    );
    hat.position.y = 4;
    npc.add(hat);

    const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(.35, 0),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    crystal.position.set(.95, 2, 0);
    npc.add(crystal);

    npc.position.set(0, 0, 7);
    scene.add(npc);

    const label = createText("ARTIFACT MERCHANT");
    label.position.set(0, 5, 7);
    label.scale.set(6, 1.2, 1);
    scene.add(label);
}

// ========================================
// TEXT SPRITE
// ========================================

function createText(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,.7)";
    ctx.fillRect(5, 20, 502, 90);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 65);

    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
}

// ========================================
// NPC HP BAR TEXTURE
// ========================================

function drawNpcHpBar(canvas, name, hp, maxHp) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 150, 24);

    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(20, 44, 260, 20);

    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = ratio > 0.5 ? "#3ddc57" : ratio > 0.2 ? "#ffcc33" : "#ff4444";
    ctx.fillRect(20, 44, 260 * ratio, 20);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 44, 260, 20);

    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(formatShort(hp) + " / " + formatShort(maxHp), 150, 80);
}

function updateNpcHpBar(npc) {
    if (!npc.hpCanvas || !npc.hpTexture) return;
    drawNpcHpBar(npc.hpCanvas, npc.name, npc.hp, npc.maxHp);
    npc.hpTexture.needsUpdate = true;
}

// ========================================
// NPC CREATION
// ========================================

function createNpc(tier, name, x, z) {
    const data = NPC_TYPES[tier];
    if (!data) return null;

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.7, .9),
        new THREE.MeshLambertMaterial({ color: data.color })
    );
    body.position.y = 2.1;
    group.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(.6, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0xffe0b3 })
    );
    head.position.y = 3.35;
    group.add(head);

    group.position.set(x, 0, z);
    scene.add(group);

    const npc = {
        tier: tier,
        name: name,
        maxHp: data.hp,
        hp: data.hp,
        respawnTime: data.respawnTime,
        homeX: x,
        homeZ: z,
        group: group,
        alive: true,
        respawnTimer: 0
    };

    const hpCanvas = document.createElement("canvas");
    hpCanvas.width = 300;
    hpCanvas.height = 90;
    drawNpcHpBar(hpCanvas, npc.name, npc.hp, npc.maxHp);

    const hpTexture = new THREE.CanvasTexture(hpCanvas);
    const hpSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: hpTexture, transparent: true }));
    hpSprite.position.set(0, 4.4, 0);
    hpSprite.scale.set(3.2, 1, 1);
    group.add(hpSprite);

    npc.hpCanvas = hpCanvas;
    npc.hpTexture = hpTexture;
    npc.hpSprite = hpSprite;

    npcs.push(npc);
    return npc;
}

function spawnAllNpcs() {
    createNpc("weak", "Goblin", -18, -2);
    createNpc("weak", "Goblin Scout", 18, -2);
    createNpc("normal", "Wolf", -45, -12);
    createNpc("normal", "Wild Boar", -45, 12);
    createNpc("strong", "Sand Raider", 45, -12);
    createNpc("strong", "Scorpion King", 45, 12);
    createNpc("elite", "Frost Troll", -12, 46);
    createNpc("elite", "Ice Golem", 12, 46);
    createNpc("boss", "Ancient Dragon", 0, -58);
}
// ========================================
// PLAYER
// ========================================

function createPlayer() {
    if (player) { scene.remove(player); }

    const skin = SKINS[currentSkin] || SKINS.blue;
    player = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 1.55, .82),
        new THREE.MeshLambertMaterial({ color: skin.body })
    );
    body.position.y = 2.2;
    player.add(body);

    leftLeg = createPart(.42, 1.05, .48, skin.dark);
    rightLeg = createPart(.42, 1.05, .48, skin.dark);
    leftLeg.position.set(-.3, .75, 0);
    rightLeg.position.set(.3, .75, 0);
    player.add(leftLeg);
    player.add(rightLeg);

    const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const shoe1 = new THREE.Mesh(new THREE.BoxGeometry(.55, .3, .7), shoeMaterial);
    shoe1.position.set(-.3, .2, .08);
    player.add(shoe1);
    const shoe2 = shoe1.clone();
    shoe2.position.x = .3;
    player.add(shoe2);

    leftArm = createPart(.38, 1.25, .42, skin.body);
    rightArm = createPart(.38, 1.25, .42, skin.body);
    leftArm.position.set(-.85, 2.2, 0);
    rightArm.position.set(.85, 2.2, 0);
    player.add(leftArm);
    player.add(rightArm);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(.62, 12, 10),
        new THREE.MeshLambertMaterial({ color: 0xffc49b })
    );
    head.position.y = 3.75;
    player.add(head);

    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(.65, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: skin.dark })
    );
    hair.position.y = 3.95;
    player.add(hair);

    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), eyeMaterial);
    eye1.position.set(-.22, 3.78, -.55);
    player.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = .22;
    player.add(eye2);

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: skin.accent })
    );
    core.position.set(0, 2.3, -.47);
    player.add(core);

    player.position.set(0, 0, -2);
    scene.add(player);

    // PRESTIGE: rebirth bo'lsa player atrofida porlash halqasi (aura)
    addPlayerAura();
}

// Player oyoqlari ostiga prestige aura halqasini qo'shadi (rebirth > 0 bo'lsa)
function addPlayerAura() {
    playerAura = null;
    if (!player || rebirths <= 0) return;

    const tier = getPrestigeTier(rebirths);
    if (!tier.glow) return;

    const group = new THREE.Group();

    // Yerdagi porloq halqa
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, .12, 8, 32),
        new THREE.MeshBasicMaterial({ color: tier.color, transparent: true, opacity: .8 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .15;
    group.add(ring);

    // Ustunli yorug'lik silindri (yumshoq porlash)
    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 5, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: tier.color, transparent: true, opacity: .12, side: THREE.DoubleSide })
    );
    beam.position.y = 2.5;
    group.add(beam);

    player.add(group);
    playerAura = group;
}

// Aura'ni har frame'da yumshoq puls va aylanish bilan jonlantiradi
function updatePlayerAura(delta) {
    if (!playerAura) return;
    playerAura.rotation.y += delta * 1.2;
    const pulse = 1 + Math.sin(elapsedTime * 3) * 0.08;
    playerAura.scale.set(pulse, 1, pulse);
}

function createPart(x, y, z, color) {
    return new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        new THREE.MeshLambertMaterial({ color: color })
    );
}

// ========================================
// MOVEMENT (deltaTime asosida, FPS'ga bog'liq emas)
// ========================================

window.addEventListener("keydown", function(event) {
    const key = event.key.toLowerCase();
    keys[key] = true;
    if (key === "e") { talkToMerchant(); }
});

window.addEventListener("keyup", function(event) {
    keys[event.key.toLowerCase()] = false;
});

function movePlayer(delta) {
    if (!player || !camera) return;

    let x = 0;
    let z = 0;

    if (keys["w"]) z -= 1;
    if (keys["s"]) z += 1;
    if (keys["a"]) x -= 1;
    if (keys["d"]) x += 1;

    if (x !== 0 || z !== 0) {
        const length = Math.sqrt(x * x + z * z);
        x /= length;
        z /= length;

        // Sprint: Shift bosilganda tezroq
        const speed = keys["shift"] ? SPRINT_SPEED : NORMAL_SPEED;
        const step = speed * delta;

        player.position.x += x * step;
        player.position.z += z * step;
        player.rotation.y = Math.atan2(x, z);

        const t = elapsedTime * 9;
        if (leftLeg) leftLeg.rotation.x = Math.sin(t) * .3;
        if (rightLeg) rightLeg.rotation.x = Math.sin(t + Math.PI) * .3;
        if (leftArm) leftArm.rotation.x = Math.sin(t + Math.PI) * .2;
        if (rightArm) rightArm.rotation.x = Math.sin(t) * .2;
    }

    // Boundaries
    if (player.position.x < -60) player.position.x = -60;
    else if (player.position.x > 60) player.position.x = 60;
    if (player.position.z < -60) player.position.z = -60;
    else if (player.position.z > 60) player.position.z = 60;

    // Camera (frame-rate independent smoothing)
    const camFactor = Math.min(1, delta * 8);
    camera.position.x += (player.position.x - camera.position.x) * camFactor;
    camera.position.z += (player.position.z + 18 - camera.position.z) * camFactor;
    camera.lookAt(player.position.x, 1.5, player.position.z);

    checkSell();
}

// ========================================
// SELL
// ========================================

function checkSell() {
    if (!player) return;
    const dx = player.position.x;
    const dz = player.position.z + 14;
    if (dx * dx + dz * dz < 4.5 * 4.5) {
        if (strength > 0) {
            // Money multiplier hisobga olinadi: Base Coins × Money Multiplier
            const earned = Math.round(strength * moneyMultiplier);
            coins += earned;
            strength = 0;
            showMessage("💰 Sold! +" + formatShort(earned) + " coins (x" + moneyMultiplier + ")");
            updateLevel();
            updateUI();
            saveGame();
        }
    }
}

// ========================================
// POWER FORMULA
// ========================================

function getPetMultiplier() {
    let result = 1;
    for (let i = 0; i < pets.length; i++) {
        const pet = pets[i];
        if (pet.equipped && PETS[pet.type]) {
            result += PETS[pet.type].multiplier;
        }
    }
    return result;
}

function getArtifactMultiplier() {
    let result = 1;
    for (let i = 0; i < artifacts.length; i++) {
        const artifact = artifacts[i];
        if (artifact.equipped && ARTIFACTS[artifact.type]) {
            result += ARTIFACTS[artifact.type].bonus;
        }
    }
    return result;
}

function getSwordMultiplier() {
    let result = 1;
    for (let i = 0; i < swords.length; i++) {
        if (swords[i].equipped) {
            result += swords[i].power / 100;
        }
    }
    return result;
}

function getFinalPower() {
    return power * getPetMultiplier() * getArtifactMultiplier() * getSwordMultiplier() * rebirthMultiplier;
}

// ========================================
// REBIRTH SYSTEM
// ========================================

// Rebirth multiplierlarini rebirths qiymatidan qayta hisoblaydi (har frame emas,
// faqat rebirths o'zgarganda yoki load qilinganda chaqiriladi).
function recalcRebirthMultipliers() {
    rebirthMultiplier = 1 + (rebirths * 5);   // har rebirth = +5x (+500%)
    moneyMultiplier = Math.pow(2, rebirths);  // har rebirth = 2x pul
}

// Keyingi Rebirth uchun kerakli Strength: 1.000.000 * 100^rebirths
// (har keyingi Rebirth talabi oldingisidan 100x katta)
function getRequiredStrength() {
    return REBIRTH_BASE_STRENGTH * Math.pow(100, rebirths);
}

// Maksimal Rebirthga yetilganmi?
function isMaxRebirth() {
    return rebirths >= MAX_REBIRTHS;
}

// Rebirth mumkinligini tekshiradi (max limit + yetarli Strength)
function canRebirth() {
    return !isMaxRebirth() && strength >= getRequiredStrength();
}

// Confirmation modalidagi qiymatlarni yangilaydi va modalni ochadi
function openRebirthModal() {
    const required = getRequiredStrength();
    setText("rebirthReqStrength", formatNumber(required));
    setText("rebirthCurStrength", formatNumber(strength));
    setText("rebirthGainPower", "+500% Power multiplier (x" + (rebirthMultiplier + 5) + " total)");
    setText("rebirthGainMoney", "2x Money multiplier (x" + (moneyMultiplier * 2) + " total)");

    const confirmBtn = byId("rebirthConfirmBtn");
    const warn = byId("rebirthWarn");
    if (isMaxRebirth()) {
        if (confirmBtn) { confirmBtn.disabled = true; }
        if (warn) { warn.textContent = "🏆 MAX REBIRTH REACHED! " + MAX_REBIRTHS + "/" + MAX_REBIRTHS; }
    } else if (canRebirth()) {
        if (confirmBtn) { confirmBtn.disabled = false; }
        if (warn) { warn.textContent = ""; }
    } else {
        if (confirmBtn) { confirmBtn.disabled = true; }
        if (warn) { warn.textContent = "❌ You need " + formatNumber(required) + " Strength to Rebirth."; }
    }
    openModal("rebirthModal");
}

// Rebirthni amalga oshiradi (Confirm bosilganda)
function doRebirth() {
    if (isMaxRebirth()) {
        showMessage("🏆 MAX REBIRTH REACHED! " + MAX_REBIRTHS + "/" + MAX_REBIRTHS);
        return;
    }
    if (!canRebirth()) {
        showMessage("❌ You need " + formatNumber(getRequiredStrength()) + " Strength to Rebirth.");
        return;
    }

    // Rebirth count +1 va multiplierlarni qayta hisoblash
    rebirths += 1;
    recalcRebirthMultipliers();

    // Oddiy gameplay progress reset (pets / artifacts / swords / skin / rebirth SAQLANADI)
    strength = 0;
    coins = 500;
    power = 1;
    capacity = 100;
    powerCost = 25;
    bagCost = 50;
    level = 1;

    closeModal("rebirthModal");
    spawnPrestigeEffect();  // vizual prestige effekti
    createPlayer();          // aura yangi tier bilan qayta chiziladi
    if (isMaxRebirth()) {
        showMessage("🏆 MAX REBIRTH REACHED! Power x" + rebirthMultiplier + ", Money x" + moneyMultiplier);
    } else {
        showMessage("🔄 Rebirth successful! Power multiplier increased by 500%.");
    }
    updateUI();
    saveGame();
}

// Rebirth tugmasi bosilganda: yetarli bo'lmasa xabar, aks holda modal
function requestRebirth() {
    if (isMaxRebirth()) {
        showMessage("🏆 MAX REBIRTH REACHED! " + MAX_REBIRTHS + "/" + MAX_REBIRTHS);
        return;
    }
    if (!canRebirth()) {
        showMessage("❌ You need " + formatNumber(getRequiredStrength()) + " Strength to Rebirth.");
    }
    openRebirthModal();
}

// ========================================
// PRESTIGE VISUAL EFFECTS
// ========================================

// Rebirth paytida player atrofida zarra portlashi + ekran chaqnashi
function spawnPrestigeEffect() {
    triggerScreenFlash();
    playPrestigeSound(rebirths);
    if (!player || !scene) return;

    const tier = getPrestigeTier(rebirths);
    const color = tier.color || 0xffd700;
    const origin = player.position;
    const count = 26;

    // Bitta umumiy material/geometry (performance: har zarra uchun yangi yaratmaymiz)
    const geometry = new THREE.SphereGeometry(.18, 6, 6);

    for (let i = 0; i < count; i++) {
        const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(origin.x, 2, origin.z);

        const angle = (i / count) * Math.PI * 2;
        const speed = 4 + Math.random() * 4;
        prestigeParticles.push({
            mesh: mesh,
            vx: Math.cos(angle) * speed,
            vy: 3 + Math.random() * 4,
            vz: Math.sin(angle) * speed,
            life: 0,
            maxLife: 1.1
        });
        scene.add(mesh);
    }
}

// Zarralarni har frame'da yangilaydi (ko'tarilish, tortishish, so'nish, tozalash)
function updatePrestigeParticles(delta) {
    if (!prestigeParticles.length) return;
    for (let i = prestigeParticles.length - 1; i >= 0; i--) {
        const p = prestigeParticles[i];
        p.life += delta;

        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.vy -= 9 * delta; // tortishish

        const ratio = 1 - (p.life / p.maxLife);
        if (p.mesh.material) { p.mesh.material.opacity = Math.max(0, ratio); }

        if (p.life >= p.maxLife) {
            scene.remove(p.mesh);
            if (p.mesh.material) p.mesh.material.dispose();
            // geometry umumiy — dispose qilinmaydi
            prestigeParticles.splice(i, 1);
        }
    }
}

// Ekran bo'ylab qisqa chaqnash effekti (CSS overlay orqali)
let flashTimer;
function triggerScreenFlash() {
    const flash = byId("prestigeFlash");
    if (!flash) return;
    flash.classList.remove("active");
    // reflow — animatsiyani qayta ishga tushirish uchun
    void flash.offsetWidth;
    flash.classList.add("active");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function() { flash.classList.remove("active"); }, 900);
}

// ========================================
// PRESTIGE SOUND EFFECTS (Web Audio API, offline, fayl talab qilmaydi)
// ========================================

let audioCtx = null;

// AudioContext'ni birinchi foydalanuvchi harakatida ishga tushiradi (autoplay policy)
function getAudioContext() {
    try {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audioCtx = new AC();
        }
        if (audioCtx.state === "suspended") { audioCtx.resume(); }
        return audioCtx;
    } catch (e) {
        return null;
    }
}

// Bitta nota chaladi (oscillator + gain envelope)
function playTone(ctx, freq, startTime, duration, type, peakGain) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

// Prestige darajasiga qarab tantanali ovoz effekti
// Yuqoriroq tier => ko'proq nota + baland oktava + shimmer
function playPrestigeSound(count) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const tierIndex = PRESTIGE_TIERS.indexOf(getPrestigeTier(count));

    // Baza mажor arpeggio (C major) — tier oshgani sari yuqoriroq notalar qo'shiladi
    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0];
    const notesToPlay = Math.min(scale.length, 3 + tierIndex);
    const step = 0.09;

    for (let i = 0; i < notesToPlay; i++) {
        playTone(ctx, scale[i], now + i * step, 0.5, "triangle", 0.22);
    }

    // Tantanali past bas akkord
    playTone(ctx, 130.81, now, 0.7, "sawtooth", 0.12);
    playTone(ctx, 196.0, now + 0.02, 0.7, "sawtooth", 0.10);

    // Yuqori tierlar uchun "shimmer" (yaltiroq baland ohang)
    if (tierIndex >= 3) {
        const shimmerStart = now + notesToPlay * step;
        playTone(ctx, 2637.0, shimmerStart, 0.6, "sine", 0.14);
        playTone(ctx, 3135.96, shimmerStart + 0.06, 0.6, "sine", 0.10);
    }
}

function getAttackDamage() {
    return Math.max(5, Math.round(getFinalPower() * 5));
}
// ========================================
// TRAIN
// ========================================

function train() {
    if (strength >= capacity) {
        showMessage("🎒 Bag is full! Go SELL.");
        return;
    }
    let gain = Math.max(1, Math.floor(getFinalPower()));
    strength += gain;
    if (strength > capacity) { strength = capacity; }
    updateLevel();
    updateUI();
    saveGame();
}

// ========================================
// LEVEL
// ========================================

function updateLevel() {
    let newLevel = 1;
    if (strength >= 1000) { newLevel = 5; }
    else if (strength >= 500) { newLevel = 4; }
    else if (strength >= 250) { newLevel = 3; }
    else if (strength >= 100) { newLevel = 2; }

    if (newLevel > level) {
        level = newLevel;
        showMessage("🎉 LEVEL " + level + " UNLOCKED!");
    }
}

// ========================================
// BUY ARTIFACT
// ========================================

function buyArtifact(type) {
    const data = ARTIFACTS[type];
    if (!data) return;

    if (level < data.level) {
        showMessage("🔒 Need Level " + data.level);
        return;
    }
    if (coins < data.price) {
        showMessage("❌ Not enough coins!");
        return;
    }

    coins -= data.price;
    const activeCount = artifacts.filter(a => a.equipped).length;
    artifacts.push({ type: type, equipped: activeCount < MAX_ARTIFACTS });

    showMessage(data.icon + " " + data.name + " purchased!");
    updateUI();
    saveGame();
}

function toggleArtifact(index) {
    const artifact = artifacts[index];
    if (!artifact) return;

    if (artifact.equipped) {
        artifact.equipped = false;
    } else {
        const active = artifacts.filter(a => a.equipped).length;
        if (active >= MAX_ARTIFACTS) {
            showMessage("⚠️ Only 2 artifacts!");
            return;
        }
        artifact.equipped = true;
    }
    updateUI();
    saveGame();
}

function toggleSword(index) {
    const sword = swords[index];
    if (!sword) return;

    if (sword.equipped) {
        sword.equipped = false;
    } else {
        const active = swords.filter(s => s.equipped).length;
        if (active >= MAX_SWORDS_EQUIPPED) {
            showMessage("⚠️ Only 2 swords!");
            return;
        }
        sword.equipped = true;
    }
    updateUI();
    saveGame();
}

// ========================================
// EGG
// ========================================

function buyEgg() {
    if (coins < 100) {
        showMessage("❌ Not enough coins!");
        return;
    }
    if (pets.length >= MAX_PET_INVENTORY) {
        showMessage("🐾 Pet inventory full!");
        return;
    }

    coins -= 100;
    const random = Math.random();
    let type;
    if (random < .03) { type = "dragon"; }
    else if (random < .15) { type = "fox"; }
    else if (random < .40) { type = "cat"; }
    else { type = "dog"; }

    const data = PETS[type];
    const activePets = pets.filter(p => p.equipped).length;

    // Yangi pet inventoryga qo'shiladi. Joy bo'lsa avtomatik equip qilinadi.
    pets.push({ type: type, equipped: activePets < MAX_ACTIVE_PETS });

    // 🎉 You got: <icon> <name>  +X% Power
    showMessage("🎉 You got: " + data.icon + " " + data.name + "  +" + (data.multiplier * 100) + "% Power");

    updateUI();
    renderInventory();  // inventory ochiq bo'lsa darhol yangilanadi
    saveGame();
}

// ========================================
// UPGRADES
// ========================================

function upgradePower() {
    if (coins < powerCost) {
        showMessage("❌ Not enough coins!");
        return;
    }
    coins -= powerCost;
    power = Math.ceil(power * 1.5);
    powerCost = Math.ceil(powerCost * 1.5);
    updateUI();
    saveGame();
}

function upgradeBag() {
    if (coins < bagCost) {
        showMessage("❌ Not enough coins!");
        return;
    }
    coins -= bagCost;
    capacity = Math.ceil(capacity * 1.5);
    bagCost = Math.ceil(bagCost * 1.5);
    updateUI();
    saveGame();
}

// ========================================
// MERCHANT
// ========================================

function talkToMerchant() {
    if (!player) return;
    const dx = player.position.x;
    const dz = player.position.z - 7;
    if (dx * dx + dz * dz > 6 * 6) {
        showMessage("💎 Go closer to the Merchant!");
        return;
    }
    renderShop();
    openModal("shopModal");
}
// ========================================
// COMBAT: PLAYER -> NPC (NPC hech qachon playerga urmaydi)
// ========================================

function attackNearestNpc() {
    if (!player) return;

    let nearest = null;
    let nearestDistSq = Infinity;

    for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        if (!npc.alive) continue;
        const dx = player.position.x - npc.group.position.x;
        const dz = player.position.z - npc.group.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq <= ATTACK_RANGE * ATTACK_RANGE && distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearest = npc;
        }
    }

    if (!nearest) {
        showMessage("⚔️ No target nearby!");
        return;
    }

    const dmg = getAttackDamage();
    damageNpc(nearest, dmg);
    showMessage("⚔️ Hit " + nearest.name + " for " + formatShort(dmg));
}

function damageNpc(npc, amount) {
    if (!npc || !npc.alive) return;
    npc.hp -= amount;
    if (npc.hp <= 0) {
        npc.hp = 0;
        updateNpcHpBar(npc);
        killNpc(npc);
    } else {
        updateNpcHpBar(npc);
    }
}

function killNpc(npc) {
    npc.alive = false;
    npc.group.visible = false;
    npc.respawnTimer = npc.respawnTime;
    showMessage("💀 " + npc.name + " defeated!");
    rollSwordDrop(npc);
}

function respawnNpc(npc) {
    npc.hp = npc.maxHp;
    npc.alive = true;
    npc.group.visible = true;
    npc.group.position.set(npc.homeX, 0, npc.homeZ);
    updateNpcHpBar(npc);
}

// NPC AI YO'Q: NPC playerni quvmaydi, urmaydi, damage bermaydi.
// Faqat o'lgan NPC respawn qilinadi.
function updateNpcs(delta) {
    const ms = delta * 1000;
    for (let i = 0; i < npcs.length; i++) {
        const npc = npcs[i];
        if (!npc.alive) {
            npc.respawnTimer -= ms;
            if (npc.respawnTimer <= 0) {
                respawnNpc(npc);
            }
        }
    }
}

// ========================================
// COMBAT: MOUSE CLICK ATTACK
// ========================================

let _raycaster;
let _mouse;

function setupCombatClick() {
    if (!renderer || !camera) return;

    _raycaster = new THREE.Raycaster();
    _mouse = new THREE.Vector2();

    renderer.domElement.addEventListener("click", function(event) {
        if (!player) return;

        const rect = renderer.domElement.getBoundingClientRect();
        _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, camera);

        const aliveGroups = [];
        for (let i = 0; i < npcs.length; i++) {
            if (npcs[i].alive) aliveGroups.push(npcs[i].group);
        }
        if (!aliveGroups.length) return;

        const intersects = _raycaster.intersectObjects(aliveGroups, true);
        if (!intersects.length) return;

        let hitObject = intersects[0].object;
        while (hitObject && !npcs.some(n => n.group === hitObject)) {
            hitObject = hitObject.parent;
        }

        const npc = npcs.find(n => n.group === hitObject);
        if (!npc) return;

        const dx = player.position.x - npc.group.position.x;
        const dz = player.position.z - npc.group.position.z;
        if (dx * dx + dz * dz > ATTACK_RANGE * ATTACK_RANGE) {
            showMessage("⚔️ Too far away!");
            return;
        }

        const dmg = getAttackDamage();
        damageNpc(npc, dmg);
        showMessage("⚔️ Hit " + npc.name + " for " + formatShort(dmg));
    });
}

// ========================================
// PLAYER HP (NPC urmagani uchun kamaymaydi)
// ========================================

function updateHpUI() {
    setText("hpText", formatShort(playerHp) + " / " + formatShort(playerMaxHp));
    const fill = byId("hpBarFill");
    if (fill) {
        const ratio = Math.max(0, Math.min(1, playerHp / playerMaxHp));
        fill.style.width = (ratio * 100) + "%";
    }
}

// ========================================
// SWORD DROPS (yerda ko'rinadigan qurollar)
// Kuchli NPC = yaxshiroq sword tier
// ========================================

function rollSwordDrop(npc) {
    if (Math.random() >= SWORD_DROP_CHANCE) return;
    const tierData = SWORD_TIERS[npc.tier];
    if (!tierData) return;

    const option = tierData.options[Math.floor(Math.random() * tierData.options.length)];
    spawnSwordDrop(npc.group.position.x, npc.group.position.z, option);
}

function spawnSwordDrop(x, z, option) {
    const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(.45, 0),
        new THREE.MeshBasicMaterial({ color: 0xffe066 })
    );
    mesh.position.set(x, 1.1, z);
    scene.add(mesh);

    const label = createText("⚔️ " + option.name);
    label.position.set(x, 2.1, z);
    label.scale.set(3, .8, 1);
    scene.add(label);

    swordDrops.push({ mesh: mesh, label: label, option: option, baseY: 1.1 });
    showMessage("⚔️ A sword dropped nearby!");
}

function updateSwordDrops(delta) {
    if (!player) return;
    for (let i = swordDrops.length - 1; i >= 0; i--) {
        const drop = swordDrops[i];
        drop.mesh.rotation.y += delta * 2;
        drop.mesh.position.y = drop.baseY + Math.sin(elapsedTime * 3) * .15;

        const dx = player.position.x - drop.mesh.position.x;
        const dz = player.position.z - drop.mesh.position.z;
        if (dx * dx + dz * dz <= PICKUP_RANGE * PICKUP_RANGE) {
            collectSwordDrop(drop);
            swordDrops.splice(i, 1);
        }
    }
}

function collectSwordDrop(drop) {
    scene.remove(drop.mesh);
    scene.remove(drop.label);
    // Memory leak bo'lmasligi uchun geometry/material/texture ni tozalaymiz
    if (drop.mesh.geometry) drop.mesh.geometry.dispose();
    if (drop.mesh.material) drop.mesh.material.dispose();
    if (drop.label.material) {
        if (drop.label.material.map) drop.label.material.map.dispose();
        drop.label.material.dispose();
    }

    const equippedCount = swords.filter(s => s.equipped).length;
    swords.push({
        name: drop.option.name,
        power: drop.option.power,
        rarity: getSwordRarity(drop.option.power),
        equipped: equippedCount < MAX_SWORDS_EQUIPPED
    });

    showMessage("⚔️ " + drop.option.name + " (+" + drop.option.power + "%) obtained!");
    updateUI();
    saveGame();
}
// ========================================
// UI
// ========================================

function updateUI() {
    setText("level", level);
    setText("strength", formatShort(strength));
    setText("coins", formatShort(coins));
    setText("power", formatShort(power));
    setText("capacity", formatShort(capacity));
    setText("petMultiplier", "x" + getPetMultiplier().toFixed(1));

    const bonus = (getArtifactMultiplier() - 1) * 100;
    setText("artifactBonus", "+" + bonus + "%");

    setText("powerBtn", "⚡ Power +50% (" + formatShort(powerCost) + "🪙)");
    setText("bagBtn", "🎒 Bag +50% (" + formatShort(bagCost) + "🪙)");

    const equippedSwordCount = swords.filter(s => s.equipped).length;
    setText("swordsCount", equippedSwordCount + "/" + MAX_SWORDS_EQUIPPED);

    setText("totalPower", getFinalPower().toFixed(2) + "x");

    // REBIRTH ma'lumotlari
    setText("rebirths", rebirths + "/" + MAX_REBIRTHS);
    setText("rebirthMultiplier", "x" + rebirthMultiplier);
    setText("moneyMultiplier", "x" + moneyMultiplier);
    setText("rebirthCurLabel", formatNumber(strength));
    const rebirthBtn = byId("rebirthBtn");
    if (isMaxRebirth()) {
        setText("rebirthReqLabel", "MAX");
        if (rebirthBtn) {
            rebirthBtn.disabled = true;
            rebirthBtn.textContent = "🏆 MAX REBIRTH";
        }
    } else {
        setText("rebirthReqLabel", formatNumber(getRequiredStrength()));
        if (rebirthBtn) {
            rebirthBtn.disabled = !canRebirth();
            rebirthBtn.textContent = "🔄 Rebirth";
        }
    }

    // PRESTIGE badge (daraja nomi + belgisi + rangi)
    const tier = getPrestigeTier(rebirths);
    const badge = byId("prestigeBadge");
    if (badge) {
        if (rebirths > 0) {
            badge.style.display = "";
            badge.textContent = tier.icon + " " + tier.name.toUpperCase() + " • Rebirth " + rebirths;
            badge.style.color = "#" + tier.color.toString(16).padStart(6, "0");
        } else {
            badge.style.display = "none";
        }
    }

    updateHpUI();
    renderPets();
    renderActiveArtifacts();
    renderEquippedSwordsHud();
    renderShop();
}

function renderPets() {
    const active = pets.filter(p => p.equipped && PETS[p.type]);

    // ACTIVE PETS: n/5 hisoblagichi
    setText("petActiveCount", active.length + "/" + MAX_ACTIVE_PETS);

    const element = byId("petsList");
    if (!element) return;
    if (!active.length) { element.textContent = "No active pets"; return; }

    // Faol petlarni turi bo'yicha guruhlab ko'rsatamiz
    const counts = {};
    active.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });

    element.innerHTML = PET_ORDER.filter(t => counts[t]).map(type => {
        const data = PETS[type];
        return `${data.icon} ${data.name} 🟢 x${counts[type]}<br>`;
    }).join("");
}

function renderActiveArtifacts() {
    const element = byId("activeArtifacts");
    if (!element) return;
    const active = artifacts.filter(a => a.equipped);
    if (!active.length) { element.textContent = "None"; return; }

    element.innerHTML = active.map(artifact => {
        const data = ARTIFACTS[artifact.type];
        if (!data) return "";
        return `<div>${data.icon} ${data.name}</div>`;
    }).join("");
}

function renderEquippedSwordsHud() {
    const element = byId("equippedSwords");
    if (!element) return;
    const equipped = swords.filter(s => s.equipped);
    if (!equipped.length) { element.textContent = "None"; return; }

    element.innerHTML = equipped.map(sword =>
        `<div>⚔️ ${sword.name} (+${sword.power}%)</div>`
    ).join("");
}

function renderShop() {
    const container = byId("artifactShop");
    if (!container) return;
    container.innerHTML = "";

    Object.keys(ARTIFACTS).forEach(type => {
        const data = ARTIFACTS[type];
        const locked = level < data.level;

        const card = document.createElement("div");
        card.className = "artifactCard";
        card.innerHTML = `
            <div class="artifactIcon">${data.icon}</div>
            <div class="artifactData">
                <h3>${data.name}</h3>
                <p class="${data.rarity.toLowerCase()}">${data.rarity}</p>
                <p>⚡ +${data.bonus * 100}% Power</p>
                <p>🔓 Level ${data.level}</p>
                <p>🪙 ${formatShort(data.price)}</p>
            </div>
            <button class="buyBtn" ${locked ? "disabled" : ""}>${locked ? "🔒 Locked" : "BUY"}</button>
        `;

        const button = card.querySelector(".buyBtn");
        if (!locked && button) {
            button.addEventListener("click", function() { buyArtifact(type); });
        }
        container.appendChild(card);
    });
}

// ========================================
// INVENTORY
// ========================================

function renderInventory() {
    const petsElement = byId("inventoryPets");
    const artifactsElement = byId("inventoryArtifacts");
    const swordsElement = byId("inventorySwords");
    if (!petsElement || !artifactsElement || !swordsElement) return;

    // 🐾 PETS: turi bo'yicha guruhlab, har biri uchun Equip/Unequip tugmalari
    const petTypesOwned = PET_ORDER.filter(type =>
        pets.some(p => p.type === type && PETS[type])
    );

    petsElement.innerHTML = petTypesOwned.length
        ? petTypesOwned.map(type => {
            const data = PETS[type];
            const owned = pets.filter(p => p.type === type).length;
            const equipped = pets.filter(p => p.type === type && p.equipped).length;
            const rarityClass = data.rarity.toLowerCase();
            return `
                <div class="inventoryItem artifactInventory">
                    <span>
                        ${data.icon} ${data.name}
                        <span class="${rarityClass}">${data.rarity}</span><br>
                        ⚡ +${data.multiplier * 100}% Power &nbsp;•&nbsp; 📦 x${owned}${equipped ? ` &nbsp;•&nbsp; 🟢 ${equipped} active` : ""}
                    </span>
                    <span class="petBtnGroup">
                        <button class="equipBtn ${equipped ? "active" : ""}" data-pettype="${type}" data-petaction="equip">EQUIP</button>
                        <button class="equipBtn" data-pettype="${type}" data-petaction="unequip" ${equipped ? "" : "disabled"}>UNEQUIP</button>
                    </span>
                </div>`;
        }).join("")
        : "<p>No pets.</p>";

    artifactsElement.innerHTML = artifacts.length
        ? artifacts.map((artifact, index) => {
            const data = ARTIFACTS[artifact.type];
            if (!data) return "";
            return `
                <div class="inventoryItem artifactInventory">
                    <span>${data.icon} ${data.name}<br>+${data.bonus * 100}%</span>
                    <button class="equipBtn ${artifact.equipped ? "active" : ""}" data-index="${index}" data-kind="artifact">${artifact.equipped ? "ACTIVE" : "EQUIP"}</button>
                </div>`;
        }).join("")
        : "<p>No artifacts.</p>";

    swordsElement.innerHTML = swords.length
        ? swords.map((sword, index) => {
            return `
                <div class="inventoryItem artifactInventory">
                    <span>⚔️ ${sword.name}<br><span class="${sword.rarity.toLowerCase()}">${sword.rarity}</span> — +${sword.power}% Power</span>
                    <button class="equipBtn ${sword.equipped ? "active" : ""}" data-index="${index}" data-kind="sword">${sword.equipped ? "ACTIVE" : "EQUIP"}</button>
                </div>`;
        }).join("")
        : "<p>No swords.</p>";

    document.querySelectorAll(".equipBtn").forEach(button => {
        button.addEventListener("click", function() {
            // Pet tugmalari (turi bo'yicha equip/unequip)
            if (this.dataset.pettype) {
                if (this.dataset.petaction === "unequip") { unequipPetType(this.dataset.pettype); }
                else { equipPetType(this.dataset.pettype); }
                renderInventory();
                return;
            }
            const index = Number(this.dataset.index);
            if (this.dataset.kind === "sword") { toggleSword(index); }
            else { toggleArtifact(index); }
            renderInventory();
        });
    });
}

// Berilgan turdagi bitta petni faollashtiradi (MAX_ACTIVE_PETS chegarasida)
function equipPetType(type) {
    if (!PETS[type]) return;
    const activeCount = pets.filter(p => p.equipped).length;
    if (activeCount >= MAX_ACTIVE_PETS) {
        showMessage("🐾 Max " + MAX_ACTIVE_PETS + " active pets!");
        return;
    }
    const target = pets.find(p => p.type === type && !p.equipped);
    if (!target) { showMessage("🐾 No more " + PETS[type].name + " to equip!"); return; }
    target.equipped = true;
    showMessage("🟢 " + PETS[type].icon + " " + PETS[type].name + " equipped!");
    updateUI();
    saveGame();
}

// Berilgan turdagi bitta faol petni olib tashlaydi
function unequipPetType(type) {
    if (!PETS[type]) return;
    const target = pets.find(p => p.type === type && p.equipped);
    if (!target) return;
    target.equipped = false;
    showMessage("⚪ " + PETS[type].icon + " " + PETS[type].name + " unequipped!");
    updateUI();
    saveGame();
}

// ========================================
// MODALS
// ========================================

function openModal(id) {
    const modal = byId(id);
    if (modal) { modal.classList.remove("hidden"); }
}

function closeModal(id) {
    const modal = byId(id);
    if (modal) { modal.classList.add("hidden"); }
}
// ========================================
// BUTTONS
// ========================================

function setupButtons() {
    on("inventoryBtn", "click", function() { renderInventory(); openModal("inventoryModal"); });
    on("shopBtn", "click", function() { renderShop(); openModal("shopModal"); });
    on("skinBtn", "click", function() { openModal("skinModal"); });
    on("trainBtn", "click", train);
    on("attackBtn", "click", attackNearestNpc);
    on("powerBtn", "click", upgradePower);
    on("bagBtn", "click", upgradeBag);
    on("eggBtn", "click", buyEgg);
    on("rebirthBtn", "click", requestRebirth);
    on("rebirthConfirmBtn", "click", doRebirth);
    on("rebirthCancelBtn", "click", function() { closeModal("rebirthModal"); });

    setupCombatClick();

    document.querySelectorAll("[data-close]").forEach(button => {
        button.addEventListener("click", function() { closeModal(this.dataset.close); });
    });

    document.querySelectorAll(".skinChoice").forEach(button => {
        button.addEventListener("click", function() {
            document.querySelectorAll(".skinChoice").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentSkin = this.dataset.skin;
            createPlayer();
        });
    });

    document.querySelectorAll(".skinCard").forEach(button => {
        button.addEventListener("click", function() {
            currentSkin = this.dataset.skin;
            createPlayer();
            closeModal("skinModal");
            saveGame();
        });
    });
}

// ========================================
// MESSAGE
// ========================================

let messageTimer;

function showMessage(text) {
    const element = byId("message");
    if (!element) return;
    element.textContent = text;
    element.style.opacity = "1";
    clearTimeout(messageTimer);
    messageTimer = setTimeout(function() { element.style.opacity = "0"; }, 2200);
}

// ========================================
// SAVE / LOAD (playerHp ham saqlanadi)
// ========================================

function saveGame() {
    try {
        const save = {
            strength, coins, power, capacity, powerCost, bagCost,
            level, currentSkin, pets, artifacts, swords,
            playerHp, playerMaxHp,
            rebirths, rebirthMultiplier, moneyMultiplier
        };
        localStorage.setItem("artifactWorldSave", JSON.stringify(save));
    } catch (error) {
        console.error("Save error:", error);
    }
}

function loadGame() {
    let saved;
    try {
        saved = localStorage.getItem("artifactWorldSave");
    } catch (error) {
        console.error("Save o'qishda xatolik:", error);
        return;
    }
    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        strength = typeof data.strength === "number" ? data.strength : 0;
        coins = typeof data.coins === "number" ? data.coins : 500;
        power = typeof data.power === "number" ? data.power : 1;
        capacity = typeof data.capacity === "number" ? data.capacity : 100;
        powerCost = typeof data.powerCost === "number" ? data.powerCost : 25;
        bagCost = typeof data.bagCost === "number" ? data.bagCost : 50;
        level = typeof data.level === "number" ? data.level : 1;
        currentSkin = SKINS[data.currentSkin] ? data.currentSkin : "blue";
        pets = Array.isArray(data.pets) ? data.pets : [];
        // Pet ma'lumotlarini tozalash: noto'g'ri turlarni olib tashlash,
        // equipped ni bool ga aylantirish, faol petlarni MAX_ACTIVE_PETS ga cheklash
        let activeSoFar = 0;
        pets = pets
            .filter(p => p && typeof p === "object" && PETS[p.type])
            .map(p => {
                let equipped = p.equipped === true;
                if (equipped) {
                    if (activeSoFar < MAX_ACTIVE_PETS) { activeSoFar++; }
                    else { equipped = false; }
                }
                return { type: p.type, equipped: equipped };
            });
        artifacts = Array.isArray(data.artifacts) ? data.artifacts : [];
        swords = Array.isArray(data.swords) ? data.swords : [];

        playerMaxHp = typeof data.playerMaxHp === "number" ? data.playerMaxHp : 10000000;
        playerHp = typeof data.playerHp === "number" ? data.playerHp : playerMaxHp;
        // NPC urmagani uchun HP to'liq bo'lishi kafolatlanadi
        if (playerHp > playerMaxHp) playerHp = playerMaxHp;

        // REBIRTH: rebirths manba, multiplierlar undan qayta hisoblanadi (crash-safe)
        rebirths = (typeof data.rebirths === "number" && data.rebirths >= 0)
            ? Math.floor(data.rebirths) : 0;
        if (rebirths > MAX_REBIRTHS) rebirths = MAX_REBIRTHS;
        recalcRebirthMultipliers();

        createPlayer();
    } catch (error) {
        console.error("Save load error:", error);
    }
}

// ========================================
// ANIMATION (deltaTime asosida, optimallashtirilgan)
// ========================================

function animate() {
    requestAnimationFrame(animate);
    try {
        let delta = clock ? clock.getDelta() : 0;
        // Tab yashirilib qaytganda katta sakrash bo'lmasin
        if (delta > 0.1) delta = 0.1;

        elapsedTime += delta;

        movePlayer(delta);
        updateNpcs(delta);
        updateSwordDrops(delta);
        updatePrestigeParticles(delta);
        updatePlayerAura(delta);

        renderer.render(scene, camera);
    } catch (error) {
        console.error("Game loop xatosi:", error);
    }
}

// ========================================
// RESIZE
// ========================================

window.addEventListener("resize", function() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
});
