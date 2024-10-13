/*
Ball Bounce game:
The ball will keep bouncing in the window, and everytime the player will click on the ball then the score will increase by one.

Algorithm:

Move Ball:
    the ball will take a random number for both x and y as its intial position and trajectory, lets say:
    xi = initial x position, yi = initial y position, xdir = initial x direction, ydir = initial y direction (xdir,ydir both are under (-1,1))

    now we will draw the circle on the position (xi,yi),
    and make it move by (xi+xdir, yi+ydir)
    and check if the ball is out of the window, if yes then reverse the direction of the ball:
        if the wall is the top or bottom wall (y = 600, 0) => ydir = -ydir;
        if the wall is the left or right wall (x = 800, 0) => xdir = -xdir;

mouse click:
    if the mouse is clicked on the ball then the score will increase by one.
    the mouse click will return its coordinates,
    if the coordinates of the mouse coincide with the coordinates of the ball += the radius of the ball,
    then increase the score by 1.
*/
// Vertex shader
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        gl_PointSize = 40.0;
    }
`;

// Fragment shader
const fsSource = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if (length(coord) > 0.5) {
            discard;
        }
        gl_FragColor = uColor;
    }
`;

// WebGL variables
let gl;
let programInfo;
let ballPosition = [0.0, 0.0];
let ballVelocity = [0.01, 0.015];
let score = 0;

function initWebGL() {
    const canvas = document.getElementById('gameCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            color: gl.getUniformLocation(shaderProgram, 'uColor'),
        },
    };

    // Set random initial direction
    const angle = Math.random() * 2 * Math.PI;
    ballVelocity = [Math.cos(angle) * 0.015, Math.sin(angle) * 0.015];

    canvas.addEventListener('click', handleClick);

    // Start the game loop
    requestAnimationFrame(render);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function drawScene() {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -1, 1, -1, 1, -1, 1);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [ballPosition[0], ballPosition[1], 0.0]);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniform4fv(programInfo.uniformLocations.color, [1.0, 0.0, 0.0, 1.0]);

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, 1);
}

function updateBallPosition() {
    ballPosition[0] += ballVelocity[0];
    ballPosition[1] += ballVelocity[1];

    if (Math.abs(ballPosition[0]) > 0.95) {
        ballVelocity[0] *= -1;
    }
    if (Math.abs(ballPosition[1]) > 0.95) {
        ballVelocity[1] *= -1;
    }
}

function handleClick(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.width * 2 - 1);
    const y = -((event.clientY - rect.top) / canvas.height * 2 - 1);

    const distance = Math.sqrt(
        Math.pow(x - ballPosition[0], 2) +
        Math.pow(y - ballPosition[1], 2)
    );

    if (distance < 0.1) {
        score++;
        document.getElementById('score').textContent = `Score: ${score}`;
    }
}

function render() {
    updateBallPosition();
    drawScene();
    requestAnimationFrame(render);
}

window.onload = initWebGL;