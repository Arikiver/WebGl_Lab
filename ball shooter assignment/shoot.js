let gl;
let canvas;
let score = 0;
let lives = 3;
let gameOver = false;

// Texture objects
let textures = {
    player: null,
    block: null,
    projectile: null
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

// Initialize WebGL
function initGL() {
    canvas = document.getElementById('gameCanvas');
    gl = canvas.getContext('webgl');
    
    if (!gl) {
        alert('WebGL not supported');
        return false;
    }

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Create shaders
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
        varying vec2 v_texCoord;

        void main() {
            gl_FragColor = texture2D(u_texture, v_texCoord);
        }
    `;

    // Create shader program
    const program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Store locations
    program.positionLocation = gl.getAttribLocation(program, 'a_position');
    program.texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    program.resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    program.translationLocation = gl.getUniformLocation(program, 'u_translation');
    program.scaleLocation = gl.getUniformLocation(program, 'u_scale');
    program.textureLocation = gl.getUniformLocation(program, 'u_texture');

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

function loadTextures(program) {
    const textureFiles = {
        player: 'player.png',
        block: 'block.png',
        projectile: 'projectile.png'
    };

    Object.entries(textureFiles).forEach(([key, file]) => {
        const texture = gl.createTexture();
        const image = new Image();
        
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            
            // Check if the image dimensions are powers of 2
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // Set parameters for non-power-of-2 textures
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            
            textures[key] = texture;
        };
        
        image.src = file;
    });
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function createShaderProgram(vertexSource, fragmentSource) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
}

function drawTexturedRectangle(program, x, y, width, height, texture) {
    if (!texture) return; // Skip if texture not loaded
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform2f(program.translationLocation, x, y);
    gl.uniform2f(program.scaleLocation, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function spawnBlock() {
    if (!gameOver) {
        blocks.push({
            x: Math.random() * (canvas.width - 40),
            y: 0,
            width: 80,
            height: 80,
            speed: 2,
            hitPoints: 1
        });
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
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function showGameOver() {
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'block';
}

function update() {
    if (gameOver) return;

    if (keys['ArrowLeft']) {
        player.x = Math.max(0, player.x - 5);
    }
    if (keys['ArrowRight']) {
        player.x = Math.min(canvas.width - player.width, player.x + 5);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y -= projectiles[i].speed;
        if (projectiles[i].y < 0) {
            projectiles.splice(i, 1);
        }
    }

    for (let i = blocks.length - 1; i >= 0; i--) {
        blocks[i].y += blocks[i].speed;

        for (let j = projectiles.length - 1; j >= 0; j--) {
            if (checkCollision(projectiles[j], blocks[i])) {
                blocks[i].hitPoints--;
                projectiles.splice(j, 1);
                if (blocks[i].hitPoints <= 0) {
                    blocks.splice(i, 1);
                    score += 10;
                    document.getElementById('score').textContent = score;
                    break;
                }
            }
        }

        if (blocks[i] && blocks[i].y + blocks[i].height > canvas.height) {
            blocks.splice(i, 1);
            lives--;
            document.getElementById('lives').textContent = lives;
            
            if (lives <= 0) {
                gameOver = true;
                showGameOver();
            }
        }
    }

    if (Date.now() - lastBlockSpawn > 2000) {
        spawnBlock();
        lastBlockSpawn = Date.now();
    }
}

function render(program) {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw player
    drawTexturedRectangle(program, player.x, player.y, player.width, player.height, textures.player);

    // Draw blocks
    blocks.forEach(block => {
        drawTexturedRectangle(program, block.x, block.y, block.width, block.height, textures.block);
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
        drawTexturedRectangle(program, projectile.x, projectile.y, projectile.width, projectile.height, textures.projectile);
    });
}

function gameLoop(program) {
    update();
    render(program);
    requestAnimationFrame(() => gameLoop(program));
}

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && !gameOver) {
        shoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

window.onload = () => {
    const program = initGL();
    if (program) {
        gameLoop(program);
    }
};