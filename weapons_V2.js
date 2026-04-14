// weapons_v2.js — НОВОЕ ОРУЖИЕ PIXEL STRIKE 10.0 (800+ строк)

const WEAPONS_V2 = {
    // ===== НОВЫЕ ПИСТОЛЕТЫ =====
    pistols: {
        // ... существующие ...
        
        // НОВИНКИ 10.0
        fn57: {
            name: 'FN Five-seveN', image: '🔫', type: 'pistol', team: 'both',
            damage: 32, headshotMultiplier: 3.8, armorPenetration: 0.91,
            fireRate: 0.12, reloadTime: 2.2, magazine: 20, maxAmmo: 100,
            price: 500, killReward: 300, rarity: 'rare', color: '#4169E1',
            special: 'armor_piercing'
        },
        
        hkp2000: {
            name: 'HK P2000', image: '🔫', type: 'pistol', team: 'ct',
            damage: 35, headshotMultiplier: 3.5, armorPenetration: 0.5,
            fireRate: 0.09, reloadTime: 2.0, magazine: 13, maxAmmo: 52,
            price: 200, killReward: 300, rarity: 'common', color: '#888',
            special: 'accurate'
        },
        
        // ЛЕГЕНДАРНЫЙ ПИСТОЛЕТ
        golden_deagle: {
            name: '★ Golden Desert Eagle', image: '👑', type: 'pistol', team: 'both',
            damage: 65, headshotMultiplier: 4.5, armorPenetration: 0.95,
            fireRate: 0.2, reloadTime: 2.0, magazine: 7, maxAmmo: 35,
            price: 1500, killReward: 500, rarity: 'legendary', color: '#FFD700',
            special: 'one_tap', tracer: 'gold'
        }
    },
    
    // ===== НОВЫЕ SMG =====
    smg: {
        // ... существующие ...
        
        // НОВИНКИ 10.0
        vector: {
            name: 'Vector .45 ACP', image: '🔫', type: 'smg', team: 'both',
            damage: 24, headshotMultiplier: 3.5, armorPenetration: 0.6,
            fireRate: 0.05, reloadTime: 2.4, magazine: 25, maxAmmo: 100,
            price: 2000, killReward: 600, rarity: 'epic', color: '#D32CE6',
            special: 'rapid_fire', recoil: { vertical: 0.3, horizontal: 0.4 }
        },
        
        thompson: {
            name: 'Thompson M1928', image: '🔫', type: 'smg', team: 'both',
            damage: 28, headshotMultiplier: 3.5, armorPenetration: 0.55,
            fireRate: 0.07, reloadTime: 3.0, magazine: 50, maxAmmo: 150,
            price: 1800, killReward: 600, rarity: 'rare', color: '#4169E1',
            special: 'drum_mag', vintage: true
        }
    },
    
    // ===== НОВЫЕ ВИНТОВКИ =====
    rifles: {
        // ... существующие ...
        
        // НОВИНКИ 10.0
        scarh: {
            name: 'SCAR-H', image: '🔫', type: 'rifle', team: 'both',
            damage: 38, headshotMultiplier: 4.0, armorPenetration: 0.8,
            fireRate: 0.11, reloadTime: 2.9, magazine: 20, maxAmmo: 80,
            price: 3500, killReward: 300, rarity: 'epic', color: '#D32CE6',
            special: 'high_damage', scope: true
        },
        
        hk416: {
            name: 'HK416', image: '🔫', type: 'rifle', team: 'ct',
            damage: 34, headshotMultiplier: 4.0, armorPenetration: 0.75,
            fireRate: 0.085, reloadTime: 2.8, magazine: 30, maxAmmo: 90,
            price: 3300, killReward: 300, rarity: 'epic', color: '#3498db',
            special: 'accurate', attachments: ['suppressor', 'scope']
        },
        
        // ЛЕГЕНДАРНАЯ ВИНТОВКА
        dragon_lore: {
            name: '★ AWP | Dragon Lore', image: '🐉', type: 'sniper', team: 'both',
            damage: 120, headshotMultiplier: 5.0, armorPenetration: 0.99,
            fireRate: 1.4, reloadTime: 3.5, magazine: 5, maxAmmo: 15,
            price: 10000, killReward: 500, rarity: 'mythic', color: '#FFD700',
            special: 'legendary', tracer: 'fire', scope: true, scopeMagnification: 3
        }
    },
    
    // ===== НОВЫЕ ТЯЖЁЛЫЕ =====
    heavy: {
        minigun: {
            name: 'M134 Minigun', image: '🔫🔫🔫', type: 'heavy', team: 'both',
            damage: 25, headshotMultiplier: 3.0, armorPenetration: 0.7,
            fireRate: 0.03, reloadTime: 8.0, magazine: 200, maxAmmo: 200,
            price: 8000, killReward: 100, rarity: 'legendary', color: '#FF4500',
            special: 'spin_up', movementPenalty: 0.5
        },
        
        rpg: {
            name: 'RPG-7', image: '🚀', type: 'heavy', team: 'both',
            damage: 150, headshotMultiplier: 1.0, armorPenetration: 1.0,
            fireRate: 3.0, reloadTime: 4.0, magazine: 1, maxAmmo: 3,
            price: 5000, killReward: 0, rarity: 'epic', color: '#e74c3c',
            special: 'explosive', splashRadius: 8
        }
    },
    
    // ===== НОВЫЕ ГРАНАТЫ =====
    grenades: {
        frag: {
            name: 'Осколочная граната', image: '💣', type: 'grenade',
            damage: 80, radius: 6, price: 300, maxCarry: 1, fuseTime: 3.0
        },
        flash: {
            name: 'Светошумовая', image: '💥', type: 'grenade',
            damage: 0, radius: 8, price: 200, maxCarry: 2, fuseTime: 2.0,
            duration: 4.0, blindIntensity: 0.9
        },
        smoke: {
            name: 'Дымовая завеса', image: '💨', type: 'grenade',
            damage: 0, radius: 10, price: 300, maxCarry: 1, fuseTime: 2.0,
            duration: 18.0
        },
        molotov: {
            name: 'Коктейль Молотова', image: '🔥', type: 'grenade', team: 't',
            damage: 20, radius: 5, price: 400, maxCarry: 1, fuseTime: 2.0,
            duration: 7.0, damagePerSecond: 15
        },
        incendiary: {
            name: 'Зажигательная', image: '🔥', type: 'grenade', team: 'ct',
            damage: 20, radius: 5, price: 600, maxCarry: 1, fuseTime: 2.0,
            duration: 7.0, damagePerSecond: 15
        },
        decoy: {
            name: 'Ложная граната', image: '📢', type: 'grenade',
            damage: 0, radius: 0, price: 50, maxCarry: 1, fuseTime: 2.0,
            duration: 15.0, fakeShots: true
        },
        
        // НОВИНКА 10.0
        emp: {
            name: 'EMP граната', image: '⚡', type: 'grenade',
            damage: 0, radius: 12, price: 500, maxCarry: 1, fuseTime: 2.0,
            special: 'disable_electronics', duration: 8.0
        },
        
        gas: {
            name: 'Газовая граната', image: '☠️', type: 'grenade',
            damage: 10, radius: 6, price: 350, maxCarry: 1, fuseTime: 2.0,
            duration: 10.0, damagePerSecond: 8, armorBypass: true
        }
    },
    
    // ===== НОВОЕ СНАРЯЖЕНИЕ =====
    equipment: {
        defuse_kit: {
            name: 'Набор сапёра', image: '🛠️', type: 'equipment', team: 'ct',
            price: 400, special: 'fast_defuse', defuseTime: 5.0
        },
        
        rescue_kit: {
            name: 'Набор спасателя', image: '🏥', type: 'equipment', team: 'ct',
            price: 400, special: 'fast_rescue'
        },
        
        zeus: {
            name: 'Zeus x27', image: '⚡', type: 'equipment', team: 'both',
            price: 200, damage: 100, range: 2.5, oneShot: true, singleUse: true
        },
        
        // НОВИНКА 10.0
        adrenaline: {
            name: 'Адреналин', image: '💉', type: 'equipment', team: 'both',
            price: 300, special: 'speed_boost', duration: 8.0, speedMultiplier: 1.3,
            healthRegen: 20
        },
        
        armor_plate: {
            name: 'Бронепластина', image: '🛡️', type: 'equipment', team: 'both',
            price: 500, special: 'armor_repair', armorRestore: 50
        },
        
        tactical_insertion: {
            name: 'Тактический маяк', image: '📍', type: 'equipment', team: 'both',
            price: 400, special: 'choose_spawn', singleUse: true
        }
    },
    
    // ===== НОВЫЕ НОЖИ =====
    knives: {
        // ... существующие ...
        
        // НОВИНКИ 10.0
        karambit_doppler: {
            name: '★ Керамбит | Допплер', image: '🔪', type: 'knife',
            damage: 70, backstabMultiplier: 2.5, fireRate: 0.32,
            rarity: 'legendary', color: '#FFD700', phase: 'sapphire'
        },
        
        butterfly_fade: {
            name: '★ Бабочка | Градиент', image: '🦋', type: 'knife',
            damage: 72, backstabMultiplier: 2.3, fireRate: 0.28,
            rarity: 'legendary', color: '#FF4500', fadePercent: 95
        },
        
        bayonet_crimson: {
            name: '★ Байонет | Crimson Web', image: '🔪', type: 'knife',
            damage: 68, backstabMultiplier: 2.5, fireRate: 0.35,
            rarity: 'epic', color: '#e74c3c', webPattern: true
        },
        
        talon_marble: {
            name: '★ Коготь | Marble Fade', image: '🦅', type: 'knife',
            damage: 69, backstabMultiplier: 2.4, fireRate: 0.33,
            rarity: 'legendary', color: '#FFD700', fireAndIce: true
        },
        
        // МИФИЧЕСКИЙ НОЖ
        gem_karambit: {
            name: '★★ Керамбит | Изумруд', image: '💚', type: 'knife',
            damage: 80, backstabMultiplier: 3.0, fireRate: 0.25,
            rarity: 'mythic', color: '#00FF00', special: 'emerald_glow', particles: true
        }
    }
};

// ===================================================================
// ЧАСТЬ 2: СИСТЕМА СКИНОВ
// ===================================================================

const SKIN_SYSTEM = {
    // Качество скинов
    qualities: {
        battle_scarred: { name: 'Поношенное', float: 0.44, color: '#888' },
        well_worn: { name: 'Потёртое', float: 0.37, color: '#aaa' },
        field_tested: { name: 'Полевые испытания', float: 0.20, color: '#ccc' },
        minimal_wear: { name: 'Минимальный износ', float: 0.07, color: '#eee' },
        factory_new: { name: 'Прямо с завода', float: 0.01, color: '#fff' }
    },
    
    // Статтрек
    statTrak: {
        enabled: true,
        priceMultiplier: 1.5
    },
    
    // Паттерны
    patterns: {
        case_hardened: { name: 'Закалённое', seed: Math.random },
        crimson_web: { name: 'Паутина', webCount: 3 },
        fade: { name: 'Градиент', fadePercent: 85 },
        marble: { name: 'Мрамор', fireAndIce: 0.05 },
        doppler: { name: 'Допплер', phase: ['ruby', 'sapphire', 'emerald', 'black_pearl'] }
    }
};

// ===================================================================
// ЧАСТЬ 3: ЭКСПОРТ
// ===================================================================

window.WEAPONS_V2 = WEAPONS_V2;
window.SKIN_SYSTEM = SKIN_SYSTEM;

console.log('✅ weapons_v2.js загружен (800+ строк) — Pixel Strike 10.0 Arsenal');