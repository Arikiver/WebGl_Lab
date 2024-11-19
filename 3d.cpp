#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>
#include <iostream>
#include <vector>
#include <string>

// Shader sources
const char* vertexShaderSource = R"(
   #version 330 core
   layout (location = 0) in vec3 aPos;
   layout (location = 1) in vec3 aColor;
   
   uniform mat4 model;
   uniform mat4 view;
   uniform mat4 projection;
   
   out vec3 ourColor;
   
   void main() {
       gl_Position = projection * view * model * vec4(aPos, 1.0);
       ourColor = aColor;
   }
)";

const char* fragmentShaderSource = R"(
   #version 330 core
   in vec3 ourColor;
   out vec4 FragColor;
   
   void main() {
       FragColor = vec4(ourColor, 1.0);
   }
)";


// Callback function for window resize
void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
    glViewport(0, 0, width, height);
}

// Common Shape class
class Shape {
public:
    enum Type { CUBE, PYRAMID };
    std::vector<float> vertices;
    std::vector<unsigned int> indices;

    void createCube() {
        vertices = {
            // positions          // colors
            -0.5f, -0.5f, -0.5f,  1.0f, 0.0f, 0.0f,
             0.5f, -0.5f, -0.5f,  1.0f, 0.0f, 0.0f,
             0.5f,  0.5f, -0.5f,  1.0f, 0.0f, 0.0f,
            -0.5f,  0.5f, -0.5f,  1.0f, 0.0f, 0.0f,
            -0.5f, -0.5f,  0.5f,  0.0f, 1.0f, 0.0f,
             0.5f, -0.5f,  0.5f,  0.0f, 1.0f, 0.0f,
             0.5f,  0.5f,  0.5f,  0.0f, 1.0f, 0.0f,
            -0.5f,  0.5f,  0.5f,  0.0f, 1.0f, 0.0f
        };

        indices = {
            0, 1, 2, 2, 3, 0,
            1, 5, 6, 6, 2, 1,
            5, 4, 7, 7, 6, 5,
            4, 0, 3, 3, 7, 4,
            3, 2, 6, 6, 7, 3,
            4, 5, 1, 1, 0, 4
        };
    }

    void createPyramid() {
        vertices = {
            // positions          // colors
            -0.5f, -0.5f, -0.5f,  1.0f, 0.0f, 0.0f,
             0.5f, -0.5f, -0.5f,  0.0f, 1.0f, 0.0f,
             0.5f, -0.5f,  0.5f,  0.0f, 0.0f, 1.0f,
            -0.5f, -0.5f,  0.5f,  1.0f, 1.0f, 0.0f,
             0.0f,  0.5f,  0.0f,  1.0f, 0.0f, 1.0f
        };

        indices = {
            0, 1, 2,
            2, 3, 0,
            0, 1, 4,
            1, 2, 4,
            2, 3, 4,
            3, 0, 4
        };
    }
};

// Shape Selector class for intro screen
class ShapeSelector {
private:
    GLuint VAO[2], VBO[2], EBO[2];
    GLuint shaderProgram;
    Shape shapes[2];  // cube and pyramid
    float rotationAngle = 0.0f;
    int selectedShape = -1;
    glm::mat4 projection;

public:
    ShapeSelector() {
        setupShaders();
        setupShapes();
        // Get the initial window size
        int width, height;
        glfwGetFramebufferSize(glfwGetCurrentContext(), &width, &height);
        updateProjection(width, height);
    }

    void updateProjection(int width, int height) {
        float aspect = static_cast<float>(width) / static_cast<float>(height);
        projection = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);
    }

    void setupShaders() {
        GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
        glCompileShader(vertexShader);

        GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
        glCompileShader(fragmentShader);

        shaderProgram = glCreateProgram();
        glAttachShader(shaderProgram, vertexShader);
        glAttachShader(shaderProgram, fragmentShader);
        glLinkProgram(shaderProgram);

        glDeleteShader(vertexShader);
        glDeleteShader(fragmentShader);
    }

    void setupShapes() {
        glGenVertexArrays(2, VAO);
        glGenBuffers(2, VBO);
        glGenBuffers(2, EBO);

        // Setup cube
        shapes[0].createCube();
        setupBuffers(0, shapes[0]);

        // Setup pyramid
        shapes[1].createPyramid();
        setupBuffers(1, shapes[1]);
    }

    void setupBuffers(int index, const Shape& shape) {
        glBindVertexArray(VAO[index]);

        glBindBuffer(GL_ARRAY_BUFFER, VBO[index]);
        glBufferData(GL_ARRAY_BUFFER, shape.vertices.size() * sizeof(float),
            shape.vertices.data(), GL_STATIC_DRAW);

        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO[index]);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, shape.indices.size() * sizeof(unsigned int),
            shape.indices.data(), GL_STATIC_DRAW);

        glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(0);

        glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
        glEnableVertexAttribArray(1);
    }

    void render() {
        glUseProgram(shaderProgram);

        // Update rotation angle
        rotationAngle += 0.1f;
        if (rotationAngle >= 360.0f) rotationAngle = 0.0f;

        // Setup camera view
        glm::mat4 view = glm::lookAt(
            glm::vec3(0.0f, 0.0f, 5.0f),
            glm::vec3(0.0f),
            glm::vec3(0.0f, 1.0f, 0.0f)
        );

        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "view"), 1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "projection"), 1, GL_FALSE, glm::value_ptr(projection));

        // Render cube (left side)
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::translate(model, glm::vec3(-1.5f, 0.0f, 0.0f));
        model = glm::rotate(model, glm::radians(rotationAngle), glm::vec3(0.5f, 1.0f, 0.0f));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, glm::value_ptr(model));
        glBindVertexArray(VAO[0]);
        glDrawElements(GL_TRIANGLES, shapes[0].indices.size(), GL_UNSIGNED_INT, 0);

        // Render pyramid (right side)
        model = glm::mat4(1.0f);
        model = glm::translate(model, glm::vec3(1.5f, 0.0f, 0.0f));
        model = glm::rotate(model, glm::radians(rotationAngle), glm::vec3(0.5f, 1.0f, 0.0f));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, glm::value_ptr(model));
        glBindVertexArray(VAO[1]);
        glDrawElements(GL_TRIANGLES, shapes[1].indices.size(), GL_UNSIGNED_INT, 0);

        // Render selection UI
        ImGui::SetNextWindowPos(ImVec2(ImGui::GetIO().DisplaySize.x * 0.5f, ImGui::GetIO().DisplaySize.y * 0.8f),
            ImGuiCond_Always, ImVec2(0.5f, 0.5f));
        ImGui::Begin("Shape Selection", nullptr,
            ImGuiWindowFlags_AlwaysAutoResize | ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoTitleBar);

        ImGui::Text("Choose a shape to begin:");
        ImGui::Spacing();

        if (ImGui::Button("Select Cube", ImVec2(120, 40))) selectedShape = 0;
        ImGui::SameLine(0, 20);
        if (ImGui::Button("Select Pyramid", ImVec2(120, 40))) selectedShape = 1;

        ImGui::End();
    }

    int getSelectedShape() const { return selectedShape; }

    void cleanup() {
        glDeleteVertexArrays(2, VAO);
        glDeleteBuffers(2, VBO);
        glDeleteBuffers(2, EBO);
        glDeleteProgram(shaderProgram);
    }
};

// Renderer class for transformation mode
class Renderer {
private:
    GLuint VAO, VBO, EBO;
    GLuint shaderProgram;
    Shape currentShape;
    GLFWwindow* window;

    // Default values for reset
    const glm::vec3 DEFAULT_TRANSLATION{ 0.0f };
    const glm::vec3 DEFAULT_ROTATION{ 0.0f };
    const glm::vec3 DEFAULT_SCALE{ 1.0f };
    const glm::vec3 DEFAULT_SHEAR{ 0.0f };
    const glm::vec3 DEFAULT_CAMERA_POS{ 0.0f, 0.0f, 3.0f };

    // Transformation parameters
    glm::vec3 translation{ 0.0f };
    glm::vec3 rotation{ 0.0f };
    glm::vec3 scale{ 1.0f };
    glm::vec3 shear{ 0.0f };
    bool reflection[3] = { false, false, false };

    // Camera parameters
    glm::vec3 cameraPos{ 0.0f, 0.0f, 3.0f };
    glm::mat4 projection;

    bool isFullscreen = false;
    GLFWmonitor* primaryMonitor;
    int windowed_x, windowed_y, windowed_width, windowed_height;

public:
    Renderer(GLFWwindow* win) : window(win) {
        primaryMonitor = glfwGetPrimaryMonitor();
        setupShaders();
        setupBuffers();
        updateProjection();
    }

    void setShape(Shape::Type shapeType) {
        if (shapeType == Shape::CUBE) {
            currentShape.createCube();
        }
        else {
            currentShape.createPyramid();
        }
        updateBuffers();
    }

    void updateProjection() {
        int width, height;
        glfwGetFramebufferSize(window, &width, &height);
        projection = glm::perspective(glm::radians(45.0f), (float)width / (float)height, 0.1f, 100.0f);
    }

    void resetTransformations() {
        translation = DEFAULT_TRANSLATION;
        rotation = DEFAULT_ROTATION;
        scale = DEFAULT_SCALE;
        shear = DEFAULT_SHEAR;
        cameraPos = DEFAULT_CAMERA_POS;
        reflection[0] = reflection[1] = reflection[2] = false;
    }

    void toggleFullscreen() {
        if (!isFullscreen) {
            glfwGetWindowPos(window, &windowed_x, &windowed_y);
            glfwGetWindowSize(window, &windowed_width, &windowed_height);
            const GLFWvidmode* mode = glfwGetVideoMode(primaryMonitor);
            glfwSetWindowMonitor(window, primaryMonitor, 0, 0, mode->width, mode->height, mode->refreshRate);
        }
        else {
            glfwSetWindowMonitor(window, nullptr, windowed_x, windowed_y, windowed_width, windowed_height, 0);
        }
        isFullscreen = !isFullscreen;
        updateProjection();
    }

    void setupShaders() {
        GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
        glCompileShader(vertexShader);

        GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
        glCompileShader(fragmentShader);

        shaderProgram = glCreateProgram();
        glAttachShader(shaderProgram, vertexShader);
        glAttachShader(shaderProgram, fragmentShader);
        glLinkProgram(shaderProgram);

        glDeleteShader(vertexShader);
        glDeleteShader(fragmentShader);
    }

    void setupBuffers() {
        glGenVertexArrays(1, &VAO);
        glGenBuffers(1, &VBO);
        glGenBuffers(1, &EBO);
    }

    void updateBuffers() {
        glBindVertexArray(VAO);

        glBindBuffer(GL_ARRAY_BUFFER, VBO);
        glBufferData(GL_ARRAY_BUFFER, currentShape.vertices.size() * sizeof(float),
            currentShape.vertices.data(), GL_STATIC_DRAW);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, currentShape.indices.size() * sizeof(unsigned int),
            currentShape.indices.data(), GL_STATIC_DRAW);

        glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(0);

        glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
        glEnableVertexAttribArray(1);
    }



    void renderUI() {
        // Set up ImGui window for transformations
        ImGui::SetNextWindowPos(ImVec2(10, 10), ImGuiCond_FirstUseEver);
        ImGui::SetNextWindowSize(ImVec2(300, 400), ImGuiCond_FirstUseEver);
        ImGui::Begin("Transformations");

        // Translation controls
        ImGui::Text("Translation");
        ImGui::SliderFloat("X##Trans", &translation.x, -2.0f, 2.0f);
        ImGui::SliderFloat("Y##Trans", &translation.y, -2.0f, 2.0f);
        ImGui::SliderFloat("Z##Trans", &translation.z, -2.0f, 2.0f);

        ImGui::Separator();

        // Rotation controls
        ImGui::Text("Rotation");
        ImGui::SliderFloat("X##Rot", &rotation.x, 0.0f, 360.0f);
        ImGui::SliderFloat("Y##Rot", &rotation.y, 0.0f, 360.0f);
        ImGui::SliderFloat("Z##Rot", &rotation.z, 0.0f, 360.0f);

        ImGui::Separator();

        // Scale controls
        ImGui::Text("Scale");
        ImGui::SliderFloat("X##Scale", &scale.x, 0.1f, 2.0f);
        ImGui::SliderFloat("Y##Scale", &scale.y, 0.1f, 2.0f);
        ImGui::SliderFloat("Z##Scale", &scale.z, 0.1f, 2.0f);

        ImGui::Separator();

        // Shear controls
        ImGui::Text("Shear");
        ImGui::SliderFloat("X##Shear", &shear.x, -1.0f, 1.0f);
        ImGui::SliderFloat("Y##Shear", &shear.y, -1.0f, 1.0f);
        ImGui::SliderFloat("Z##Shear", &shear.z, -1.0f, 1.0f);

        ImGui::Separator();

        // Reflection controls
        ImGui::Text("Reflection");
        ImGui::Checkbox("X-axis##Refl", &reflection[0]);
        ImGui::Checkbox("Y-axis##Refl", &reflection[1]);
        ImGui::Checkbox("Z-axis##Refl", &reflection[2]);

        ImGui::Separator();

        // Camera controls
        ImGui::Text("Camera Position");
        ImGui::SliderFloat("X##Cam", &cameraPos.x, -5.0f, 5.0f);
        ImGui::SliderFloat("Y##Cam", &cameraPos.y, -5.0f, 5.0f);
        ImGui::SliderFloat("Z##Cam", &cameraPos.z, 0.1f, 10.0f);

        ImGui::Separator();

        // Reset and fullscreen buttons
        if (ImGui::Button("Reset Transformations")) {
            resetTransformations();
        }

        if (ImGui::Button("Toggle Fullscreen")) {
            toggleFullscreen();
        }

        ImGui::End();
    }

    void render() {
        glUseProgram(shaderProgram);

        // Create view matrix
        glm::mat4 view = glm::lookAt(
            cameraPos,
            glm::vec3(0.0f, 0.0f, 0.0f),
            glm::vec3(0.0f, 1.0f, 0.0f)
        );

        // Create transformation matrix
        glm::mat4 model = glm::mat4(1.0f);

        // Apply transformations in order
        // Translation
        model = glm::translate(model, translation);

        // Rotation
        model = glm::rotate(model, glm::radians(rotation.x), glm::vec3(1.0f, 0.0f, 0.0f));
        model = glm::rotate(model, glm::radians(rotation.y), glm::vec3(0.0f, 1.0f, 0.0f));
        model = glm::rotate(model, glm::radians(rotation.z), glm::vec3(0.0f, 0.0f, 1.0f));

        // Scale
        model = glm::scale(model, scale);

        // Shear
        glm::mat4 shearMatrix(1.0f);
        shearMatrix[0][1] = shear.y; // xy shear
        shearMatrix[0][2] = shear.z; // xz shear
        shearMatrix[1][0] = shear.x; // yx shear
        shearMatrix[1][2] = shear.z; // yz shear
        shearMatrix[2][0] = shear.x; // zx shear
        shearMatrix[2][1] = shear.y; // zy shear
        model = model * shearMatrix;

        // Reflection
        if (reflection[0]) model = glm::scale(model, glm::vec3(-1.0f, 1.0f, 1.0f));
        if (reflection[1]) model = glm::scale(model, glm::vec3(1.0f, -1.0f, 1.0f));
        if (reflection[2]) model = glm::scale(model, glm::vec3(1.0f, 1.0f, -1.0f));

        // Set uniforms
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "model"), 1, GL_FALSE, glm::value_ptr(model));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "view"), 1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "projection"), 1, GL_FALSE, glm::value_ptr(projection));

        // Draw the shape
        glBindVertexArray(VAO);
        glDrawElements(GL_TRIANGLES, currentShape.indices.size(), GL_UNSIGNED_INT, 0);
    }

    void cleanup() {
        glDeleteVertexArrays(1, &VAO);
        glDeleteBuffers(1, &VBO);
        glDeleteBuffers(1, &EBO);
        glDeleteProgram(shaderProgram);
    }
};

int main() {
    // Initialize GLFW
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        return -1;
    }

    // Configure GLFW
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // Create window
    GLFWwindow* window = glfwCreateWindow(800, 600, "3D Shape Transformer", NULL, NULL);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // Initialize GLEW
    if (glewInit() != GLEW_OK) {
        std::cerr << "Failed to initialize GLEW" << std::endl;
        glfwTerminate();
        return -1;
    }

    // Initialize ImGui
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330");
    ImGui::StyleColorsDark();

    // Enable depth testing
    glEnable(GL_DEPTH_TEST);

    // Create shape selector for intro screen
    ShapeSelector shapeSelector;
    Renderer* renderer = nullptr;
    bool introScreen = true;

    // Main loop
    while (!glfwWindowShouldClose(window)) {
        // Clear buffers
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);

        // Start ImGui frame
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        if (introScreen) {
            // Render shape selection screen
            shapeSelector.render();

            // Check if a shape has been selected
            int selectedShape = shapeSelector.getSelectedShape();
            if (selectedShape != -1) {
                // Create renderer with selected shape
                renderer = new Renderer(window);
                renderer->setShape(static_cast<Shape::Type>(selectedShape));
                introScreen = false;
            }
        }
        else {
            // Render transformation mode
            renderer->render();
            renderer->renderUI();
        }

        // Render ImGui
        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

        // Swap buffers and poll events
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // Cleanup
    if (renderer) {
        renderer->cleanup();
        delete renderer;
    }
    shapeSelector.cleanup();

    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();

    glfwTerminate();
    return 0;
}