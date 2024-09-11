var InitDemo = function () {
    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('WebGL not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }

    // Clear the color and depth buffer
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    // Vertex shader source
    var vertexShaderText = `
    precision mediump float;

    attribute vec3 vertPosition;
    attribute vec3 vertColor;
    varying vec3 fragColor;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

    void main() {
        fragColor = vertColor;
        gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
    }
    `;

    // Fragment shader source
    var fragmentShaderText = `
    precision mediump float;

    varying vec3 fragColor;

    void main() {
        gl_FragColor = vec4(fragColor, 1.0);
    }
    `;

    // Compile shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    // Link program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Cube vertices and colors
    var boxVertices = [
        // X, Y, Z            R, G, B
        -1.0, 1.0, -1.0,     1.0, 0.0, 0.0,   // Front top left
        1.0, 1.0, -1.0,      0.0, 1.0, 0.0,   // Front top right
        1.0, -1.0, -1.0,     0.0, 0.0, 1.0,   // Front bottom right
        -1.0, -1.0, -1.0,    1.0, 1.0, 0.0,   // Front bottom left

        -1.0, 1.0, 1.0,      1.0, 0.0, 1.0,   // Back top left
        1.0, 1.0, 1.0,       0.0, 1.0, 1.0,   // Back top right
        1.0, -1.0, 1.0,      1.0, 0.0, 0.5,   // Back bottom right
        -1.0, -1.0, 1.0,     0.5, 0.5, 0.5    // Back bottom left
    ];

    var boxIndices = [
        // Front face
        0, 1, 2,
        0, 2, 3,

        // Top face
        0, 1, 5,
        0, 5, 4,

        // Back face
        4, 5, 6,
        4, 6, 7,

        // Bottom face
        3, 2, 6,
        3, 6, 7,

        // Right face
        1, 2, 6,
        1, 6, 5,

        // Left face
        0, 3, 7,
        0, 7, 4
    ];

    var boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    var boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        3, // Number of elements per attribute (vec3)
        gl.FLOAT, // Type of elements
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, // Size of individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.vertexAttribPointer(
        colorAttribLocation, // Attribute location
        3, // Number of elements per attribute (vec3)
        gl.FLOAT, // Type of elements
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, // Size of individual vertex
        3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);

    // Matrices
    var mat4 = glMatrix.mat4;
    var worldMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projMatrix = mat4.create();

    mat4.lookAt(viewMatrix, [0, 0, -5], [0, 0, 0], [0, 1, 0]); // Adjusted camera position
    mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    var worldMatrixLocation = gl.getUniformLocation(program, 'mWorld');
    var viewMatrixLocation = gl.getUniformLocation(program, 'mView');
    var projMatrixLocation = gl.getUniformLocation(program, 'mProj');

    gl.uniformMatrix4fv(worldMatrixLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projMatrixLocation, gl.FALSE, projMatrix);

    // Render loop
    var identityMatrix = mat4.create();
    var angle = 0;
    var loop = function () {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        mat4.rotate(worldMatrix, identityMatrix, angle, [0, 1, 0]);
        gl.uniformMatrix4fv(worldMatrixLocation, gl.FALSE, worldMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
};

InitDemo();
