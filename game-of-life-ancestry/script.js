class GameOfLife {
    constructor(canvasId, gridWidth, gridHeight) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = Math.min(
            this.canvas.width / gridWidth,
            this.canvas.height / gridHeight
        );
        
        // Initialize grid with cell objects
        this.grid = [];
        this.nextGrid = [];
        this.initializeGrid();
        
        this.isRunning = false;
        this.generation = 0;
        this.animationId = null;
        
        this.setupEventListeners();
        this.draw();
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
            hue: Math.random() * 360, // Random initial hue
            generation: 0
        };
    }
    
    setupEventListeners() {
        // Canvas click handler
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                this.toggleCell(x, y);
                this.draw();
            }
        });
        
        // Button handlers
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('randomBtn').addEventListener('click', () => this.randomize());
    }
    
    toggleCell(x, y) {
        const cell = this.grid[x][y];
        if (cell.alive) {
            // Kill the cell
            cell.alive = false;
            cell.age = 0;
        } else {
            // Bring the cell to life
            cell.alive = true;
            cell.age = 1;
            cell.generation = this.generation;
            // Assign a random hue when manually toggled
            cell.hue = Math.random() * 360;
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            this.animate();
        }
    }
    
    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }
    
    step() {
        this.updateGeneration();
        this.draw();
    }
    
    clear() {
        this.stop();
        this.initializeGrid();
        this.generation = 0;
        this.draw();
    }
    
    randomize() {
        this.stop();
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const cell = this.grid[x][y];
                if (Math.random() < 0.3) { // 30% chance of being alive
                    cell.alive = true;
                    cell.age = Math.floor(Math.random() * 10) + 1; // Random age 1-10
                    cell.hue = Math.random() * 360; // Random hue
                    cell.generation = this.generation;
                } else {
                    cell.alive = false;
                    cell.age = 0;
                }
            }
        }
        this.draw();
    }
    
    animate() {
        if (this.isRunning) {
            this.updateGeneration();
            this.draw();
            this.animationId = setTimeout(() => {
                this.animate();
            }, 200); // Update every 200ms
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
                
                // Apply Conway's Game of Life rules (B3/S23)
                if (currentCell.alive) {
                    if (liveNeighbors.length === 2 || liveNeighbors.length === 3) {
                        // Cell survives
                        nextCell.alive = true;
                        nextCell.age = currentCell.age + 1;
                        nextCell.hue = currentCell.hue;
                        nextCell.generation = currentCell.generation;
                    } else {
                        // Cell dies
                        nextCell.alive = false;
                        nextCell.age = 0;
                    }
                } else {
                    if (liveNeighbors.length === 3) {
                        // Cell is born
                        nextCell.alive = true;
                        nextCell.age = 1;
                        nextCell.generation = this.generation;
                        // Inherit hue from a random living neighbor
                        if (liveNeighbors.length > 0) {
                            const parentIndex = Math.floor(Math.random() * liveNeighbors.length);
                            nextCell.hue = liveNeighbors[parentIndex].hue;
                        } else {
                            nextCell.hue = Math.random() * 360;
                        }
                    } else {
                        // Cell remains dead
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
                if (dx === 0 && dy === 0) continue; // Skip the cell itself
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Handle boundaries (treat out-of-bounds as dead)
                if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                    neighbors.push(this.grid[nx][ny]);
                }
            }
        }
        return neighbors;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw cells
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const cell = this.grid[x][y];
                if (cell.alive) {
                    this.drawCell(x, y, cell);
                }
            }
        }
        
        // Draw grid lines (optional, light gray)
        this.drawGrid();
    }
    
    drawCell(x, y, cell) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        // Calculate lightness based on age (darker = older, minimum 20%)
        const maxAge = 50; // Arbitrary max age for lightness calculation
        const ageRatio = Math.min(cell.age / maxAge, 1);
        const lightness = Math.max(80 - (ageRatio * 60), 20); // 80% to 20%
        
        // Use HSL color: hue from ancestry, lightness from age
        const hsl = `hsl(${cell.hue}, 70%, ${lightness}%)`;
        
        this.ctx.fillStyle = hsl;
        this.ctx.fillRect(pixelX, pixelY, this.cellSize, this.cellSize);
        
        // Optional: Add a subtle border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(pixelX, pixelY, this.cellSize, this.cellSize);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            const pixelX = x * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            const pixelY = y * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(this.canvas.width, pixelY);
            this.ctx.stroke();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameOfLife('gameCanvas', 60, 40); // 60x40 grid
});