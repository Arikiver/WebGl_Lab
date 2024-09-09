function helloTriangle() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas) {
    showError('Could not find HTML canvas element');
    return;
  }
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    showError('WebGL is not supported');
    return;
  }

  const triangleVertices = [
// [x,    y]     [R,   G,   B]
    0.0,  0.5,    1.0, 0.0, 0.0,  // Top middle vertex - red
   -0.5, -0.5,    0.0, 1.0, 0.0,  // Bottom left vertex - green
    0.5, -0.5,    0.0, 0.0, 1.0   // Bottom right vertex - blue
  ];
  const triangleGeoCpuBuffer = new Float32Array(triangleVertices);

  const triangleGeoBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleGeoCpuBuffer, gl.STATIC_DRAW);

  const vertexShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec2 vertexPosition;
  in vec3 vertexColor;

  out vec3 fragColor;

  void main() {
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
    fragColor = vertexColor;
  }`;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(vertexShader);
    showError(`Failed to compile vertex shader: ${errorMessage}`);
    return;
  }

  const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec3 fragColor;

  out vec4 outputColor;

  void main() {
    outputColor = vec4(fragColor, 1.0);
  }`;

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const errorMessage = gl.getShaderInfoLog(fragmentShader);
    showError(`Failed to compile fragment shader: ${errorMessage}`);
    return;
  }

  const helloTriangleProgram = gl.createProgram();
  gl.attachShader(helloTriangleProgram, vertexShader);
  gl.attachShader(helloTriangleProgram, fragmentShader);
  gl.linkProgram(helloTriangleProgram);
  if (!gl.getProgramParameter(helloTriangleProgram, gl.LINK_STATUS)) {
    const errorMessage = gl.getProgramInfoLog(helloTriangleProgram);
    showError(`Failed to link GPU program: ${errorMessage}`);
    return;
  }

  const vertexPositionAttributeLocation = gl.getAttribLocation(helloTriangleProgram, 'vertexPosition');
  if (vertexPositionAttributeLocation < 0) {
    showError(`Failed to get attribute location for vertexPosition`);
    return;
  }

  const vertexColorAttributeLocation = gl.getAttribLocation(helloTriangleProgram, 'vertexColor');
  if (vertexColorAttributeLocation < 0) {
    showError(`Failed to get attribute location for vertexColor`);
    return;
  }

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.clearColor(0.08, 0.08, 0.08, 1.0);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(helloTriangleProgram);
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);
  gl.enableVertexAttribArray(vertexColorAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.vertexAttribPointer(vertexPositionAttributeLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.vertexAttribPointer(vertexColorAttributeLocation, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

try {
  helloTriangle();
} catch (e) {
  showError(`Uncaught JavaScript exception: ${e}`);
}
