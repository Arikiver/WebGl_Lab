// Shader sources
const vsSource = `
    attribute vec4 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main() {
        gl_Position = aPosition;
        vTexCoord = aTexCoord;
    }
`;

const fsSource = `
    precision mediump float;
    uniform sampler2D uTexture;
    uniform vec4 uColor;
    uniform bool uUseTexture;
    varying vec2 vTexCoord;
    void main() {
        if (uUseTexture) {
            gl_FragColor = texture2D(uTexture, vTexCoord);
        } else {
            gl_FragColor = uColor;
        }
    }
`;

// List of images in the img folder
const imageList = [
    'img/img1.png',
    'img/img2.png',
    'img/img3.png',
];

// Global variables for render function access
let gl;
let programInfo;
let buffers;
let texture;
let randomColor;

function getRandomColor() {
    return [
        Math.random(),
        Math.random(),
        Math.random(),
        1.0
    ];
}

function getRandomImage() {
    return imageList[Math.floor(Math.random() * imageList.length)];
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl) {
    // Top half vertices (for texture)
    const topVertices = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0,  0.0,
         1.0,  0.0,
    ];

    // Bottom half vertices (for color)
    const bottomVertices = [
        -1.0,  0.0,
         1.0,  0.0,
        -1.0, -1.0,
         1.0, -1.0,
    ];

    const texCoords = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
    ];

    const topPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, topPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(topVertices), gl.STATIC_DRAW);

    const bottomPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bottomPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bottomVertices), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    return {
        top: topPositionBuffer,
        bottom: bottomPositionBuffer,
        texCoord: texCoordBuffer,
    };
}

function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    // Draw textured top half
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.top);
        gl.vertexAttribPointer(programInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.position);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);

        gl.uniform1i(programInfo.uniformLocations.useTexture, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.texture, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Draw colored bottom half
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.bottom);
        gl.vertexAttribPointer(programInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.position);

        gl.uniform1i(programInfo.uniformLocations.useTexture, 0);
        gl.uniform4fv(programInfo.uniformLocations.color, randomColor);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Put a single pixel in the texture so we can use it immediately
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Force a re-render after the image loads
        render();
        console.log('Image loaded successfully:', url);
    };
    
    image.onerror = function() {
        console.error('Error loading image:', url);
    };
    
    console.log('Attempting to load image:', url);
    image.src = url;

    return texture;
}

function main() {
    const canvas = document.querySelector('#glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            position: gl.getAttribLocation(shaderProgram, 'aPosition'),
            texCoord: gl.getAttribLocation(shaderProgram, 'aTexCoord'),
        },
        uniformLocations: {
            texture: gl.getUniformLocation(shaderProgram, 'uTexture'),
            color: gl.getUniformLocation(shaderProgram, 'uColor'),
            useTexture: gl.getUniformLocation(shaderProgram, 'uUseTexture'),
        },
    };

    buffers = initBuffers(gl);
    randomColor = getRandomColor();
    texture = loadTexture(gl, getRandomImage());

    // Initial render
    render();
}

window.onload = main;