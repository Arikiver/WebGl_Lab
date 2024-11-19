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
        attribute vec4 aColor;
        varying vec4 vColor;
        void main(void) {
            gl_Position = vec4(coordinates, 0.0, 1.0);
            vColor = aColor;
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        varying vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
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

    // Create buffers for the vertices and colors
    const vertexBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    // Get attribute locations
    const coord = gl.getAttribLocation(shaderProgram, "coordinates");
    const colorAttribute = gl.getAttribLocation(shaderProgram, "aColor");

    // Enable vertex attributes
    gl.enableVertexAttribArray(coord);
    gl.enableVertexAttribArray(colorAttribute);

    // Array to store all triangles
    let triangles = [];

    // Clear the canvas initially
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

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

        // Store the new triangle data
        triangles.push({
            vertices: [x1, y1, x2, y2, x3, y3],
            color: [r, g, b, 1.0]
        });

        // Create arrays for all vertices and colors
        let allVertices = [];
        let allColors = [];

        // Populate the arrays with all triangles
        triangles.forEach(triangle => {
            allVertices.push(...triangle.vertices);
            // Each vertex needs its own color
            for (let i = 0; i < 3; i++) {
                allColors.push(...triangle.color);
            }
        });

        // Convert to Float32Array
        const verticesArray = new Float32Array(allVertices);
        const colorsArray = new Float32Array(allColors);

        // Bind and fill vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);

        // Bind and fill color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorsArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorAttribute, 4, gl.FLOAT, false, 0, 0);

        // Clear canvas and draw all triangles
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, triangles.length * 3);
    }

    // Function to clear the screen
    window.clearScreen = function() {
        // Clear the triangles array
        triangles = [];
        // Clear the canvas
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
};