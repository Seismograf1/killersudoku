/**
 * Fireworks animation for puzzle completion
 */

const Fireworks = {
    /**
     * Initialize the fireworks canvas
     * @param {HTMLElement} container - The container element for the canvas
     * @returns {HTMLCanvasElement} - The canvas element
     */
    init(container) {
        // Find the game board container
        const gameBoard = document.querySelector('.game-board');
        const gridRect = gameBoard.getBoundingClientRect();
        
        const canvas = document.createElement('canvas');
        canvas.id = 'fireworks-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '100';
        
        // Add the canvas to the game board
        gameBoard.style.position = 'relative';
        gameBoard.appendChild(canvas);
        
        // Set canvas size to match the game board
        canvas.width = gridRect.width;
        canvas.height = gridRect.height;
        
        return canvas;
    },
    
    /**
     * Start the fireworks animation
     * @param {number} duration - Duration in milliseconds
     * @param {Function} onComplete - Callback when animation completes
     */
    start(duration = 5000, onComplete = null) {
        const container = document.querySelector('.game-board');
        const canvas = this.init(container);
        const ctx = canvas.getContext('2d');
        
        const particles = [];
        const fireworks = [];
        const explosions = [];
        
        // Explosion class
        class Explosion {
            constructor(x, y, hue) {
                this.x = x;
                this.y = y;
                this.hue = hue;
                this.particles = [];
                this.rings = [];
                this.lifetime = 30;
                this.age = 0;
                
                // Create explosion particles
                const particleCount = 60 + Math.floor(Math.random() * 40);
                for (let i = 0; i < particleCount; i++) {
                    this.particles.push(new Particle(x, y, hue));
                }
                
                // Create rings
                const ringCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < ringCount; i++) {
                    this.rings.push({
                        radius: 0,
                        maxRadius: 30 + Math.random() * 50,
                        alpha: 1,
                        hue: (hue + Math.random() * 30 - 15) % 360
                    });
                }
            }
            
            update() {
                this.age++;
                
                // Update particles
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    if (!this.particles[i].update()) {
                        this.particles.splice(i, 1);
                    }
                }
                
                // Update rings
                for (let ring of this.rings) {
                    ring.radius += (ring.maxRadius - ring.radius) * 0.1;
                    ring.alpha -= 0.02;
                }
                
                return this.age < this.lifetime;
            }
            
            draw(ctx) {
                // Draw particles
                for (const particle of this.particles) {
                    particle.draw(ctx);
                }
                
                // Draw rings
                for (const ring of this.rings) {
                    if (ring.alpha > 0) {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
                        ctx.strokeStyle = `hsla(${ring.hue}, 100%, 70%, ${ring.alpha})`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }
            }
        }
        
        // Firework class
        class Firework {
            constructor(x, y, targetX, targetY) {
                this.x = x;
                this.y = y;
                this.targetX = targetX;
                this.targetY = targetY;
                this.speed = 2 + Math.random() * 1;
                this.angle = Math.atan2(targetY - y, targetX - x);
                this.velocity = {
                    x: Math.cos(this.angle) * this.speed,
                    y: Math.sin(this.angle) * this.speed
                };
                this.brightness = 50 + Math.random() * 50;
                this.hue = Math.floor(Math.random() * 360);
                this.trail = [];
                this.trailLength = 5 + Math.floor(Math.random() * 5);
                this.smokeParticles = [];
                this.lastSmokeTime = 0;
            }
            
            update() {
                // Move firework
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                
                // Add position to trail
                this.trail.push([this.x, this.y]);
                if (this.trail.length > this.trailLength) {
                    this.trail.shift();
                }
                
                // Add smoke particles occasionally
                if (Date.now() - this.lastSmokeTime > 50) {
                    this.lastSmokeTime = Date.now();
                    const smokeParticle = {
                        x: this.x + (Math.random() * 4 - 2),
                        y: this.y + (Math.random() * 4 - 2),
                        size: 1 + Math.random() * 2,
                        alpha: 0.5 + Math.random() * 0.5,
                        vx: Math.random() * 0.5 - 0.25,
                        vy: Math.random() * 0.5 - 0.25
                    };
                    this.smokeParticles.push(smokeParticle);
                }
                
                // Update smoke particles
                for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
                    const smoke = this.smokeParticles[i];
                    smoke.x += smoke.vx;
                    smoke.y += smoke.vy;
                    smoke.alpha -= 0.02;
                    if (smoke.alpha <= 0) {
                        this.smokeParticles.splice(i, 1);
                    }
                }
                
                // Check if firework has reached target
                const distanceToTarget = Math.sqrt(
                    Math.pow(this.targetX - this.x, 2) + 
                    Math.pow(this.targetY - this.y, 2)
                );
                
                if (distanceToTarget < 5) {
                    // Create explosion
                    explosions.push(new Explosion(this.x, this.y, this.hue));
                    return false; // Remove firework
                }
                
                return true; // Keep firework
            }
            
            draw() {
                // Draw smoke particles
                for (const smoke of this.smokeParticles) {
                    ctx.beginPath();
                    ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(200, 200, 200, ${smoke.alpha})`;
                    ctx.fill();
                }
                
                // Draw trail
                ctx.beginPath();
                const trailEndIndex = this.trail.length - 1;
                ctx.moveTo(this.trail[trailEndIndex][0], this.trail[trailEndIndex][1]);
                for (let i = trailEndIndex; i > 0; i--) {
                    const point = this.trail[i];
                    ctx.lineTo(point[0], point[1]);
                }
                ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${1})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw rocket head
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, 1)`;
                ctx.fill();
            }
        }
        
        // Particle class
        class Particle {
            constructor(x, y, hue) {
                this.x = x;
                this.y = y;
                this.hue = hue;
                this.brightness = 50 + Math.random() * 50;
                this.alpha = 1;
                this.decay = 0.015 + Math.random() * 0.03;
                this.speed = Math.random() * 3 + 0.5;
                this.angle = Math.random() * Math.PI * 2;
                this.velocity = {
                    x: Math.cos(this.angle) * this.speed,
                    y: Math.sin(this.angle) * this.speed
                };
                this.gravity = 0.05;
                this.resistance = 0.92;
                this.size = 2 + Math.random() * 2;
                this.trail = [];
                this.trailLength = Math.floor(Math.random() * 3);
            }
            
            update() {
                // Apply resistance
                this.velocity.x *= this.resistance;
                this.velocity.y *= this.resistance;
                
                // Apply gravity
                this.velocity.y += this.gravity;
                
                // Add to trail
                if (this.trailLength > 0) {
                    this.trail.push({x: this.x, y: this.y, alpha: this.alpha});
                    if (this.trail.length > this.trailLength) {
                        this.trail.shift();
                    }
                }
                
                // Move particle
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                
                // Fade out
                this.alpha -= this.decay;
                
                return this.alpha >= 0.05;
            }
            
            draw() {
                // Draw trail
                for (let i = 0; i < this.trail.length; i++) {
                    const point = this.trail[i];
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, this.size * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${point.alpha * 0.5})`;
                    ctx.fill();
                }
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
                ctx.fill();
                
                // Draw glow
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, this.size * 0.5,
                    this.x, this.y, this.size * 1.5
                );
                gradient.addColorStop(0, `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha * 0.5})`);
                gradient.addColorStop(1, `hsla(${this.hue}, 100%, ${this.brightness}%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
        
        // Animation loop
        let startTime = Date.now();
        let animationFrame;
        
        function loop() {
            // Clear canvas with semi-transparent black
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Randomly create new fireworks - increased frequency
            if (Math.random() < 0.1) {
                const startX = Math.random() * canvas.width;
                const startY = canvas.height;
                const targetX = Math.random() * canvas.width;
                const targetY = Math.random() * (canvas.height * 0.7);
                fireworks.push(new Firework(startX, startY, targetX, targetY));
            }
            
            // Update and draw fireworks
            for (let i = fireworks.length - 1; i >= 0; i--) {
                if (!fireworks[i].update()) {
                    fireworks.splice(i, 1);
                } else {
                    fireworks[i].draw();
                }
            }
            
            // Update and draw explosions
            for (let i = explosions.length - 1; i >= 0; i--) {
                if (!explosions[i].update()) {
                    explosions.splice(i, 1);
                } else {
                    explosions[i].draw(ctx);
                }
            }
            
            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                if (!particles[i].update()) {
                    particles.splice(i, 1);
                } else {
                    particles[i].draw();
                }
            }
            
            // Check if animation should continue
            if (Date.now() - startTime < duration) {
                animationFrame = requestAnimationFrame(loop);
            } else {
                // Clean up
                cancelAnimationFrame(animationFrame);
                container.removeChild(canvas);
                if (onComplete) onComplete();
            }
        }
        
        // Start animation
        loop();
    }
};
