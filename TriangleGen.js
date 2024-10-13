window.onload = function() {
    // Get the WebGL context
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }

    // Create and compile shaders
    const vertexShaderSource = `
        attribute vec2 coordinates;
        void main(void) {
            gl_Position = vec4(coordinates, 0.0, 1.0);
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 color;
        void main(void) {
            gl_FragColor = color;
        }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create a shader program and link it
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    // Create a buffer for the vertices
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Bind the vertex buffer to the shader
    const coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    // Set the color uniform
    const colorLocation = gl.getUniformLocation(shaderProgram, "color");

    window.drawTriangle = function() {
        // Get the input values
        const x1 = parseFloat(document.getElementById('x1').value) / 100;
        const y1 = parseFloat(document.getElementById('y1').value) / 100;
        const x2 = parseFloat(document.getElementById('x2').value) / 100;
        const y2 = parseFloat(document.getElementById('y2').value) / 100;
        const x3 = parseFloat(document.getElementById('x3').value) / 100;
        const y3 = parseFloat(document.getElementById('y3').value) / 100;
        const r = parseFloat(document.getElementById('r').value) / 255;
        const g = parseFloat(document.getElementById('g').value) / 255;
        const b = parseFloat(document.getElementById('b').value) / 255;

        // Define the vertices for the triangle
        const vertices = new Float32Array([
            x1, y1,
            x2, y2,
            x3, y3
        ]);

        // Set the vertex data in the buffer
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set the color
        gl.uniform4fv(colorLocation, [r, g, b, 1.0]);

        // Draw the triangle
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Function to clear the screen
    window.clearScreen = function() {
        // Clear the canvas
        gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear with black
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
};
