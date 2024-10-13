#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <cmath>

// Function prototypes
void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow* window);

// Settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

// Vertex Shader source code
const char* vertexShaderSource = R"(
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out vec3 FragPos;
out vec3 Normal;

uniform mat4 transform;

void main() {
 FragPos = vec3(transform * vec4(aPos, 1.0));
 Normal = mat3(transpose(inverse(transform))) * aNormal;
 gl_Position = transform * vec4(aPos, 1.0);
}
)";

// Fragment Shader source code
const char* fragmentShaderSource = R"(
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;

uniform vec3 lightPos;
uniform vec3 viewPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

void main() {
 // Ambient
 float ambientStrength = 0.1;
 vec3 ambient = ambientStrength * lightColor;

 // Diffuse
 vec3 norm = normalize(Normal);
 vec3 lightDir = normalize(lightPos - FragPos);
 float diff = max(dot(norm, lightDir), 0.0);
 vec3 diffuse = diff * lightColor;

 // Specular
 float specularStrength = 0.5;
 vec3 viewDir = normalize(viewPos - FragPos);
 vec3 reflectDir = reflect(-lightDir, norm);
 float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
 vec3 specular = specularStrength * spec * lightColor;

 vec3 result = (ambient + diffuse + specular) * objectColor;
 FragColor = vec4(result, 1.0);
}
)";

// Function to create a transformation matrix for orthogonal rotation
void createTransformationMatrix(float* transform, float angleX, float angleY, float angleZ) {
   // Rotation matrices for X, Y, and Z axes
   float cosX = cos(angleX), sinX = sin(angleX);
   float cosY = cos(angleY), sinY = sin(angleY);
   float cosZ = cos(angleZ), sinZ = sin(angleZ);

   // Combine the rotation matrices for all three axes
   float rotX[16] = {
       1,    0,     0,    0,
       0, cosX, -sinX, 0,
       0, sinX, cosX,  0,
       0,    0,     0,    1
   };

   float rotY[16] = {
       cosY,  0, sinY, 0,
          0,  1,    0, 0,
      -sinY,  0, cosY, 0,
          0,  0,    0, 1
   };

   float rotZ[16] = {
       cosZ, -sinZ, 0, 0,
       sinZ, cosZ,  0, 0,
          0,    0,  1, 0,
          0,    0,  0, 1
   };

   // Identity matrix for the final transformation
   for (int i = 0; i < 16; ++i)
       transform[i] = (i % 5 == 0) ? 1.0f : 0.0f;

   // Multiply rotZ * rotY * rotX to get the final transformation matrix
   for (int i = 0; i < 16; i += 4) {
       for (int j = 0; j < 4; ++j) {
           transform[i + j] = 0.0f;
           for (int k = 0; k < 4; ++k) {
               transform[i + j] += rotZ[i + k] * rotY[k * 4 + j];
           }
       }
   }

   float temp[16];
   for (int i = 0; i < 16; i += 4) {
       for (int j = 0; j < 4; ++j) {
           temp[i + j] = 0.0f;
           for (int k = 0; k < 4; ++k) {
               temp[i + j] += transform[i + k] * rotX[k * 4 + j];
           }
       }
   }

   for (int i = 0; i < 16; ++i) {
       transform[i] = temp[i];
   }
}

int main() {
   // Initialize GLFW
   if (!glfwInit()) {
       std::cerr << "Failed to initialize GLFW" << std::endl;
       return -1;
   }

   // Set GLFW to use OpenGL 3.3
   glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
   glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
   glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

   // Create a windowed mode window and its OpenGL context
   GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "Rotating Cube with Lighting", NULL, NULL);
   if (!window) {
       std::cerr << "Failed to create GLFW window" << std::endl;
       glfwTerminate();
       return -1;
   }
   glfwMakeContextCurrent(window);

   // Load OpenGL functions using glad
   if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
       std::cerr << "Failed to initialize GLAD" << std::endl;
       return -1;
   }

   // Set the viewport and callback for window resize
   glViewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
   glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

   // Build and compile the vertex shader
   unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
   glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
   glCompileShader(vertexShader);

   // Check for shader compile errors
   int success;
   char infoLog[512];
   glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
   if (!success) {
       glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
       std::cerr << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
   }

   // Build and compile the fragment shader
   unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
   glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
   glCompileShader(fragmentShader);

   // Check for shader compile errors
   glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
   if (!success) {
       glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
       std::cerr << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
   }

   // Link shaders into a program
   unsigned int shaderProgram = glCreateProgram();
   glAttachShader(shaderProgram, vertexShader);
   glAttachShader(shaderProgram, fragmentShader);
   glLinkProgram(shaderProgram);

   // Check for linking errors
   glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
   if (!success) {
       glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
       std::cerr << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
   }

   // Clean up shaders as they're no longer needed
   glDeleteShader(vertexShader);
   glDeleteShader(fragmentShader);

   // Set up vertex data and buffers
   float vertices[] = {
       // positions          // normals
       -0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,
        0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,
        0.5f,  0.5f, -0.5f,  0.0f,  0.0f, -1.0f,
        0.5f,  0.5f, -0.5f,  0.0f,  0.0f, -1.0f,
       -0.5f,  0.5f, -0.5f,  0.0f,  0.0f, -1.0f,
       -0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,

       -0.5f, -0.5f,  0.5f,  0.0f,  0.0f,  1.0f,
        0.5f, -0.5f,  0.5f,  0.0f,  0.0f,  1.0f,
        0.5f,  0.5f,  0.5f,  0.0f,  0.0f,  1.0f,
        0.5f,  0.5f,  0.5f,  0.0f,  0.0f,  1.0f,
       -0.5f,  0.5f,  0.5f,  0.0f,  0.0f,  1.0f,
       -0.5f, -0.5f,  0.5f,  0.0f,  0.0f,  1.0f,

       -0.5f,  0.5f,  0.5f, -1.0f,  0.0f,  0.0f,
       -0.5f,  0.5f, -0.5f, -1.0f,  0.0f,  0.0f,
       -0.5f, -0.5f, -0.5f, -1.0f,  0.0f,  0.0f,
       -0.5f, -0.5f, -0.5f, -1.0f,  0.0f,  0.0f,
       -0.5f, -0.5f,  0.5f, -1.0f,  0.0f,  0.0f,
       -0.5f,  0.5f,  0.5f, -1.0f,  0.0f,  0.0f,

        0.5f,  0.5f,  0.5f,  1.0f,  0.0f,  0.0f,
        0.5f,  0.5f, -0.5f,  1.0f,  0.0f,  0.0f,
        0.5f, -0.5f, -0.5f,  1.0f,  0.0f,  0.0f,
        0.5f, -0.5f, -0.5f,  1.0f,  0.0f,  0.0f,
        0.5f, -0.5f,  0.5f,  1.0f,  0.0f,  0.0f,
        0.5f,  0.5f,  0.5f,  1.0f,  0.0f,  0.0f,

       -0.5f, -0.5f, -0.5f,  0.0f, -1.0f,  0.0f,
        0.5f, -0.5f, -0.5f,  0.0f, -1.0f,  0.0f,
        0.5f, -0.5f,  0.5f,  0.0f, -1.0f,  0.0f,
        0.5f, -0.5f,  0.5f,  0.0f, -1.0f,  0.0f,
       -0.5f, -0.5f,  0.5f,  0.0f, -1.0f,  0.0f,
       -0.5f, -0.5f, -0.5f,  0.0f, -1.0f,  0.0f,

       -0.5f,  0.5f, -0.5f,  0.0f,  1.0f,  0.0f,
        0.5f,  0.5f, -0.5f,  0.0f,  1.0f,  0.0f,
        0.5f,  0.5f,  0.5f,  0.0f,  1.0f,  0.0f,
        0.5f,  0.5f,  0.5f,  0.0f,  1.0f,  0.0f,
       -0.5f,  0.5f,  0.5f,  0.0f,  1.0f,  0.0f,
       -0.5f,  0.5f, -0.5f,  0.0f,  1.0f,  0.0f
   };

   unsigned int VAO, VBO;
   glGenVertexArrays(1, &VAO);
   glGenBuffers(1, &VBO);

   // Bind VAO and VBO
   glBindVertexArray(VAO);

   glBindBuffer(GL_ARRAY_BUFFER, VBO);
   glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

   // Set vertex attribute pointers
   glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
   glEnableVertexAttribArray(0);

   glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
   glEnableVertexAttribArray(1);

   // Unbind the VBO and VAO
   glBindBuffer(GL_ARRAY_BUFFER, 0);
   glBindVertexArray(0);

   // Enable depth testing
   glEnable(GL_DEPTH_TEST);

   // Render loop
   while (!glfwWindowShouldClose(window)) {
       // Input
       processInput(window);

       // Render
       glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
       glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

       // Activate shader
       glUseProgram(shaderProgram);

       // Create transformation matrix
       float transform[16];
       float time = (float)glfwGetTime();
       createTransformationMatrix(transform, time, time, time);

       // Pass the transformation matrix to the shader
       unsigned int transformLoc = glGetUniformLocation(shaderProgram, "transform");
       glUniformMatrix4fv(transformLoc, 1, GL_FALSE, transform);

       // Set lighting uniforms
       glUniform3f(glGetUniformLocation(shaderProgram, "lightPos"), 1.2f, 1.0f, 2.0f); // Stationary light position
       glUniform3f(glGetUniformLocation(shaderProgram, "viewPos"), 0.0f, 0.0f, 3.0f);  // Camera position
       glUniform3f(glGetUniformLocation(shaderProgram, "lightColor"), 1.0f, 1.0f, 1.0f); // Light color
       glUniform3f(glGetUniformLocation(shaderProgram, "objectColor"), 1.0f, 0.5f, 0.31f); // Object color

       // Render the cube
       glBindVertexArray(VAO);
       glDrawArrays(GL_TRIANGLES, 0, 36);

       // Swap buffers and poll IO events
       glfwSwapBuffers(window);
       glfwPollEvents();
   }

   // Clean up
   glDeleteVertexArrays(1, &VAO);
   glDeleteBuffers(1, &VBO);

   glfwTerminate();
   return 0;
}

// Process all input
void processInput(GLFWwindow* window) {
   if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
       glfwSetWindowShouldClose(window, true);
}

// GLFW: whenever the window size changed, this callback function executes
void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
   glViewport(0, 0, width, height);
}
