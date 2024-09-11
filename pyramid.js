var vertexShaderText = 
[
    'precision mediump float;',
    '',
    'attribute vec3 vertPosition;',
    'uniform mat4 mWorld;',
    'uniform mat4 mView;',
    'uniform mat4 mProj;',
    '',
    'void main()',
    '{',
    '  gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
    '}'
].join('\n');

var fragmentShaderText =
[
    'precision mediump float;',
    '',
    'uniform vec3 faceColor;',
    'void main()',
    '{',
    '  gl_FragColor = vec4(faceColor, 1.0);',
    '}'
].join('\n');

var InitDemo = function () {
    console.log('This is working');

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

    // Clear the canvas
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    //
    // Create shaders
    //
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

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }

    //
    // Create buffer
    //
    var boxVertices =
    [ // X, Y, Z
        // Pyramid Vertices
        0.0,  1.0,  0.0,   // Top vertex
       -1.0, -1.0,  1.0,   // Front-left
        1.0, -1.0,  1.0,   // Front-right
        1.0, -1.0, -1.0,   // Back-right
       -1.0, -1.0, -1.0,   // Back-left
    ];

    var boxIndices =
    [
        // Front face
        0, 1, 2,
        // Right face
        0, 2, 3,
        // Back face
        0, 3, 4,
        // Left face
        0, 4, 1,
        // Bottom face
        1, 4, 3,
        1, 3, 2,
    ];

    var boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    var boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        3, // Number of elements per attribute (X, Y, Z)
        gl.FLOAT, // Type of elements
        gl.FALSE,
        3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttribLocation);

    // Tell OpenGL state machine which program should be active.
    gl.useProgram(program);

    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    var faceColorUniformLocation = gl.getUniformLocation(program, 'faceColor');

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -5], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);

    //
    // Main render loop
    //
    var identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);
    var angle = 0;

    var faceColors = [
        [1.0, 0.0, 0.0],  // Front face (red)
        [0.0, 1.0, 0.0],  // Right face (green)
        [0.0, 0.0, 1.0],  // Back face (blue)
        [1.0, 1.0, 0.0],  // Left face (yellow)
        [1.0, 0.0, 1.0],  // Bottom face (magenta)
    ];

    var loop = function () {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
        mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        // Draw each face with its corresponding color
        for (let i = 0; i < faceColors.length; i++) {
            gl.uniform3fv(faceColorUniformLocation, faceColors[i]);
            gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, i * 3 * Uint16Array.BYTES_PER_ELEMENT);
        }

        // Draw bottom face
        gl.uniform3fv(faceColorUniformLocation, faceColors[4]);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12 * Uint16Array.BYTES_PER_ELEMENT);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
};
