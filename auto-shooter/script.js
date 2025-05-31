class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    
    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }
    
    distance(other) {
        return this.subtract(other).magnitude();
    }
}

class Player {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.maxSpeed = 3;
        this.radius = 15;
        this.health = 100;
        this.maxHealth = 100;
        this.fireRate = 0.3; // seconds between shots
        this.lastShotTime = 0;
        this.bulletSpeed = 8;
        this.bulletDamage = 20;
        this.bulletCount = 1;
        this.bulletPiercing = false;
        this.range = 200;
    }
    
    update(deltaTime, enemies, xpOrbs, canvasWidth, canvasHeight) {
        // Auto-movement AI
        this.updateMovement(enemies, xpOrbs, canvasWidth, canvasHeight);
        
        // Auto-firing
        this.updateFiring(deltaTime, enemies);
        
        // Update position
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        
        // Keep player in bounds
        this.position.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.position.y));
    }
    
    updateMovement(enemies, xpOrbs, canvasWidth, canvasHeight) {
        let moveDirection = new Vector2(0, 0);
        
        // Avoid enemies
        const dangerRadius = 80;
        for (const enemy of enemies) {
            const distance = this.position.distance(enemy.position);
            if (distance < dangerRadius) {
                const avoidDirection = this.position.subtract(enemy.position).normalize();
                const urgency = 1 - (distance / dangerRadius);
                moveDirection = moveDirection.add(avoidDirection.multiply(urgency * 2));
            }
        }
        
        // Collect XP orbs when safe
        if (moveDirection.magnitude() < 0.5) { // Only when not avoiding danger
            let nearestOrb = null;
            let nearestDistance = Infinity;
            
            for (const orb of xpOrbs) {
                const distance = this.position.distance(orb.position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestOrb = orb;
                }
            }
            
            if (nearestOrb && nearestDistance < 150) {
                const collectDirection = nearestOrb.position.subtract(this.position).normalize();
                moveDirection = moveDirection.add(collectDirection.multiply(0.5));
            }
        }
        
        // Random wandering when no clear direction
        if (moveDirection.magnitude() < 0.1) {
            moveDirection = new Vector2(
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize().multiply(0.3);
        }
        
        this.velocity = moveDirection.normalize().multiply(this.maxSpeed);
    }
    
    updateFiring(deltaTime, enemies) {
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastShotTime < this.fireRate) return;
        
        // Find nearest enemy in range
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        for (const enemy of enemies) {
            const distance = this.position.distance(enemy.position);
            if (distance < this.range && distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        if (nearestEnemy) {
            const direction = nearestEnemy.position.subtract(this.position).normalize();
            
            // Fire multiple bullets if upgraded
            for (let i = 0; i < this.bulletCount; i++) {
                const spread = (this.bulletCount > 1) ? (i - (this.bulletCount - 1) / 2) * 0.3 : 0;
                const angle = Math.atan2(direction.y, direction.x) + spread;
                const bulletDirection = new Vector2(Math.cos(angle), Math.sin(angle));
                
                game.bullets.push(new Bullet(
                    this.position.x,
                    this.position.y,
                    bulletDirection,
                    this.bulletSpeed,
                    this.bulletDamage,
                    this.bulletPiercing
                ));
            }
            
            this.lastShotTime = currentTime;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw player
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar
        const barWidth = 30;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.position.x - barWidth/2, this.position.y - this.radius - 10, barWidth, barHeight);
        
        ctx.fillStyle = healthPercent > 0.3 ? '#4CAF50' : '#ff4444';
        ctx.fillRect(this.position.x - barWidth/2, this.position.y - this.radius - 10, barWidth * healthPercent, barHeight);
        
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.type = type;
        
        switch(type) {
            case 'basic':
                this.maxSpeed = 1.5;
                this.radius = 12;
                this.health = 40;
                this.maxHealth = 40;
                this.damage = 20;
                this.xpValue = 1;
                this.color = '#ff6b6b';
                break;
            case 'fast':
                this.maxSpeed = 3;
                this.radius = 8;
                this.health = 20;
                this.maxHealth = 20;
                this.damage = 15;
                this.xpValue = 2;
                this.color = '#ffeb3b';
                break;
            case 'tank':
                this.maxSpeed = 0.8;
                this.radius = 20;
                this.health = 100;
                this.maxHealth = 100;
                this.damage = 35;
                this.xpValue = 5;
                this.color = '#9c27b0';
                break;
            case 'boss':
                this.maxSpeed = 1;
                this.radius = 40;
                this.health = 500;
                this.maxHealth = 500;
                this.damage = 50;
                this.xpValue = 20;
                this.color = '#e91e63';
                break;
        }
    }
    
    update(deltaTime, player) {
        // Move towards player
        const direction = player.position.subtract(this.position).normalize();
        this.velocity = direction.multiply(this.maxSpeed);
        this.position = this.position.add(this.velocity.multiply(deltaTime));
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar for larger enemies
        if (this.type === 'tank' || this.type === 'boss') {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.position.x - barWidth/2, this.position.y - this.radius - 10, barWidth, barHeight);
            
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.position.x - barWidth/2, this.position.y - this.radius - 10, barWidth * healthPercent, barHeight);
        }
        
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, direction, speed, damage, piercing = false) {
        this.position = new Vector2(x, y);
        this.velocity = direction.multiply(speed);
        this.damage = damage;
        this.piercing = piercing;
        this.radius = 3;
        this.life = 2; // seconds
        this.age = 0;
    }
    
    update(deltaTime) {
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.age += deltaTime;
        return this.age < this.life;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class XPOrb {
    constructor(x, y, value = 1) {
        this.position = new Vector2(x, y);
        this.value = value;
        this.radius = 5 + value;
        this.age = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime) {
        this.age += deltaTime;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Bobbing animation
        const bob = Math.sin(this.age * 3 + this.bobOffset) * 2;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y + bob, 0,
            this.position.x, this.position.y + bob, this.radius * 2
        );
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.7, '#00aa55');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y + bob, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y + bob, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.enemies = [];
        this.bullets = [];
        this.xpOrbs = [];
        this.particles = [];
        
        this.wave = 1;
        this.waveEnemiesRemaining = 0;
        this.waveStartTime = 0;
        this.betweenWaves = false;
        
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 10;
        this.upgradePoints = 0;
        
        this.lastTime = 0;
        this.running = true;
        
        this.upgrades = {
            bulletSpeed: 0,
            bulletDamage: 0,
            fireRate: 0,
            bulletCount: 0,
            playerSpeed: 0,
            health: 0,
            range: 0,
            piercing: false
        };
        
        this.startWave();
        this.gameLoop();
    }
    
    startWave() {
        this.betweenWaves = false;
        this.waveStartTime = Date.now();
        
        // Spawn enemies based on wave
        const enemyCount = Math.min(5 + this.wave * 3, 50);
        this.waveEnemiesRemaining = enemyCount;
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                if (this.running) {
                    this.spawnRandomEnemy();
                }
            }, i * 500 + Math.random() * 1000);
        }
        
        // Spawn boss every 5 waves
        if (this.wave % 5 === 0) {
            setTimeout(() => {
                if (this.running) {
                    this.spawnEnemy('boss');
                    this.waveEnemiesRemaining++;
                }
            }, 2000);
        }
    }
    
    spawnRandomEnemy() {
        const types = ['basic', 'basic', 'fast', 'tank']; // basic is more common
        const type = types[Math.floor(Math.random() * types.length)];
        this.spawnEnemy(type);
    }
    
    spawnEnemy(type) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        this.enemies.push(new Enemy(x, y, type));
    }
    
    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.running) {
            this.update(deltaTime);
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.enemies, this.xpOrbs, this.canvas.width, this.canvas.height);
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player);
            
            // Check collision with player
            if (this.player.position.distance(enemy.position) < this.player.radius + enemy.radius) {
                this.player.takeDamage(enemy.damage);
                this.enemies.splice(i, 1);
                this.waveEnemiesRemaining--;
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (!bullet.update(deltaTime)) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check bullet collision with enemies
            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (bullet.position.distance(enemy.position) < bullet.radius + enemy.radius) {
                    if (enemy.takeDamage(bullet.damage)) {
                        // Enemy died
                        this.xpOrbs.push(new XPOrb(enemy.position.x, enemy.position.y, enemy.xpValue));
                        this.enemies.splice(j, 1);
                        this.waveEnemiesRemaining--;
                    }
                    
                    if (!bullet.piercing) {
                        hit = true;
                    }
                    break;
                }
            }
            
            if (hit) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update XP orbs
        for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.xpOrbs[i];
            orb.update(deltaTime);
            
            // Check collection
            if (this.player.position.distance(orb.position) < this.player.radius + orb.radius) {
                this.addXP(orb.value);
                this.xpOrbs.splice(i, 1);
            }
        }
        
        // Check wave completion
        if (this.waveEnemiesRemaining <= 0 && this.enemies.length === 0 && !this.betweenWaves) {
            this.completeWave();
        }
        
        this.updateUI();
    }
    
    addXP(amount) {
        this.xp += amount;
        
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.upgradePoints++;
            this.xpToNext = Math.floor(10 * Math.pow(1.2, this.level - 1));
            
            if (this.upgradePoints === 1) {
                this.showUpgradePanel();
            }
        }
    }
    
    completeWave() {
        this.betweenWaves = true;
        this.wave++;
        this.upgradePoints += Math.floor(this.wave / 3) + 1; // More upgrade points for higher waves
        
        // Heal player slightly
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        
        setTimeout(() => {
            if (this.upgradePoints > 0) {
                this.showUpgradePanel();
            } else {
                this.startWave();
            }
        }, 2000);
    }
    
    showUpgradePanel() {
        const panel = document.getElementById('upgradePanel');
        const optionsContainer = document.getElementById('upgradeOptions');
        
        // Generate upgrade options
        const options = this.generateUpgradeOptions();
        
        optionsContainer.innerHTML = '';
        options.forEach(option => {
            const div = document.createElement('div');
            div.className = 'upgrade-option';
            div.innerHTML = `
                <h3>${option.name}</h3>
                <p>${option.description}</p>
                <p class="upgrade-cost">Cost: ${option.cost} points</p>
            `;
            div.onclick = () => this.selectUpgrade(option);
            optionsContainer.appendChild(div);
        });
        
        panel.style.display = 'block';
    }
    
    generateUpgradeOptions() {
        const options = [
            {
                name: 'Bullet Damage',
                description: 'Increase bullet damage by 15',
                cost: 1,
                apply: () => {
                    this.player.bulletDamage += 15;
                    this.upgrades.bulletDamage++;
                }
            },
            {
                name: 'Fire Rate',
                description: 'Increase firing speed by 20%',
                cost: 1,
                apply: () => {
                    this.player.fireRate *= 0.8;
                    this.upgrades.fireRate++;
                }
            },
            {
                name: 'Bullet Speed',
                description: 'Increase bullet speed by 25%',
                cost: 1,
                apply: () => {
                    this.player.bulletSpeed *= 1.25;
                    this.upgrades.bulletSpeed++;
                }
            },
            {
                name: 'Multi-Shot',
                description: 'Fire one additional bullet',
                cost: 2,
                apply: () => {
                    this.player.bulletCount++;
                    this.upgrades.bulletCount++;
                }
            },
            {
                name: 'Player Speed',
                description: 'Increase movement speed by 30%',
                cost: 1,
                apply: () => {
                    this.player.maxSpeed *= 1.3;
                    this.upgrades.playerSpeed++;
                }
            },
            {
                name: 'Range',
                description: 'Increase firing range by 50',
                cost: 1,
                apply: () => {
                    this.player.range += 50;
                    this.upgrades.range++;
                }
            },
            {
                name: 'Health Boost',
                description: 'Increase max health by 25 and heal to full',
                cost: 2,
                apply: () => {
                    this.player.maxHealth += 25;
                    this.player.health = this.player.maxHealth;
                    this.upgrades.health++;
                }
            }
        ];
        
        // Add piercing upgrade if not already taken
        if (!this.upgrades.piercing) {
            options.push({
                name: 'Piercing Bullets',
                description: 'Bullets pierce through enemies',
                cost: 3,
                apply: () => {
                    this.player.bulletPiercing = true;
                    this.upgrades.piercing = true;
                }
            });
        }
        
        // Shuffle and return 3 random options that we can afford
        const affordableOptions = options.filter(opt => opt.cost <= this.upgradePoints);
        const shuffled = affordableOptions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }
    
    selectUpgrade(option) {
        if (this.upgradePoints >= option.cost) {
            this.upgradePoints -= option.cost;
            option.apply();
            
            document.getElementById('upgradePanel').style.display = 'none';
            
            if (this.upgradePoints > 0) {
                setTimeout(() => this.showUpgradePanel(), 500);
            } else if (this.betweenWaves) {
                setTimeout(() => this.startWave(), 1000);
            }
        }
    }
    
    updateUI() {
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('level').textContent = this.level;
        document.getElementById('xp').textContent = this.xp;
        document.getElementById('xpNext').textContent = this.xpToNext;
        document.getElementById('health').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('upgradePoints').textContent = this.upgradePoints;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw XP orbs
        this.xpOrbs.forEach(orb => orb.draw(this.ctx));
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw wave info if between waves
        if (this.betweenWaves) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 107, 107, 0.8)';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Wave ${this.wave} Starting...`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.restore();
        }
    }
    
    gameOver() {
        this.running = false;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Wave Reached: ${this.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`Level: ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.fillText('Refresh to play again', this.canvas.width / 2, this.canvas.height / 2 + 100);
        
        this.ctx.restore();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});