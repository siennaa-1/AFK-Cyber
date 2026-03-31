// Global game state object
export const state = {
    score: 0,
    increment: 1,
    currentBonus: 1.2, // Multiplicative per level
    currentGap: 80,
    lastThreshold: 0,
    nextThreshold: 80,
    startTime: Date.now(),
    rebirths: 0,
    prestiges: 0,
    milestones: 0,
    nextRebirthThreshold: 100000, // 100k
    upgrades: {},
    // Player Level System
    playerLevel: 1,
    playerXp: 0,
    xpToNextLevel: 300,
    // Display settings
    shorthandNumbers: true
};

export function getLevelMultiplier() {
    return 1 + (state.playerLevel - 1) * 0.05; // +5% power per level
}

export function addXp(amount) {
    state.playerXp += amount;
    checkLevelUp();
}

export function checkLevelUp() {
    if (state.playerXp >= state.xpToNextLevel) {
        state.playerXp -= state.xpToNextLevel;
        state.playerLevel++;
        state.xpToNextLevel = Math.floor(state.xpToNextLevel * 1.25); // 25% more XP per level
        return true;
    }
    return false;
}

export const upgrades = [
    {
        id: 'multiplier',
        name: 'NEURAL BOOST',
        desc: '+20% power',
        requiredLevel: 5,
        effect: 1.2
    },
    {
        id: 'speed',
        name: 'TEMPORAL SHIFT',
        desc: '+30% speed',
        requiredLevel: 10,
        effect: 1.3
    },
    {
        id: 'efficiency',
        name: 'EFFICIENCY MATRIX',
        desc: '-10% gap scaling',
        requiredLevel: 15,
        effect: 0.9
    },
    {
        id: 'luck',
        name: 'LUCK OVERRIDE',
        desc: '+15% bonus power',
        requiredLevel: 20,
        effect: 1.15
    },
    {
        id: 'autosave',
        name: 'AUTO SYNC',
        desc: 'Auto-save every 10s',
        requiredLevel: 8,
        effect: 10
    },
    {
        id: 'fortune',
        name: 'FORTUNE',
        desc: '+50% power',
        requiredLevel: 25,
        effect: 1.5
    }
];

export function isUpgradeUnlocked(id) {
    const upgrade = upgrades.find(u => u.id === id);
    if (!upgrade) return false;
    return state.playerLevel >= upgrade.requiredLevel;
}

export function getUpgradeMultiplier() {
    let mult = 1;
    
    upgrades.forEach(upgrade => {
        if (isUpgradeUnlocked(upgrade.id)) {
            // Efficiency and autosave don't affect power
            if (upgrade.id === 'efficiency' || upgrade.id === 'autosave') {
                // Skip these - handled separately
            } else {
                mult *= upgrade.effect;
            }
        }
    });
    
    return mult;
}

export function getAutosaveInterval() {
    if (isUpgradeUnlocked('autosave')) {
        const autosave = upgrades.find(u => u.id === 'autosave');
        return autosave.effect;
    }
    return 30; // Default 30s without upgrade
}

export function getEfficiencyMultiplier() {
    const efficiency = upgrades.find(u => u.id === 'efficiency');
    if (efficiency && isUpgradeUnlocked('efficiency')) {
        return efficiency.effect;
    }
    return 1;
}

export function saveGame() {
    localStorage.setItem('cyberclik_save', JSON.stringify({
        ...state,
        saveTime: Date.now()
    }));
}

export function loadGame() {
    const saved = localStorage.getItem('cyberclik_save');
    
    // Capture the code-defined tuning benchmarks
    const baseRebirthThreshold = state.nextRebirthThreshold;
    const codeCurrentBonus = state.currentBonus;

    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            // 1. Restore the volatile progress data
            state.score = parseFloat(data.score) || 0;
            state.rebirths = parseInt(data.rebirths) || 0;
            state.prestiges = parseInt(data.prestiges) || 0;
            state.milestones = parseInt(data.milestones) || 0;
            if (data.startTime) state.startTime = data.startTime;
            
            // Load display settings
            if (data.shorthandNumbers !== undefined) {
                state.shorthandNumbers = data.shorthandNumbers;
            }
            
            // Load player level (Production Release)
            state.playerLevel = parseInt(data.playerLevel) || 1;
            state.playerXp = parseFloat(data.playerXp) || 0;
            state.xpToNextLevel = parseInt(data.xpToNextLevel) || 300;
            
            // Load upgrades
            state.upgrades = data.upgrades || {};

            // 2. LIVE TUNING & PERSISTENCE
            state.currentBonus = codeCurrentBonus; // Always adopt latest code tuning
            
            // Restore Rebirth Threshold (PRIORITIZE SAVE)
            if (data.nextRebirthThreshold) {
                state.nextRebirthThreshold = parseFloat(data.nextRebirthThreshold);
            } else {
                state.nextRebirthThreshold = baseRebirthThreshold * Math.pow(5, state.rebirths); 
            }
            
            // Restore Increment (PRIORITIZE SAVE)
            if (data.increment !== undefined) {
                state.increment = parseFloat(data.increment);
            } else {
                // Migration Fallback
                state.increment = Math.pow(state.currentBonus, state.milestones);
            }

            // 3. Resumption logic for standard milestones (Gaps)
            state.currentGap = parseInt(data.currentGap) || 80;
            state.lastThreshold = parseInt(data.lastThreshold) || 0;
            state.nextThreshold = parseInt(data.nextThreshold) || 80;
            
            // 4. Emergency Economic Re-Calibration (Impossible gaps check)
            if (state.nextThreshold > (state.score + 100) * 1000) { // Relaxed check
                state.currentGap = Math.max(100, Math.floor(state.score * 0.5));
                state.nextThreshold = Math.floor(state.lastThreshold + state.currentGap);
            }

            return true;
        } catch (e) {
            console.error("Save decode error:", e);
            return false;
        }
    }
    return false;
}
