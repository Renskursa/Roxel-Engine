# Roxel Engine

A lightweight and modular voxel game engine built with modern JavaScript.

## Features

- WebGL-based rendering
- Entity Component System
- Voxel-based world management
- Built-in physics system
- Input management system
- Scene management
- Lighting system

## Installation

```bash
npm install roxel-engine
```

## Quick Start

```javascript
import { Roxel, Scene } from 'roxel-engine';

// Initialize engine
const engine = new Roxel('gameCanvas');

// Create a scene
const scene = new Scene();
engine.addGameObject(scene);

// Start the engine
engine.start();
```

## Development

Clone the repository:
```bash
git clone https://github.com/yourusername/roxel-engine.git
cd roxel-engine
npm install
```

Build the engine:
```bash
npm run build
```

Watch mode for development:
```bash
npm run dev
```

## License

MIT © [Renskursa](https://github.com/yourusername)
