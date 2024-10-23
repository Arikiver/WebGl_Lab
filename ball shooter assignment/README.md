# Block Shooter Game - WebGL Implementation

## Overview
This project is a **Block Shooter Game** built using WebGL, HTML5, and JavaScript. The objective of the game is for the player to shoot and destroy falling blocks before they reach the bottom of the screen. The game implements basic 3D rendering, texture mapping, event handling, and collision detection.

## Features Implemented

### 1. Game Setup
- A game window is created using HTML5 Canvas and WebGL.
- The player controls a shooter located at the bottom of the screen, which can be moved left or right using the keyboard.
- Blocks fall from the top of the screen in random intervals.

### 2. Block Rendering
- Each block is rendered as a 2D object (a rectangle).
- Blocks are textured with images and have different hit points that determine how many shots are needed to destroy them.

### 3. Player Controls
- The player can move the shooter left and right using the `ArrowLeft` and `ArrowRight` keys.
- The player can shoot projectiles by pressing the spacebar.

### 4. Collision Detection
- Collision detection is implemented between projectiles and blocks.
- When a block is hit by a projectile, it is either damaged or destroyed, and the player's score is updated accordingly.
- If a block reaches the bottom of the screen, the player loses a life.

### 5. Texture Mapping
- Textures are applied to the player, blocks, and projectiles using WebGL texture mapping techniques.
- Texture coordinates are correctly assigned to ensure proper display.

### 6. Game Logic
- Blocks spawn continuously at random intervals from the top of the screen.
- The game ends when the player loses all lives.

## How to Run the Game
1. Open the `index.html` file in a modern web browser that supports WebGL.
2. Use the `ArrowLeft` and `ArrowRight` keys to move the shooter.
3. Press the spacebar to shoot projectiles at the falling blocks.
4. Track your score and lives at the top of the screen.

### Game Over Condition:
- The game ends when the player’s lives reach zero.

