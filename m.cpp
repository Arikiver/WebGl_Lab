#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <vector>
#include <cmath>

// Screen size
const int SCREEN_WIDTH = 800;
const int SCREEN_HEIGHT = 600;

// Ellipse parameters
float centerX = SCREEN_WIDTH / 2;
float centerY = SCREEN_HEIGHT / 2;
float rx = 200; // semi-major axis (initial)
float ry = 100; // semi-minor axis (initial)
float initialRx = rx;
float initialRy = ry;

// Vertex Shader source
const char* vertexShaderSource = R"(
   #version 330 core
   layout(location = 0) in vec2 aPos;
   void main() {
       gl_Position = vec4(aPos.x, aPos.y, 0.0, 1.0);
   }
)";

// Fragment Shader source
const char* fragmentShaderSource = R"(
   #version 330 core
   out vec4 FragColor;
   void main() {
       FragColor = vec4(1.0, 0.5, 0.2, 1.0); // Orange color
   }
)";

// Function to compile shader and check for errors
GLuint compileShader(GLenum type, const char* source) {
   GLuint shader = glCreateShader(type);
   glShaderSource(shader, 1, &source, nullptr);
   glCompileShader(shader);

   // Check for shader compile errors
   int success;
   char infoLog[512];
   glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
   if (!success) {
       glGetShaderInfoLog(shader, 512, nullptr, infoLog);
       std::cerr << "ERROR::SHADER::COMPILATION_FAILED\n" << infoLog << std::endl;
   }
   return shader;
}

// Function to plot the points of the ellipse
void plotEllipsePoints(float xc, float yc, float x, float y, std::vector<float>& vertices) {
   // Normalize coordinates to the range [-1, 1]
   vertices.push_back((xc + x) / SCREEN_WIDTH * 2 - 1);
   vertices.push_back((yc + y) / SCREEN_HEIGHT * 2 - 1);

   vertices.push_back((xc - x) / SCREEN_WIDTH * 2 - 1);
   vertices.push_back((yc + y) / SCREEN_HEIGHT * 2 - 1);

   vertices.push_back((xc + x) / SCREEN_WIDTH * 2 - 1);
   vertices.push_back((yc - y) / SCREEN_HEIGHT * 2 - 1);

   vertices.push_back((xc - x) / SCREEN_WIDTH * 2 - 1);
   vertices.push_back((yc - y) / SCREEN_HEIGHT * 2 - 1);
}

// Function to generate the ellipse points using Midpoint Ellipse Algorithm
void generateEllipse(float xc, float yc, float rx, float ry, std::vector<float>& vertices) {
   float x = 0;
   float y = ry;
   float rx2 = rx * rx;
   float ry2 = ry * ry;
   float tworx2 = 2 * rx2;
   float twory2 = 2 * ry2;
   float p = ry2 - (rx2 * ry) + (0.25 * rx2);
   float px = 0;
   float py = tworx2 * y;

   // Region 1
   while (px < py) {
       plotEllipsePoints(xc, yc, x, y, vertices);
       x++;
       px += twory2;
       if (p < 0) {
           p += ry2 + px;
       }
       else {
           y--;
           py -= tworx2;
           p += ry2 + px - py;
       }
   }

   // Region 2
   p = ry2 * (x + 0.5f) * (x + 0.5f) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
   while (y > 0) {
       plotEllipsePoints(xc, yc, x, y, vertices);
       y--;
       py -= tworx2;
       if (p > 0) {
           p += rx2 - py;
       }
       else {
           x++;
           px += twory2;
           p += rx2 - py + px;
       }
   }
}

// Global variables for mouse control and sinusoidal animation
bool isDragging = false;
bool animate = false;  // For sinusoidal animation
double startX, startY;
float animTime = 0.0f; // For sinusoidal animation time
float animSpeed = 0.0005f; // Speed of the sinusoidal deformation

// Mouse callback for clicking and dragging
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods) {
   if (button == GLFW_MOUSE_BUTTON_LEFT) {
       if (action == GLFW_PRESS) {
           isDragging = true;
           glfwGetCursorPos(window, &startX, &startY);
       }
       else if (action == GLFW_RELEASE) {
           isDragging = false;
       }
   }

   // Toggle animation with right mouse button
   if (button == GLFW_MOUSE_BUTTON_RIGHT && action == GLFW_PRESS) {
       animate = !animate;  // Toggle animation state
   }
}

// Mouse motion callback to update the ellipse radius
void cursor_position_callback(GLFWwindow* window, double xpos, double ypos) {
   if (isDragging) {
       double deltaX = xpos - startX;
       double deltaY = ypos - startY;

       rx = initialRx + deltaX;
       ry = initialRy - deltaY; // Invert Y axis since OpenGL's Y increases upwards
       if (rx < 1) rx = 1; // Prevent shrinking too much
       if (ry < 1) ry = 1;
   }
}

int main() {
   // Initialize GLFW
   if (!glfwInit()) {
       std::cerr << "Failed to initialize GLFW" << std::endl;
       return -1;
   }

   // Set GLFW version to 3.3 and core profile
   glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
   glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
   glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

   // Create a GLFW window
   GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Midpoint Ellipse Algorithm with Sinusoidal Deformation", nullptr, nullptr);
   if (!window) {
       std::cerr << "Failed to create GLFW window" << std::endl;
       glfwTerminate();
       return -1;
   }

   // Make the window's context current
   glfwMakeContextCurrent(window);

   // Load OpenGL functions using GLAD
   if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
       std::cerr << "Failed to initialize GLAD" << std::endl;
       return -1;
   }

   // Set mouse callback functions
   glfwSetMouseButtonCallback(window, mouse_button_callback);
   glfwSetCursorPosCallback(window, cursor_position_callback);

   // Build and compile the shader program
   GLuint vertexShader = compileShader(GL_VERTEX_SHADER, vertexShaderSource);
   GLuint fragmentShader = compileShader(GL_FRAGMENT_SHADER, fragmentShaderSource);

   // Link shaders to a shader program
   GLuint shaderProgram = glCreateProgram();
   glAttachShader(shaderProgram, vertexShader);
   glAttachShader(shaderProgram, fragmentShader);
   glLinkProgram(shaderProgram);

   // Check for linking errors
   int success;
   char infoLog[512];
   glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
   if (!success) {
       glGetProgramInfoLog(shaderProgram, 512, nullptr, infoLog);
       std::cerr << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
   }

   // Delete the shaders as they're linked into the program now and no longer needed
   glDeleteShader(vertexShader);
   glDeleteShader(fragmentShader);

   // Create a VAO and VBO
   GLuint VAO, VBO;
   glGenVertexArrays(1, &VAO);
   glGenBuffers(1, &VBO);

   // Bind VAO
   glBindVertexArray(VAO);

   // Main loop
   while (!glfwWindowShouldClose(window)) {
       // Process input
       if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
           glfwSetWindowShouldClose(window, true);

       // If the animation is enabled, update the ellipse with a sinusoidal function
       if (animate) {
           animTime += animSpeed * glfwGetTime();
           rx = initialRx + 50 * std::sin(animTime);  // Sinusoidal deformation
           ry = initialRy + 50 * std::cos(animTime);  // Sinusoidal deformation
       }

       // Generate ellipse points dynamically
       std::vector<float> ellipseVertices;
       generateEllipse(centerX, centerY, rx, ry, ellipseVertices);

       // Bind and set VBO data
       glBindBuffer(GL_ARRAY_BUFFER, VBO);
       glBufferData(GL_ARRAY_BUFFER, ellipseVertices.size() * sizeof(float), ellipseVertices.data(), GL_DYNAMIC_DRAW);

       // Configure vertex attribute
       glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
       glEnableVertexAttribArray(0);

       // Render
       glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
       glClear(GL_COLOR_BUFFER_BIT);

       // Draw the ellipse
       glUseProgram(shaderProgram);
       glBindVertexArray(VAO);
       glDrawArrays(GL_POINTS, 0, ellipseVertices.size() / 2);

       // Swap buffers and poll events
       glfwSwapBuffers(window);
       glfwPollEvents();
   }

   // Cleanup
   glDeleteVertexArrays(1, &VAO);
   glDeleteBuffers(1, &VBO);
   glDeleteProgram(shaderProgram);

   // Terminate GLFW
   glfwTerminate();
   return 0;
}

