class LifeInvaders {
    constructor(canvasId, gridWidth, gridHeight) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = 10;
        
        // Game state
        this.grid = [];
        this.nextGrid = [];
        this.generation = 0;
        this.score = 0;
        this.killCount = 0;
        this.killsUntilEvolution = 10;
        this.isRunning = false;
        this.gameStarted = false;
        this.lastShotTime = 0;
        this.shotCooldown = 150; // milliseconds
        
        // Player ship
        this.player = {
            x: this.canvas.width / 2 - 15,
            y: this.canvas.height - 40,
            width: 30,
            height: 20,
            speed: 5,
            color: '#00ff00'
        };
        
        // Bullets array
        this.bullets = [];
        this.bulletSpeed = 8;
        this.bulletWidth = 3;
        this.bulletHeight = 10;
        
        // Input handling
        this.keys = {};
        
        // Particle effects
        this.particles = [];
        
        this.initializeGrid();
        this.setupEventListeners();
        this.generateInitialPattern();
        this.updateStats();
        this.gameLoop();
    }
    
    initializeGrid() {
        this.grid = [];
        this.nextGrid = [];
        
        for (let x = 0; x < this.gridWidth; x++) {
            this.grid[x] = [];
            this.nextGrid[x] = [];
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[x][y] = this.createCell();
                this.nextGrid[x][y] = this.createCell();
            }
        }
    }
    
    createCell() {
        return {
            alive: false,
            age: 0,
            hue: Math.random() * 360,
            generation: 0
        };
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Shooting
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Button handlers
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('newPatternBtn').addEventListener('click', () => this.generateInitialPattern());
        document.getElementById('manualEvolveBtn').addEventListener('click', () => this.updateGeneration());
    }
    
    startGame() {
        this.isRunning = true;
        this.gameStarted = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
    }
    
    pauseGame() {
        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    resetGame() {
        this.isRunning = false;
        this.gameStarted = false;
        this.generation = 0;
        this.score = 0;
        this.killCount = 0;
        this.bullets = [];
        this.particles = [];
        this.player.x = this.canvas.width / 2 - 15;
        this.player.y = this.canvas.height - 40;
        this.initializeGrid();
        this.generateInitialPattern();
        this.updateStats();
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    generateInitialPattern() {
        this.initializeGrid();
        
        // Generate multiple interesting patterns
        const patterns = [
            this.generateGliderFormation,
            this.generateOscillatorField,
            this.generateRandomClusters,
            this.generateSpaceshipFleet
        ];
        
        const patternGenerator = patterns[Math.floor(Math.random() * patterns.length)];
        patternGenerator.call(this);
        
        this.updateStats();
    }
    
    generateGliderFormation() {
        // Multiple gliders
        const glider = [
            [0,1,0],
            [0,0,1],
            [1,1,1]
        ];
        
        this.placePattern(glider, 10, 5);
        this.placePattern(glider, 30, 8);
        this.placePattern(glider, 50, 6);
        this.placePattern(glider, 20, 15);
        this.placePattern(glider, 40, 20);
    }
    
    generateOscillatorField() {
        // Blinkers
        const blinker = [[1,1,1]];
        for (let i = 0; i < 8; i++) {
            this.placePattern(blinker, 5 + i * 7, 5 + (i % 3) * 8);
        }
        
        // Beacons
        const beacon = [
            [1,1,0,0],
            [1,1,0,0],
            [0,0,1,1],
            [0,0,1,1]
        ];
        this.placePattern(beacon, 10, 25);
        this.placePattern(beacon, 40, 25);
    }
    
    generateRandomClusters() {
        for (let i = 0; i < 8; i++) {
            const centerX = Math.floor(Math.random() * (this.gridWidth - 10)) + 5;
            const centerY = Math.floor(Math.random() * (this.gridHeight - 15)) + 5;
            
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (Math.random() < 0.5) {
                        const x = centerX + dx;
                        const y = centerY + dy;
                        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                            this.grid[x][y].alive = true;
                            this.grid[x][y].age = 1;
                            this.grid[x][y].hue = Math.random() * 360;
                            this.grid[x][y].generation = this.generation;
                        }
                    }
                }
            }
        }
    }
    
    generateSpaceshipFleet() {
        // Lightweight spaceships
        const lwss = [
            [1,0,0,1,0],
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,1]
        ];
        
        this.placePattern(lwss, 10, 5);
        this.placePattern(lwss, 30, 10);
        this.placePattern(lwss, 50, 5);
        
        // Add some gliders
        const glider = [
            [0,1,0],
            [0,0,1],
            [1,1,1]
        ];
        this.placePattern(glider, 15, 20);
        this.placePattern(glider, 45, 25);
    }
    
    placePattern(pattern, startX, startY) {
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (pattern[y][x] === 1) {
                    const gridX = startX + x;
                    const gridY = startY + y;
                    if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
                        this.grid[gridX][gridY].alive = true;
                        this.grid[gridX][gridY].age = 1;
                        this.grid[gridX][gridY].hue = Math.random() * 360;
                        this.grid[gridX][gridY].generation = this.generation;
                    }
                }
            }
        }
    }
    
    updatePlayer() {
        if (!this.isRunning) return;
        
        // Movement
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.x += this.player.speed;
        }
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player.y += this.player.speed;
        }
        
        // Keep player within bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(this.canvas.height * 0.6, Math.min(this.canvas.height - this.player.height, this.player.y));
    }
    
    shoot() {
        if (!this.isRunning || !this.gameStarted) return;
        
        const now = Date.now();
        if (now - this.lastShotTime < this.shotCooldown) return;
        
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - this.bulletWidth / 2,
            y: this.player.y,
            width: this.bulletWidth,
            height: this.bulletHeight,
            color: '#ffff00'
        });
        
        this.lastShotTime = now;
    }
    
    updateBullets() {
        if (!this.isRunning) return;
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= this.bulletSpeed;
            
            // Remove bullets that go off screen
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collision with cells
            this.checkBulletCellCollision(bullet, i);
        }
    }
    
    checkBulletCellCollision(bullet, bulletIndex) {
        const startX = Math.floor(bullet.x / this.cellSize);
        const endX = Math.floor((bullet.x + bullet.width) / this.cellSize);
        const startY = Math.floor(bullet.y / this.cellSize);
        const endY = Math.floor((bullet.y + bullet.height) / this.cellSize);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    const cell = this.grid[x][y];
                    if (cell.alive) {
                        // Hit!
                        cell.alive = false;
                        cell.age = 0;
                        
                        // Add to score
                        this.score += 10 + cell.age;
                        this.killCount++;
                        
                        // Create explosion particles
                        this.createExplosion(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, cell.hue);
                        
                        // Remove bullet
                        this.bullets.splice(bulletIndex, 1);
                        
                        // Check if we should evolve
                        if (this.killCount % this.killsUntilEvolution === 0) {
                            this.updateGeneration();
                        }
                        
                        return;
                    }
                }
            }
        }
    }
    
    createExplosion(x, y, hue) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                hue: hue,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateGeneration() {
        this.generation++;
        
        // Calculate next generation
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const neighbors = this.getNeighbors(x, y);
                const liveNeighbors = neighbors.filter(n => n.alive);
                const currentCell = this.grid[x][y];
                const nextCell = this.nextGrid[x][y];
                
                // Apply Conway's Game of Life rules
                if (currentCell.alive) {
                    if (liveNeighbors.length === 2 || liveNeighbors.length === 3) {
                        nextCell.alive = true;
                        nextCell.age = currentCell.age + 1;
                        nextCell.hue = currentCell.hue;
                        nextCell.generation = currentCell.generation;
                    } else {
                        nextCell.alive = false;
                        nextCell.age = 0;
                    }
                } else {
                    if (liveNeighbors.length === 3) {
                        nextCell.alive = true;
                        nextCell.age = 1;
                        nextCell.generation = this.generation;
                        if (liveNeighbors.length > 0) {
                            const parentIndex = Math.floor(Math.random() * liveNeighbors.length);
                            nextCell.hue = liveNeighbors[parentIndex].hue;
                        } else {
                            nextCell.hue = Math.random() * 360;
                        }
                    } else {
                        nextCell.alive = false;
                        nextCell.age = 0;
                    }
                }
            }
        }
        
        // Swap grids
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
        
        // Create evolution effect
        this.createEvolutionEffect();
    }
    
    createEvolutionEffect() {
        // Create screen-wide evolution particles
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 60,
                maxLife: 60,
                hue: Math.random() * 360,
                size: Math.random() * 2 + 1
            });
        }
    }
    
    getNeighbors(x, y) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                    neighbors.push(this.grid[nx][ny]);
                }
            }
        }
        return neighbors;
    }
    
    updateStats() {
        const liveCells = this.grid.flat().filter(cell => cell.alive).length;
        const killsToNext = this.killsUntilEvolution - (this.killCount % this.killsUntilEvolution);
        const progressPercent = ((this.killCount % this.killsUntilEvolution) / this.killsUntilEvolution) * 100;
        
        document.getElementById('generation').textContent = this.generation;
        document.getElementById('liveCells').textContent = liveCells;
        document.getElementById('score').textContent = this.score;
        document.getElementById('killCount').textContent = this.killCount;
        document.getElementById('killProgress').textContent = this.killCount % this.killsUntilEvolution;
        document.getElementById('progressFill').style.width = progressPercent + '%';
        
        // Check win condition
        if (liveCells === 0 && this.gameStarted) {
            this.isRunning = false;
            this.gameStarted = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            setTimeout(() => {
                alert(`Mission Accomplished! All hostiles eliminated!\\nFinal Score: ${this.score}\\nGenerations: ${this.generation}`);
            }, 100);
        }
    }
    
    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw cells
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const cell = this.grid[x][y];
                if (cell.alive) {
                    const pixelX = x * this.cellSize;
                    const pixelY = y * this.cellSize;
                    
                    // Calculate color based on age
                    const maxAge = 50;
                    const ageRatio = Math.min(cell.age / maxAge, 1);
                    const lightness = Math.max(80 - (ageRatio * 60), 20);
                    const hsl = `hsl(${cell.hue}, 70%, ${lightness}%)`;
                    
                    this.ctx.fillStyle = hsl;
                    this.ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
                    
                    // Add glow effect
                    this.ctx.shadowColor = hsl;
                    this.ctx.shadowBlur = 5;
                    this.ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
                    this.ctx.shadowBlur = 0;
                }
            }
        }
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 10;
        
        // Draw ship shape
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(centerX, this.player.y + this.player.height * 0.7);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 5;
        
        for (const bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        this.ctx.shadowBlur = 0;
        
        // Draw particles
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            const hsl = `hsla(${particle.hue}, 70%, 60%, ${alpha})`;
            
            this.ctx.fillStyle = hsl;
            this.ctx.shadowColor = hsl;
            this.ctx.shadowBlur = 3;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    gameLoop() {
        this.updatePlayer();
        this.updateBullets();
        this.updateParticles();
        this.updateStats();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new LifeInvaders('gameCanvas', 60, 40);
});