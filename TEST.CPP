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

// Function to plot the circle points using Midpoint Circle Algorithm
void plotCirclePoints(float xc, float yc, float x, float y, std::vector<float>& vertices) {
    // Normalize coordinates to the range [-1, 1]
    vertices.push_back((xc + x) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc + y) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc - x) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc + y) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc + x) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc - y) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc - x) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc - y) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc + y) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc + x) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc - y) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc + x) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc + y) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc - x) / SCREEN_HEIGHT * 2 - 1);

    vertices.push_back((xc - y) / SCREEN_WIDTH * 2 - 1);
    vertices.push_back((yc - x) / SCREEN_HEIGHT * 2 - 1);
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

// Function to generate circle points using Midpoint Circle Algorithm
void generateCircle(float xc, float yc, float radius, std::vector<float>& vertices) {
    int x = 0;
    int y = radius;
    int p = 1 - radius;

    // Plot initial points
    plotCirclePoints(xc, yc, x, y, vertices);

    while (x < y) {
        x++;
        if (p < 0) {
            p += 2 * x + 1;
        }
        else {
            y--;
            p += 2 * (x - y) + 1;
        }
        plotCirclePoints(xc, yc, x, y, vertices);
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

// Mouse callback for dragging to resize ellipse
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

void render(GLFWwindow* window, GLuint shaderProgram, GLuint VAO, GLuint VBO) {
    // Get the window size to adjust the viewports
    int width, height;
    glfwGetFramebufferSize(window, &width, &height);

    float currentFrame = glfwGetTime();
    static float lastFrame = 0.0f;
    float deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;

    // If the animation is enabled, update the ellipse with a sinusoidal function
    if (animate) {
        animTime += animSpeed * glfwGetTime();
        rx = initialRx + 50 * std::sin(animTime);  // Sinusoidal deformation
        ry = initialRy + 50 * std::cos(animTime);  // Sinusoidal deformation
    }

    // Generate updated ellipse vertices
    std::vector<float> ellipseVertices;
    generateEllipse(centerX, centerY, rx, ry, ellipseVertices);

    // Set up VAO and VBO for ellipse
    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, ellipseVertices.size() * sizeof(float), ellipseVertices.data(), GL_STATIC_DRAW);
    glBindBuffer(GL_ARRAY_BUFFER, 0);


    // Clear the screen
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glUseProgram(shaderProgram);

    // Draw ellipse
    glViewport(0, 0, width / 2, height);
    glDrawArrays(GL_POINTS, 0, ellipseVertices.size() / 2);

    // Draw circle
    std::vector<float> circleVertices;
    generateCircle(centerX, centerY, std::min(rx, ry), circleVertices);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, circleVertices.size() * sizeof(float), circleVertices.data(), GL_STATIC_DRAW);
    glBindBuffer(GL_ARRAY_BUFFER, 0);

    // Set second viewport (right side of the screen)
    glViewport(width / 2, 0, width / 2, height);
    glDrawArrays(GL_POINTS, 0, circleVertices.size() / 2); // Use GL_POINTS for rendering the circle

    glBindVertexArray(0);

    // Swap the buffers after rendering both viewports
    glfwSwapBuffers(window);
}

int main() {
    // Initialize GLFW
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    // Create a GLFW window
    GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Ellipse and Circle Animation", nullptr, nullptr);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);
    glfwSetMouseButtonCallback(window, mouse_button_callback);
    glfwSetCursorPosCallback(window, cursor_position_callback);

    // Initialize GLAD
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cerr << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // Compile shaders and link the program
    GLuint vertexShader = compileShader(GL_VERTEX_SHADER, vertexShaderSource);
    GLuint fragmentShader = compileShader(GL_FRAGMENT_SHADER, fragmentShaderSource);
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

    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    // Setup VAO and VBO
    GLuint VAO, VBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, 0, nullptr, GL_DYNAMIC_DRAW); // Initialize with no data
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    // Render loop
    while (!glfwWindowShouldClose(window)) {
        render(window, shaderProgram, VAO, VBO);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}