// Matrix Code Background Effect
let canvas, ctx, width, height, columns, drops;
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+=-';
let matrixColor = '#00f5ff'; // Default

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);
    
    // Theme-compatible color sync
    ctx.fillStyle = matrixColor;
    ctx.font = '20px monospace';
    ctx.shadowBlur = 8;
    ctx.shadowColor = matrixColor;
    
    for(let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * 20, drops[i] * 20);
        
        if(drops[i] * 20 > height && Math.random() > 0.975) drops[i] = 0;
        
        drops[i]++;
    }
}

// Global hook for theme switching
window.updateMatrixColor = (newColor) => {
    matrixColor = newColor;
};

export function startMatrixAnimation() {
    canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    columns = Math.floor(width / 20);
    drops = [];
    for(let i = 0; i < columns; i++) drops[i] = 1;

    setInterval(draw, 33);
}

// Render frame
export function renderMatrixFrame() {
    if (ctx) draw();
}

// Handle window resize event
window.addEventListener('resize', () => {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / 20);
    drops = [];
    for(let i = 0; i < Math.floor(width / 20); i++) drops[i] = 1;
});
