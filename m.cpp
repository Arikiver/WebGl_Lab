#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <vector>
#include <cmath>

const char* vertexShaderSource = R"glsl(
#version 330 core
layout(location = 0) in vec2 aPos;

void main()
{
    gl_Position = vec4(aPos, 0.0, 1.0);
}
)glsl";

const char* fragmentShaderSource = R"glsl(
#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
}
)glsl";

std::vector<float> points; // Store points in this vector
bool lineReady = false;

void addLinePoints(float x1, float y1, float x2, float y2) {
   float m = (y2 - y1) / (x2 - x1); // Slope
   float c = y1 - m * x1;           // Intercept

   float xStep = 0.001f; // step for drawing the line
   if (x2 < x1) xStep = -xStep; // Reverse step if moving left

   for (float x = x1; (xStep > 0 ? x <= x2 : x >= x2); x += xStep) {
       float y = m * x + c;
       points.push_back(x);
       points.push_back(y);
   }
}

// Mouse callback to capture points on click
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods) {
   if (button == GLFW_MOUSE_BUTTON_LEFT && action == GLFW_PRESS) {
       double xpos, ypos;
       glfwGetCursorPos(window, &xpos, &ypos);

       int width, height;
       glfwGetWindowSize(window, &width, &height);
       float x = (2.0f * xpos) / width - 1.0f;
       float y = 1.0f - (2.0f * ypos) / height;

       points.push_back(x);
       points.push_back(y);

       if (points.size() >= 4) {
           // We have 2 points, so draw a line
           float x1 = points[points.size() - 4];
           float y1 = points[points.size() - 3];
           float x2 = points[points.size() - 2];
           float y2 = points[points.size() - 1];

           addLinePoints(x1, y1, x2, y2);
           lineReady = true;
       }
   }
}

unsigned int compileShaders() {
   unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
   glShaderSource(vertexShader, 1, &vertexShaderSource, nullptr);
   glCompileShader(vertexShader);

   int success;
   char infoLog[512];
   glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
   if (!success) {
       glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
       std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
   }

   unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
   glShaderSource(fragmentShader, 1, &fragmentShaderSource, nullptr);
   glCompileShader(fragmentShader);

   glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
   if (!success) {
       glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
       std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
   }

   unsigned int shaderProgram = glCreateProgram();
   glAttachShader(shaderProgram, vertexShader);
   glAttachShader(shaderProgram, fragmentShader);
   glLinkProgram(shaderProgram);

   glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
   if (!success) {
       glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
       std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
   }

   glDeleteShader(vertexShader);
   glDeleteShader(fragmentShader);

   return shaderProgram;
}

int main() {
   if (!glfwInit()) {
       std::cerr << "Failed to initialize GLFW\n";
       return -1;
   }

   glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
   glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
   glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

   GLFWwindow* window = glfwCreateWindow(800, 600, "Plot Points on Mouse Click", NULL, NULL);
   if (!window) {
       std::cerr << "Failed to create GLFW window\n";
       glfwTerminate();
       return -1;
   }
   glfwMakeContextCurrent(window);

   if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
       std::cerr << "Failed to initialize GLAD\n";
       return -1;
   }

   glViewport(0, 0, 800, 600);
   glfwSetMouseButtonCallback(window, mouse_button_callback);

   unsigned int shaderProgram = compileShaders();
   glUseProgram(shaderProgram);

   unsigned int VBO, VAO;
   glGenVertexArrays(1, &VAO);
   glGenBuffers(1, &VBO);

   while (!glfwWindowShouldClose(window)) {
       glClear(GL_COLOR_BUFFER_BIT);

       if (lineReady) {
           glBindVertexArray(VAO);
           glBindBuffer(GL_ARRAY_BUFFER, VBO);
           glBufferData(GL_ARRAY_BUFFER, sizeof(float) * points.size(), points.data(), GL_DYNAMIC_DRAW);

           glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
           glEnableVertexAttribArray(0);

           glDrawArrays(GL_POINTS, 0, points.size() / 2);

           glBindBuffer(GL_ARRAY_BUFFER, 0);
           glBindVertexArray(0);
       }

       glfwSwapBuffers(window);
       glfwPollEvents();
   }

   glDeleteVertexArrays(1, &VAO);
   glDeleteBuffers(1, &VBO);
   glDeleteProgram(shaderProgram);

   glfwTerminate();
   return 0;
}
