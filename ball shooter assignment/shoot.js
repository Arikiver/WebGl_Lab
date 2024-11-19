const LEVEL_CONFIG = {
    1: { 
        score: 0, 
        size: 80, 
        speed: 1, // Reduced from 2
        health: 1, 
        spawnRate: 3500,  // Increased from 2000
        minSpawn: 1,
        maxSpawn: 1,      // Reduced max spawn
        patterns: ['single']
    },
    2: { 
        score: 50, 
        size: 90, 
        speed: 1.2, // Reduced from 2.3
        health: 2, 
        spawnRate: 4000, // Increased from 2200
        minSpawn: 1,
        maxSpawn: 1,
        patterns: ['single', 'double']
    },
    3: { 
        score: 150, 
        size: 100, 
        speed: 1.4, // Reduced from 2.5
        health: 2, 
        spawnRate: 4500, // Increased from 2400
        minSpawn: 1,
        maxSpawn: 2,
        patterns: ['double', 'line']
    },
    4: { 
        score: 300, 
        size: 110, 
        speed: 1.6, // Reduced from 2.8
        health: 3, 
        spawnRate: 5000, // Increased from 2600
        minSpawn: 1,
        maxSpawn: 2,
        patterns: ['line', 'triangle']
    },
    5: { 
        score: 500, 
        size: 120, 
        speed: 1.8, // Reduced from 3
        health: 3, 
        spawnRate: 5500, // Increased from 2800
        minSpawn: 1,
        maxSpawn: 2,
        patterns: ['triangle', 'wave']
    }
};

let gl;
let canvas;
let score = 0;
let lives = 3;
let gameOver = false;

// Texture objects
let textures = {
    player: null,
    block: null,
    projectile: null,
    background: null
};

// Game objects
const player = {
    x: 375,
    y: 530,
    width: 100,
    height: 60
};

let blocks = [];
let projectiles = [];
let lastBlockSpawn = 0;
let keys = {};

let currentLevel = 1;
let lastLevelUpdate = 0;
let lastWaveTime = 0;
const WAVE_DELAY = 4000; // 2 seconds in milliseconds


// Initialize WebGL
function initGL() {
    canvas = document.getElementById('gameCanvas');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        alert('WebGL not supported. Please use a WebGL-compatible browser.');
        return false;
    }

    // Set viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    
    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Create and compile shaders
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        uniform vec2 u_resolution;
        uniform vec2 u_translation;
        uniform vec2 u_scale;
        varying vec2 v_texCoord;

        void main() {
            vec2 position = (a_position * u_scale + u_translation) / u_resolution * 2.0 - 1.0;
            position.y *= -1.0;
            gl_Position = vec4(position, 0, 1);
            v_texCoord = a_texCoord;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec4 u_color;
        uniform bool u_useTexture;
        varying vec2 v_texCoord;

        void main() {
            if (u_useTexture) {
                gl_FragColor = texture2D(u_texture, v_texCoord);
            } else {
                gl_FragColor = u_color;
            }
        }
    `;

    // Create shader program
    const program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    if (!program) {
        console.error('Failed to create shader program');
        return false;
    }
    
    gl.useProgram(program);

    // Store locations
    program.positionLocation = gl.getAttribLocation(program, 'a_position');
    program.texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    program.resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    program.translationLocation = gl.getUniformLocation(program, 'u_translation');
    program.scaleLocation = gl.getUniformLocation(program, 'u_scale');
    program.textureLocation = gl.getUniformLocation(program, 'u_texture');
    program.colorLocation = gl.getUniformLocation(program, 'u_color');
    program.useTextureLocation = gl.getUniformLocation(program, 'u_useTexture');

    // Create buffers
    const vertexBuffer = gl.createBuffer();
    const texCoordBuffer = gl.createBuffer();
    
    // Rectangle vertices
    const vertices = new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ]);
    
    // Texture coordinates
    const texCoords = new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ]);

    // Set up vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.positionLocation);
    gl.vertexAttribPointer(program.positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set up texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.texCoordLocation);
    gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Set resolution
    gl.uniform2f(program.resolutionLocation, canvas.width, canvas.height);

    // Load textures
    loadTextures(program);

    return program;
}

// Function to create a single enemy block
function createBlock(x, y, config) {
    return {
        x: x,
        y: y,
        width: config.size,
        height: config.size,
        speed: config.speed * (0.9 + Math.random() * 0.2), // Random speed variation
        hitPoints: config.health,
        maxHitPoints: config.health
    };
}

function loadTextures(program) {
    function loadImageTexture(url) {
        return new Promise((resolve, reject) => {
            const texture = gl.createTexture();
            const image = new Image();
            
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                         new Uint8Array([0, 0, 0, 255]));

            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);  // Changed to REPEAT for background
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);  // Changed to REPEAT for background
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }
                resolve(texture);
            };

            image.onerror = () => {
                reject(new Error(`Failed to load texture: ${url}`));
            };

            image.src = url;
        });
    }

    // Load all textures concurrently
    return Promise.all([
        loadImageTexture('player.png'),
        loadImageTexture('block.png'),
        loadImageTexture('projectile.png'),
        loadImageTexture('space.jpg')  // Add space background
    ]).then(([playerTex, blockTex, projectileTex, backgroundTex]) => {
        textures.player = playerTex;
        textures.block = blockTex;
        textures.projectile = projectileTex;
        textures.background = backgroundTex;
        return true;
    }).catch(error => {
        console.error('Error loading textures:', error);
        // Fallback textures...
        return false;
    });
}

function createColorTexture(r, g, b, a) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([r, g, b, a]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function createShaderProgram(vertexSource, fragmentSource) {
    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Compile vertex shader
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
        return null;
    }

    // Compile fragment shader
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    // Create and link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

// Spawn pattern functions
const spawnPatterns = {
    single: (config) => {
        const x = Math.random() * (canvas.width - config.size);
        return [createBlock(x, 0, config)];
    },

    double: (config) => {
        const spacing = config.size * 1.5;
        const totalWidth = spacing + config.size;
        const startX = Math.random() * (canvas.width - totalWidth);
        return [
            createBlock(startX, 0, config),
            createBlock(startX + spacing, 0, config)
        ];
    },

    line: (config) => {
        // Reduced to maximum 3 blocks
        const count = 3;
        const blocks = [];
        const spacing = config.size * 1.2;
        const totalWidth = (count - 1) * spacing + config.size;
        const startX = Math.random() * (canvas.width - totalWidth);
        
        for (let i = 0; i < count; i++) {
            blocks.push(createBlock(startX + i * spacing, 0, config));
        }
        return blocks;
    },

    triangle: (config) => {
        const blocks = [];
        const spacing = config.size * 1.2;
        const startX = Math.random() * (canvas.width - spacing * 2 - config.size);
        
        // Three blocks in triangle formation
        blocks.push(createBlock(startX + spacing, 0, config));
        blocks.push(createBlock(startX, config.size * 0.5, config));
        blocks.push(createBlock(startX + spacing * 2, config.size * 0.5, config));
        return blocks;
    },

    wave: (config) => {
        // Reduced to 3 blocks maximum
        const count = 3;
        const blocks = [];
        const spacing = config.size * 1.2;
        const totalWidth = (count - 1) * spacing + config.size;
        const startX = Math.random() * (canvas.width - totalWidth);
        
        for (let i = 0; i < count; i++) {
            const y = Math.sin(i * 0.8) * config.size * 0.5; // Adjusted wave pattern
            blocks.push(createBlock(startX + i * spacing, y, config));
        }
        return blocks;
    },

    circle: (config) => {
        const blocks = [];
        // Reduced to 3 blocks in circular pattern
        const count = 3;
        const radius = config.size * 1.5;
        const centerX = Math.random() * (canvas.width - radius * 2) + radius;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            blocks.push(createBlock(x, y, config));
        }
        return blocks;
    }
};

// Function to handle both textures and colors
function drawTexturedRectangle(program, x, y, width, height, texture, color = null) {
    gl.uniform2f(program.translationLocation, x, y);
    gl.uniform2f(program.scaleLocation, width, height);
    
    if (texture && !color) {
        // Draw with texture
        gl.uniform1i(program.useTextureLocation, 1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.textureLocation, 0);
    } else if (color) {
        // Draw with color
        gl.uniform1i(program.useTextureLocation, 0);
        gl.uniform4fv(program.colorLocation, color);
    }
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Audio Manager class to handle all game sounds
class AudioManager {
    constructor() {
        // Create dummy audio elements that won't throw errors if files aren't found
        this.sounds = {
            background: new Audio(),
            shoot: new Audio(),
            hit: new Audio(),
            gameOver: new Audio()
        };

        // Set default sources - these will fail gracefully if files don't exist
        this.sounds.background.src = 'music/background.mp3';
        this.sounds.shoot.src = 'sounds/shoot.mp3';
        this.sounds.hit.src = 'sounds/hit.mp3';
        this.sounds.gameOver.src = 'sounds/gameover.mp3';

        // Configure background music
        this.sounds.background.loop = true;
        this.sounds.background.volume = 0.5;

        // Add error handling that won't break the game
        Object.values(this.sounds).forEach(audio => {
            audio.addEventListener('error', () => {
                console.warn(`Audio file not found: ${audio.src}`);
            });
        });
    }

    // Modified methods with error handling
    playBackground() {
        this.sounds.background.play().catch(() => {});
    }

    stopBackground() {
        try {
            this.sounds.background.pause();
            this.sounds.background.currentTime = 0;
        } catch (e) {}
    }

    playShoot() {
        this.sounds.shoot.play().catch(() => {});
    }

    playHit() {
        this.sounds.hit.play().catch(() => {});
    }

    playGameOver() {
        this.stopBackground();
        this.sounds.gameOver.play().catch(() => {});
    }

    setMasterVolume(volume) {
        Object.values(this.sounds).forEach(audio => {
            audio.volume = volume;
        });
    }
}

// Initialize audio manager globally
const audioManager = new AudioManager();

// Add to existing game code
let gameStarted = false;

// Function to get current level based on score
function getCurrentLevel(score) {
    let level = 1;
    Object.entries(LEVEL_CONFIG).forEach(([lvl, config]) => {
        if (score >= config.score) {
            level = parseInt(lvl);
        }
    });
    return level;
}

// Modified spawnBlock function
function spawnBlock() {
    if (!gameOver) {
        const config = LEVEL_CONFIG[currentLevel];
        const pattern = config.patterns[Math.floor(Math.random() * config.patterns.length)];
        const newBlocks = spawnPatterns[pattern](config);
        
        // Safety check to ensure we never exceed 3 blocks
        const blocksToAdd = newBlocks.slice(0, 3);
        blocks.push(...blocksToAdd);
    }
}

function shoot() {
    if (!gameOver) {
        projectiles.push({
            x: player.x + player.width/2 - 2.5,
            y: player.y,
            width: 10,
            height: 20,
            speed: 7
        });
        audioManager.playShoot();
    }
}

function checkCollision(obj1, obj2) {
    const collision = obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
    
    if (collision) {
        audioManager.playHit();
    }
    return collision;
}

function showGameOver() {
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'block';
    audioManager.playGameOver();
}

function addVolumeControl() {
    // Use the existing volume control from HTML instead of creating new one
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (window.audioManager) {
                window.audioManager.setMasterVolume(parseFloat(e.target.value));
            }
        });
    }
}

function update() {
    if (gameOver) return;

    // Check for level progression
    const newLevel = getCurrentLevel(score);
    if (newLevel !== currentLevel) {
        currentLevel = newLevel;
        // Update level display in DOM
        document.getElementById('level').textContent = currentLevel;
        displayLevelUp();
    }

    // Handle spawn timing and patterns with wave delay
    const config = LEVEL_CONFIG[currentLevel];
    const currentTime = Date.now();
    
    if (currentTime - lastWaveTime >= WAVE_DELAY) {  // Check if enough time has passed since last wave
        if (currentTime - lastBlockSpawn > config.spawnRate) {
            const spawnCount = Math.floor(Math.random() * 
                (config.maxSpawn - config.minSpawn + 1)) + config.minSpawn;
            
            for (let i = 0; i < spawnCount; i++) {
                setTimeout(() => spawnBlock(), i * 200);
            }
            lastBlockSpawn = currentTime;
            lastWaveTime = currentTime;  // Update the last wave time
        }
    }

    // Player movement
    if (keys['ArrowLeft']) {
        player.x = Math.max(0, player.x - 5);
    }
    if (keys['ArrowRight']) {
        player.x = Math.min(canvas.width - player.width, player.x + 5);
    }

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y -= projectiles[i].speed;
        if (projectiles[i].y < 0) {
            projectiles.splice(i, 1);
        }
    }

    // Update blocks and check collisions
    for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].y += blocks[i].speed;

        // Check projectile collisions
        for (let j = projectiles.length - 1; j >= 0; j--) {
            if (checkCollision(projectiles[j], blocks[i])) {
                blocks[i].hitPoints--;
                projectiles.splice(j, 1);
                if (blocks[i].hitPoints <= 0) {
                    blocks.splice(i, 1);
                    score += 10;
                    // Update score display
                    document.getElementById('score').textContent = score;
                    // Check for level up immediately after score update
                    const newLevelAfterScore = getCurrentLevel(score);
                    if (newLevelAfterScore !== currentLevel) {
                        currentLevel = newLevelAfterScore;
                        // Update level display
                        document.getElementById('level').textContent = currentLevel;
                        displayLevelUp();
                    }
                    break;
                }
            }
        }

        // Check if block reached bottom
        if (blocks[i] && blocks[i].y + blocks[i].height > canvas.height) {
            blocks.splice(i, 1);
            lives--;
            updateLives(lives);
            
            if (lives <= 0) {
                gameOver = true;
                showGameOver();
                document.getElementById('final-score').textContent = score;
                return;
            }
        }
    }
}


// Add level up display
function displayLevelUp() {
    const levelUpDiv = document.createElement('div');
    levelUpDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        animation: fadeOut 2s forwards;
    `;
    levelUpDiv.innerHTML = `
        <h2>Level ${currentLevel}!</h2>
        <p>Enemies are getting stronger...</p>
    `;
    document.body.appendChild(levelUpDiv);

    setTimeout(() => {
        document.body.removeChild(levelUpDiv);
    }, 2000);
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

function render(program) {
    if (!gl || !program) return;

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    try {
        // Draw background first
        if (textures.background) {
            drawTexturedRectangle(program, 0, 0, canvas.width, canvas.height, textures.background);
        }

        // Rest of your rendering code...
    } catch (error) {
        console.error('Error in render:', error);
    }
}

function gameLoop(program) {
    if (!program) {
        console.error('WebGL program not initialized');
        return;
    }

    try {
        update();
        render(program);
        requestAnimationFrame(() => gameLoop(program));
    } catch (error) {
        console.error('Error in game loop:', error);
        gameOver = true;
        showGameOver();
    }
}

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (!gameStarted) {
        gameStarted = true;
        audioManager.playBackground();
    }
    if (e.key === ' ' && !gameOver) {
        shoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

window.onload = async () => {
    try {
        const program = initGL();
        if (program) {
            // Initialize audio manager
            window.audioManager = new AudioManager();
            
            // Set up volume control
            addVolumeControl();
            
            // Wait for textures to load
            await loadTextures(program);
            
            // Start game loop
            gameLoop(program);
        }
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Failed to initialize game. Please check if your browser supports WebGL.');
    }
};