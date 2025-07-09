class LifeBreakout {
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
        this.isRunning = false;
        this.gameStarted = false;
        
        // Ball properties
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            vx: 3,
            vy: -3,
            radius: 6,
            color: '#ff4444'
        };
        
        // Paddle properties
        this.paddle = {
            x: this.canvas.width / 2 - 50,
            y: this.canvas.height - 20,
            width: 100,
            height: 10,
            speed: 8,
            color: '#4CAF50'
        };
        
        // Input handling
        this.keys = {};
        this.mouseX = 0;
        this.useMouseControl = false;
        
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
            this.keys[e.key] = true;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.useMouseControl = false;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.useMouseControl = true;
        });
        
        // Button handlers
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('seedBtn').addEventListener('click', () => this.generateInitialPattern());
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
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 100;
        this.ball.vx = 3;
        this.ball.vy = -3;
        this.paddle.x = this.canvas.width / 2 - 50;
        this.initializeGrid();
        this.generateInitialPattern();
        this.updateStats();
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    generateInitialPattern() {
        // Clear the grid first
        this.initializeGrid();
        
        // Generate interesting starting patterns
        const patterns = [
            this.generateGliderGun,
            this.generateRandomClusters,
            this.generateOscillators,
            this.generateSpaceships
        ];
        
        const patternGenerator = patterns[Math.floor(Math.random() * patterns.length)];
        patternGenerator.call(this);
        
        this.updateStats();
    }
    
    generateGliderGun() {
        // Gosper Glider Gun pattern
        const gunPattern = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        this.placePattern(gunPattern, 10, 5);
    }
    
    generateRandomClusters() {
        // Generate several random clusters
        for (let i = 0; i < 5; i++) {
            const centerX = Math.floor(Math.random() * (this.gridWidth - 10)) + 5;
            const centerY = Math.floor(Math.random() * (this.gridHeight - 10)) + 5;
            
            for (let dx = -3; dx <= 3; dx++) {
                for (let dy = -3; dy <= 3; dy++) {
                    if (Math.random() < 0.4) {
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
    
    generateOscillators() {
        // Blinker pattern
        const blinker = [[1,1,1]];
        this.placePattern(blinker, 10, 10);
        
        // Beacon pattern
        const beacon = [
            [1,1,0,0],
            [1,1,0,0],
            [0,0,1,1],
            [0,0,1,1]
        ];
        this.placePattern(beacon, 30, 10);
        
        // Toad pattern
        const toad = [
            [0,1,1,1],
            [1,1,1,0]
        ];
        this.placePattern(toad, 50, 10);
    }
    
    generateSpaceships() {
        // Glider pattern
        const glider = [
            [0,1,0],
            [0,0,1],
            [1,1,1]
        ];
        this.placePattern(glider, 10, 10);
        this.placePattern(glider, 40, 15);
        
        // Lightweight spaceship
        const lwss = [
            [1,0,0,1,0],
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,1]
        ];
        this.placePattern(lwss, 20, 25);
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
    
    updatePaddle() {
        if (this.useMouseControl) {
            this.paddle.x = this.mouseX - this.paddle.width / 2;
        } else {
            if (this.keys['ArrowLeft']) {
                this.paddle.x -= this.paddle.speed;
            }
            if (this.keys['ArrowRight']) {
                this.paddle.x += this.paddle.speed;
            }
        }
        
        // Keep paddle within bounds
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
    }
    
    updateBall() {
        if (!this.isRunning || !this.gameStarted) return;
        
        // Move ball
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Wall collisions
        if (this.ball.x <= this.ball.radius || this.ball.x >= this.canvas.width - this.ball.radius) {
            this.ball.vx = -this.ball.vx;
        }
        if (this.ball.y <= this.ball.radius) {
            this.ball.vy = -this.ball.vy;
        }
        
        // Paddle collision
        if (this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.width) {
            
            this.ball.vy = -Math.abs(this.ball.vy);
            
            // Add angle based on where ball hits paddle
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPos - 0.5) * Math.PI / 3;
            const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
            this.ball.vx = Math.sin(angle) * speed;
            this.ball.vy = -Math.cos(angle) * speed;
            
            // Advance generation when ball hits paddle
            this.updateGeneration();
        }
        
        // Check cell collisions
        this.checkCellCollisions();
        
        // Reset ball if it goes off screen
        if (this.ball.y > this.canvas.height) {
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height - 100;
            this.ball.vx = (Math.random() - 0.5) * 6;
            this.ball.vy = -3;
        }
    }
    
    checkCellCollisions() {
        const cellX = Math.floor(this.ball.x / this.cellSize);
        const cellY = Math.floor(this.ball.y / this.cellSize);
        
        // Check surrounding cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = cellX + dx;
                const y = cellY + dy;
                
                if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                    const cell = this.grid[x][y];
                    if (cell.alive) {
                        const cellPixelX = x * this.cellSize;
                        const cellPixelY = y * this.cellSize;
                        
                        // Check if ball intersects with cell
                        if (this.ball.x + this.ball.radius >= cellPixelX &&
                            this.ball.x - this.ball.radius <= cellPixelX + this.cellSize &&
                            this.ball.y + this.ball.radius >= cellPixelY &&
                            this.ball.y - this.ball.radius <= cellPixelY + this.cellSize) {
                            
                            // Kill the cell
                            cell.alive = false;
                            cell.age = 0;
                            
                            // Add to score
                            this.score += 10 + cell.age;
                            
                            // Simple ball bounce
                            const ballCenterX = this.ball.x;
                            const ballCenterY = this.ball.y;
                            const cellCenterX = cellPixelX + this.cellSize / 2;
                            const cellCenterY = cellPixelY + this.cellSize / 2;
                            
                            if (Math.abs(ballCenterX - cellCenterX) > Math.abs(ballCenterY - cellCenterY)) {
                                this.ball.vx = -this.ball.vx;
                            } else {
                                this.ball.vy = -this.ball.vy;
                            }
                        }
                    }
                }
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
        document.getElementById('generation').textContent = this.generation;
        document.getElementById('liveCells').textContent = liveCells;
        document.getElementById('score').textContent = this.score;
        
        // Check win condition
        if (liveCells === 0 && this.gameStarted) {
            this.isRunning = false;
            this.gameStarted = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
            alert(`Congratulations! You cleared all cells! Final Score: ${this.score}`);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
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
                    
                    // Add border
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
                }
            }
        }
        
        // Draw paddle
        this.ctx.fillStyle = this.paddle.color;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Draw ball
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        this.updatePaddle();
        this.updateBall();
        this.updateStats();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new LifeBreakout('gameCanvas', 60, 40);
});