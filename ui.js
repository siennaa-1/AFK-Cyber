// Lazy element cache to prevent nulls on early module load
let _elements = null;
const getElements = () => {
    if (!_elements) {
        _elements = {
            score: document.getElementById('score-display'),
            incrementBadge: document.getElementById('current-increment-text'),
            autoRateFooter: document.getElementById('auto-rate-text'),
            nextThreshold: document.getElementById('next-threshold-text'),
            progressFill: document.getElementById('progress-fill'),
            bonusTag: document.getElementById('bonus-tag'),
            systemLogs: document.getElementById('system-logs'),
            uptime: document.getElementById('uptime-text'),
            rebirth: document.getElementById('rebirth-text'),
            prestige: document.getElementById('prestige-text'),
            rebirthTarget: document.getElementById('rebirth-threshold-text'),
            prestigeReq: document.getElementById('prestige-requirement-text'),
            upgradeShop: document.getElementById('upgrade-shop'),
            playerLevel: document.getElementById('player-level'),
            playerXpFill: document.getElementById('player-xp-fill'),
            playerXpText: document.getElementById('player-xp-text')
        };
    }
    return _elements;
};

// Smooth interpolation state
let displayedScore = state.score;

export function addLog(msg, type = "") {
    const el = getElements();
    if (!el.systemLogs) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerText = `[${time}] ${msg}`;
    el.systemLogs.prepend(entry);
    
    if (el.systemLogs.children.length > 20) {
        el.systemLogs.removeChild(el.systemLogs.lastChild);
    }
}

import { formatNumber, formatRate } from './utils.js';
import { state, upgrades, isUpgradeUnlocked, getUpgradeMultiplier, getLevelMultiplier } from './state.js';

export function updateUptime() {
    const el = getElements();
    if (!el.uptime) return;
    const diff = Math.floor((Date.now() - state.startTime) / 1000);
    const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
    const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const secs = (diff % 60).toString().padStart(2, '0');
    el.uptime.innerText = `${hrs}:${mins}:${secs}`;
}

export function hardResetDisplay() {
    displayedScore = 0;
    const el = getElements();
    if (el.score) el.score.innerText = formatNumber(0);
}

export function updateDisplay() {
    const el = getElements();
    if (!el.score || !el.progressFill) return;

    // 1. Smoothly interpolate displayed score
    const lerpFactor = 0.5; // High performance zip
    const diff = state.score - displayedScore;
    
    if (Math.abs(diff) > 5000) {
        displayedScore = state.score;
    } else if (Math.abs(diff) < 0.1) {
        displayedScore = state.score;
    } else {
        displayedScore += diff * lerpFactor;
    }

    // 2. Refresh values
    el.score.innerText = formatNumber(displayedScore);
    
    // 3. Calculate total effective rate
    const rebirthMult = Math.pow(1.5, state.rebirths);
    const prestigeMult = 1 + (state.prestiges * 3);
    const globalBoost = 2;
    const levelMult = getLevelMultiplier();
    const totalEffectiveRate = state.increment * rebirthMult * prestigeMult * globalBoost * levelMult;
    
    // 4. Update UI elements
    const rateText = `x${formatRate(totalEffectiveRate)}`;
    const multIndicator = state.rebirths > 0 ? ` (x${Math.pow(1.5, state.rebirths)})` : '';
    
    if (el.incrementBadge) el.incrementBadge.innerText = rateText + multIndicator;
    if (el.autoRateFooter) el.autoRateFooter.innerText = rateText + "/s";
    
    el.nextThreshold.innerText = `Next at ${formatNumber(state.nextThreshold)}`;
    
    const progressTotal = state.nextThreshold - state.lastThreshold;
    const progressCurrent = state.score - state.lastThreshold;
    const percentage = Math.max(0, Math.min(((progressCurrent / (progressTotal || 1)) * 100), 100));
    
    el.progressFill.style.transform = `scaleX(${percentage / 100})`;
    el.bonusTag.innerText = `BONUS: x${formatRate(state.currentBonus)} NEXT`;
    
    el.rebirth.innerText = state.rebirths;
    el.prestige.innerText = state.prestiges;
    
    if (el.rebirthTarget) el.rebirthTarget.innerText = formatNumber(state.nextRebirthThreshold);
    if (el.prestigeReq) el.prestigeReq.innerText = `${state.rebirths}/3 RB`;
    
    // Player Level UI
    if (el.playerLevel) el.playerLevel.innerText = `LVL ${state.playerLevel}`;
    if (el.playerXpFill) {
        const xpPercent = (state.playerXp / state.xpToNextLevel) * 100;
        el.playerXpFill.style.transform = `scaleX(${xpPercent / 100})`;
    }
    if (el.playerXpText) el.playerXpText.innerText = `${formatNumber(state.playerXp)} / ${formatNumber(state.xpToNextLevel)} XP`;
}

export function triggerPulse() {
    const el = getElements();
    if (!el.score) return;
    el.score.classList.remove('increase-anim');
    void el.score.offsetWidth;
    el.score.classList.add('increase-anim');
}
