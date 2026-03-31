import { state } from './state.js';

// Utility functions for formatting and sound
export function formatNumber(num) {
    if (state.shorthandNumbers) {
        if (num >= 1000000000000) return Math.floor(num / 1000000000000) + 'T';
        if (num >= 1000000000) return Math.floor(num / 1000000000) + 'B';
        if (num >= 1000000) return Math.floor(num / 1000000) + 'M';
    }
    
    // Comma-separated whole numbers
    return Math.floor(num).toLocaleString();
}

export function formatRate(num) {
    if (num < 1000) {
        // Show 1 decimal place for precision in small numbers
        return num.toFixed(1).replace(/\.0$/, ''); 
    }
    return Math.floor(num).toLocaleString();
}

export function roundToNice(num) {
    if (num < 1000) return Math.ceil(num / 50) * 50;
    if (num < 10000) return Math.ceil(num / 1000) * 1000;
    if (num < 1000000) return Math.ceil(num / 10000) * 10000;
    return Math.ceil(num / 1000000) * 1000000;
}

export const playUpgradeSound = () => {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.2;
        audio.play();
    } catch(e) {}
};
