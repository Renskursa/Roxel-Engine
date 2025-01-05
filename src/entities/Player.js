import { Entity } from './Entity.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CameraComponent } from '../components/CameraComponent.js';
import { Vector3 } from '../datatypes/Vector3.js';

// Player-specific render component
class PlayerRenderComponent extends RenderableComponent {
    generateRenderData() {
        return {
            vertices: new Float32Array([
                // Front face
                -0.5, -0.5,  0.5,
                 0.5, -0.5,  0.5,
                 0.5,  0.5,  0.5,
                -0.5,  0.5,  0.5
            ]),
            colors: new Float32Array([
                // RGBA for each vertex
                1.0, 0.0, 0.0, 1.0,  // Red
                0.0, 1.0, 0.0, 1.0,  // Green
                0.0, 0.0, 1.0, 1.0,  // Blue
                1.0, 1.0, 1.0, 1.0   // White
            ])
        };
    }
}

// Player-specific controller component
class PlayerControllerComponent {
    constructor() {
        this.entity = null;
        this.moveSpeed = 5;
    }

    update(deltaTime) {
        // Handle player input and movement
        // Access this.entity.position to move the player
    }
}

export class Player extends Entity {
    constructor() {
        super();
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0);
        this.addComponent(new PlayerRenderComponent());
        this.addComponent(new PlayerControllerComponent());
        this.addComponent(new CameraComponent());
    }

    getCamera() {
        const cameraComponent = this.getComponent('CameraComponent');
        return cameraComponent ? cameraComponent.camera : null;
    }
}
