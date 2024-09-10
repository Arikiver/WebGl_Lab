#include <iostream>
#include <glad/glad.h>
#include <GLFW/glfw3.h>

int main() 
{
	glfwInit();

	//hinting that we are using OpenGL version 3.3 CORE profile
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	//making a GLFWwindow object named "window" of size 800*800 with the name of "FCC_OpenGL" 
	GLFWwindow* window = glfwCreateWindow(800, 800, "FCC_OpenGL", NULL, NULL);

	//error handling incae window fails to create
	if (window == NULL) 
	{
		std::cout << "failed to create GLFW window" << std::endl;
		glfwTerminate();
		return -1;
	}

	//tells glfw to make the window we made to be made as the current context for the window
	glfwMakeContextCurrent(window);

	//loads GLAD into opengl
	gladLoadGL();

	//viewport specifications:
	//the coordinates go from x = 0, y = 0 to x = 800, y = 800
	glViewport(0, 0, 800, 800);

	//specify the color of the background
	glClearColor(0.07f, 0.13f, 0.17f, 1.0f);

	//clear the back buffer and assign the new color to it
	glClear(GL_COLOR_BUFFER_BIT);

	//swap the front buffer with the back buffer
	glfwSwapBuffers(window);

	//keeps the window open until made not to
	while (!glfwWindowShouldClose(window))
	{
		//handles all window events
		glfwPollEvents();
	}

	glfwDestroyWindow(window);
	glfwTerminate();
	return 0;
}