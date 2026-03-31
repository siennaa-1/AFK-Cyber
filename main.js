import { loadGame, saveGame, state } from './state.js';
import { addLog, updateDisplay } from './ui.js';
import { gameLoop } from './logic.js';
import { startMatrixAnimation } from './matrix-background.js';

// Entry point Initialization
window.addEventListener('load', () => {
    // 1. Initial Load from Persistent Store
    const loaded = loadGame();
    
    // 2. Initial Logs for Atmosphere
    addLog("Neural interface synced.", "info");
    addLog("Establishing satellite link...", "info");
    if (loaded) {
        addLog("Database archive restored.", "info");
    } else {
        addLog("Database initialized. Connection stable.", "info");
    }

    // 3. Initial Display Sync
    updateDisplay();

    // 4. Start the Engine
    requestAnimationFrame(gameLoop);
    startMatrixAnimation();

    // 5. Reset Protocol Management
    const resetBtn = document.getElementById('reset-stats-btn');
    const resetModal = document.getElementById('reset-modal');
    const cancelReset = document.getElementById('cancel-reset');
    const confirmReset = document.getElementById('confirm-reset');

    // 6. Settings & Theme Management
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const themeOpts = document.querySelectorAll('.theme-opt');

    const setTheme = (theme) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('cyberclik_theme', theme);
        
        // Update active class
        themeOpts.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });

        // Trigger Matrix Color Sync
        const root = getComputedStyle(document.body);
        const primaryColor = root.getPropertyValue('--accent-primary').trim();
        if (window.updateMatrixColor) window.updateMatrixColor(primaryColor);
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('cyberclik_theme') || 'cyan';
    setTheme(savedTheme);

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
        closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
        
        // Shorthand Toggle
        const shorthandToggle = document.getElementById('shorthand-toggle');
        if (shorthandToggle) {
            shorthandToggle.innerText = `SHORTHAND: ${state.shorthandNumbers ? 'ON' : 'OFF'}`;
            shorthandToggle.addEventListener('click', () => {
                state.shorthandNumbers = !state.shorthandNumbers;
                shorthandToggle.innerText = `SHORTHAND: ${state.shorthandNumbers ? 'ON' : 'OFF'}`;
                saveGame();
                updateDisplay();
                addLog(`Format synced: ${state.shorthandNumbers ? "Compact" : "Full"}`);
            });
        }
        
        themeOpts.forEach(opt => {
            opt.addEventListener('click', () => setTheme(opt.dataset.theme));
        });

        // Close on backdrop click
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
    }

    let isResetting = false;
    if (resetBtn && resetModal) {
        resetBtn.addEventListener('click', () => {
            resetModal.classList.remove('hidden');
        });

        cancelReset.addEventListener('click', () => {
            resetModal.classList.add('hidden');
        });

        confirmReset.addEventListener('click', () => {
            isResetting = true;
            // Clear save
            localStorage.removeItem('cyberclik_save');
            // Force reload
            window.location.reload();
        });

        // Close on backdrop click
        resetModal.addEventListener('click', (e) => {
            if (e.target === resetModal) resetModal.classList.add('hidden');
        });
    }

    // 7. Critical Persistence: Save on exit/hidden
    const handleExit = () => {
        if (isResetting) return;
        saveGame();
    };
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') handleExit();
    });
    window.addEventListener('pagehide', handleExit);
    window.addEventListener('beforeunload', handleExit);
});
