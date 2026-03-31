import { state, saveGame, addXp, checkLevelUp as checkPlayerLevelUp, getLevelMultiplier } from './state.js';
import { updateDisplay, updateUptime, addLog, triggerPulse, hardResetDisplay } from './ui.js';
import { playUpgradeSound, formatRate, roundToNice, formatNumber } from './utils.js';

let lastTick = Date.now();
let saveTimer = 0;

export function checkLevelUp() {
    // Catch-up milestones if score jumped significantly (e.g. offline progress or large deltaTime)
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops or hangs
    let leveled = false;

    while (state.score >= state.nextThreshold && iterations < maxIterations) {
        // BALANCED Scaling: 1.2x per level
        state.increment *= state.currentBonus; 
        state.lastThreshold = state.nextThreshold;
        state.milestones += 1;
        
        // Progression challenge scaling
        state.currentGap = roundToNice(state.currentGap * 1.15);
        state.nextThreshold = roundToNice(state.lastThreshold + state.currentGap);
        
        leveled = true;
        iterations++;
    }

    if (leveled) {
        playUpgradeSound();
        addLog(`System optimized! Efficiency increased to x${formatRate(state.increment)}`, "level-up");
        triggerPulse();
        saveGame();
        
        const center = document.querySelector('.command-center');
        if (center) {
            center.style.borderColor = 'var(--accent-cyan)';
            setTimeout(() => {
                center.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            }, 300);
        }
    }
}

export function checkRebirth() {
    if (state.score >= state.nextRebirthThreshold) {
        state.rebirths += 1;
        state.nextRebirthThreshold *= 5; // 5x per rebirth

        resetProgress();
        hardResetDisplay();
        
        playUpgradeSound();
        addLog(`REBIRTH ${state.rebirths}: System purged. +50% power.`, "level-up");
        
        // Prestige at 3 rebirths
        if (state.rebirths >= 3) {
            checkPrestige();
        }
        
        saveGame();
    }
}

export function checkPrestige() {
    state.prestiges += 1;
    state.rebirths = 0;
    state.nextRebirthThreshold = 100000; // Reset threshold back to start for new prestige cycle

    // Full Reset including levels as requested
    resetProgress();
    hardResetDisplay();
    
    playUpgradeSound();
    addLog(`PRESTIGE ${state.prestiges}: Omega level transition complete. All systems overclocked.`, "level-up");
    saveGame();
}

function resetProgress() {
    state.score = 0;
    state.increment = 1;
    state.currentBonus = 1.2;
    state.currentGap = 80;
    state.lastThreshold = 0;
    state.nextThreshold = 80;
    state.milestones = 0;
    
    // Player Level Reset
    state.playerLevel = 1;
    state.playerXp = 0;
    state.xpToNextLevel = 300;
}

export function gameLoop() {
    const now = Date.now();
    
    // Initialize lastTick on the first frame it runs
    if (!lastTick) {
        lastTick = now;
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = Math.min((now - lastTick) / 1000, 1.0); // Cap deltaTime to 1s to prevent explosions
    lastTick = now;
    
    // Multipliers
    const rebirthMult = Math.pow(1.5, state.rebirths); 
    const prestigeMult = Math.pow(2, state.prestiges); // Exponential 2x multiplier per prestige
    const globalBoost = 2;
    const levelMult = getLevelMultiplier();
    
    // Accumulate score
    state.score += (state.increment * rebirthMult * prestigeMult * globalBoost * levelMult) * deltaTime;
    
    // Gain XP (Doubled per prestige)
    const xpBase = state.increment * deltaTime * 0.2;
    const xpGain = xpBase * Math.pow(2, state.prestiges); 
    addXp(xpGain);
    
    // Auto-save interval (Default 15s)
    const autosaveInterval = 15;
    
    saveTimer += deltaTime;
    if (saveTimer >= autosaveInterval) {
        saveGame();
        saveTimer = 0;
    }

    // Check player level up
    if (checkPlayerLevelUp()) {
        playUpgradeSound();
        addLog(`LEVEL UP! You are now level ${state.playerLevel}! (+${Math.round((getLevelMultiplier() - 1) * 100)}% power)`, "level-up");
        saveGame(); // Save on level up
    }

    updateUptime();
    checkLevelUp(); // milestone level up
    checkRebirth();
    updateDisplay();
    
    requestAnimationFrame(gameLoop);
}
