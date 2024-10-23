#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <iostream>

// Vertex and Fragment shaders remain the same
const char* vertexShaderSource = R"(
    #version 330 core
    layout (location = 0) in vec3 aPos;
    uniform mat4 transform;
    void main() {
        gl_Position = transform * vec4(aPos, 1.0);
    }
)";

const char* fragmentShaderSource = R"(
    #version 330 core
    out vec4 FragColor;
    void main() {
        FragColor = vec4(1.0, 0.5, 0.2, 1.0);
    }
)";

// Global variables
GLuint VBO, VAO, shaderProgram;
glm::mat4 transformMatrix = glm::mat4(1.0f);
float scale = 1.0f;
float translateX = 0.0f, translateY = 0.0f;
float rotation = 0.0f;
float shearX = 0.0f, shearY = 0.0f;
bool isDragging = false;
double lastX = 0.0, lastY = 0.0;

enum class TransformMode {
    NONE,
    SCALE,
    TRANSLATE,
    ROTATE,
    SHEAR
};

TransformMode currentMode = TransformMode::NONE;

// Function to handle window resize
void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
    glViewport(0, 0, width, height);
}

void initializeGL() {
    // Triangle vertices
    float triangleVertices[] = {
        -0.2f, -0.2f, 0.0f,
        0.2f, -0.2f, 0.0f,
        0.0f, 0.2f, 0.0f
    };

    // Create and compile shaders
    GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertexShader);

    GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragmentShader);

    // Create and link shader program
    shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);

    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    // Create and set up vertex buffer and array objects
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(triangleVertices), triangleVertices, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
}

void updateTransformMatrix() {
    transformMatrix = glm::mat4(1.0f);
    transformMatrix = glm::translate(transformMatrix, glm::vec3(translateX, translateY, 0.0f));
    transformMatrix = glm::rotate(transformMatrix, glm::radians(rotation), glm::vec3(0.0f, 0.0f, 1.0f));
    transformMatrix = glm::scale(transformMatrix, glm::vec3(scale, scale, 1.0f));
    
    glm::mat4 shearMatrix(1.0f);
    shearMatrix[0][1] = shearX;
    shearMatrix[1][0] = shearY;
    transformMatrix = transformMatrix * shearMatrix;
}

// Function to convert screen coordinates to OpenGL coordinates
void screenToGL(GLFWwindow* window, double xpos, double ypos, float& x, float& y) {
    int width, height;
    glfwGetWindowSize(window, &width, &height);
    x = (2.0f * xpos) / width - 1.0f;
    y = 1.0f - (2.0f * ypos) / height;
}

void processInput(GLFWwindow* window) {
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
}

void mouse_button_callback(GLFWwindow* window, int button, int action, int mods) {
    // Check if mouse is over ImGui window
    if (ImGui::GetIO().WantCaptureMouse)
        return;

    if (button == GLFW_MOUSE_BUTTON_LEFT) {
        if (action == GLFW_PRESS) {
            isDragging = true;
            glfwGetCursorPos(window, &lastX, &lastY);
        }
        else if (action == GLFW_RELEASE) {
            isDragging = false;
        }
    }
}

void cursor_position_callback(GLFWwindow* window, double xpos, double ypos) {
    if (!isDragging || ImGui::GetIO().WantCaptureMouse)
        return;

    float deltaX = (xpos - lastX) * 0.01f;
    float deltaY = (lastY - ypos) * 0.01f; // Inverted for more intuitive control

    switch (currentMode) {
        case TransformMode::SCALE:
            scale += deltaY;
            scale = glm::max(0.1f, scale);
            break;
        case TransformMode::ROTATE:
            rotation += deltaX * 100.0f;
            break;
        case TransformMode::SHEAR:
            shearX += deltaX;
            shearY += deltaY;
            break;
        case TransformMode::TRANSLATE:
            translateX += deltaX;
            translateY += deltaY;
            break;
        default:
            break;
    }

    lastX = xpos;
    lastY = ypos;
    updateTransformMatrix();
}

int main() {
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(800, 600, "OpenGL Transformations", NULL, NULL);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    glfwSetMouseButtonCallback(window, mouse_button_callback);
    glfwSetCursorPosCallback(window, cursor_position_callback);

    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        return -1;
    }

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330");
    ImGui::StyleColorsDark();

    initializeGL();

    while (!glfwWindowShouldClose(window)) {
        processInput(window);

        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        // Create ImGui window
        ImGui::Begin("Transform Controls");
        
        // Radio buttons for transform mode
        if (ImGui::RadioButton("None", currentMode == TransformMode::NONE))
            currentMode = TransformMode::NONE;
        if (ImGui::RadioButton("Scale (Drag)", currentMode == TransformMode::SCALE))
            currentMode = TransformMode::SCALE;
        if (ImGui::RadioButton("Rotate (Drag)", currentMode == TransformMode::ROTATE))
            currentMode = TransformMode::ROTATE;
        if (ImGui::RadioButton("Translate (Drag)", currentMode == TransformMode::TRANSLATE))
            currentMode = TransformMode::TRANSLATE;
        if (ImGui::RadioButton("Shear (Drag)", currentMode == TransformMode::SHEAR))
            currentMode = TransformMode::SHEAR;

        ImGui::Separator();

        // Manual controls
        ImGui::Text("Manual Controls");
        ImGui::DragFloat("Scale", &scale, 0.01f, 0.1f, 10.0f);
        ImGui::DragFloat("Rotation", &rotation, 1.0f, 0.0f, 360.0f);
        ImGui::DragFloat("Translate X", &translateX, 0.01f, -2.0f, 2.0f);
        ImGui::DragFloat("Translate Y", &translateY, 0.01f, -2.0f, 2.0f);
        ImGui::DragFloat("Shear X", &shearX, 0.01f, -2.0f, 2.0f);
        ImGui::DragFloat("Shear Y", &shearY, 0.01f, -2.0f, 2.0f);

        if (ImGui::Button("Reset All")) {
            scale = 1.0f;
            rotation = 0.0f;
            translateX = translateY = 0.0f;
            shearX = shearY = 0.0f;
        }

        ImGui::End();

        // Render triangle
        updateTransformMatrix();
        glUseProgram(shaderProgram);
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "transform"), 1, GL_FALSE, glm::value_ptr(transformMatrix));
        
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 3);

        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // Cleanup
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(shaderProgram);

    glfwTerminate();
    return 0;
}