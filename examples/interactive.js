import { Roxel, Noise, Vector3 } from '../dist/roxel-engine.esm.js';

// --- Engine and World Setup ---

const engine = new Roxel('roxel-canvas');
const noise = new Noise(Math.random());

// Custom world generation for more interesting terrain
engine.activeScene.world.generate = (x, y, z) => {
    const height = Math.floor(noise.noise2D(x / 50, z / 50) * 10);
    if (y < height) {
        if (y === height - 1) return 2; // Grass on top
        if (y > height - 5) return 3; // Dirt below grass
        return 1; // Stone underneath
    }
    return 0;
};

engine.start();
engine.enableFocusManager(); // Enable pointer lock on click

// --- Player Controller ---

const camera = engine.camera;
const input = engine.getInput();
const world = engine.activeScene.world;

const playerController = {

    // Raycasting function to find the block the camera is looking at
    raycast: (start, direction, maxDistance) => {
        const step = direction.clone().normalize().multiplyScalar(0.1);
        let currentPos = start.clone();

        for (let i = 0; i < maxDistance * 10; i++) {
            const lastPos = currentPos.clone();
            currentPos.add(step);

            const x = Math.floor(currentPos.x);
            const y = Math.floor(currentPos.y);
            const z = Math.floor(currentPos.z);

            if (world.getVoxel(x, y, z) > 0) {
                // Hit a solid voxel. Now determine the normal.
                const voxelCenter = new Vector3(x + 0.5, y + 0.5, z + 0.5);
                const pointOfEntry = lastPos; // Approximate point of entry

                const diff = pointOfEntry.clone().subtract(voxelCenter);
                const absDiff = new Vector3(Math.abs(diff.x), Math.abs(diff.y), Math.abs(diff.z));

                let normal = new Vector3(0, 0, 0);
                if (absDiff.x > absDiff.y && absDiff.x > absDiff.z) {
                    normal.x = Math.sign(diff.x);
                } else if (absDiff.y > absDiff.z) {
                    normal.y = Math.sign(diff.y);
                } else {
                    normal.z = Math.sign(diff.z);
                }

                return {
                    position: new Vector3(x, y, z),
                    normal: normal
                };
            }
        }
        return null;
    },

    start: () => {
        // Mouse look controls
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === engine.canvas) {
                const sensitivity = 0.005;
                camera.rotate(e.movementX * sensitivity, e.movementY * sensitivity);
            }
        });

        // Block placement/breaking controls
        document.addEventListener('mousedown', (e) => {
            if (document.pointerLockElement === engine.canvas) {
                const hit = playerController.raycast(camera.position, camera.getForwardVector(), 10);
                if (hit) {
                    if (e.button === 0) { // Left-click to break
                        world.setVoxel(hit.position.x, hit.position.y, hit.position.z, 0);
                    } else if (e.button === 2) { // Right-click to place
                        const placePos = hit.position.clone().add(hit.normal);
                        world.setVoxel(placePos.x, placePos.y, placePos.z, 4); // Place a new block type
                    }
                }
            }
        });
    },

    update: (deltaTime) => {
        const moveSpeed = 5 * deltaTime;

        // Movement
        if (input.getKey('KeyW')) {
            const forward = camera.getForwardVector();
            camera.position.add(forward.multiplyScalar(moveSpeed));
        }
        if (input.getKey('KeyS')) {
            const forward = camera.getForwardVector();
            camera.position.subtract(forward.multiplyScalar(moveSpeed));
        }
        if (input.getKey('KeyA')) {
            const right = camera.getRightVector();
            camera.position.subtract(right.multiplyScalar(moveSpeed));
        }
        if (input.getKey('KeyD')) {
            const right = camera.getRightVector();
            camera.position.add(right.multiplyScalar(moveSpeed));
        }
        if (input.getKey('Space')) {
            camera.position.y += moveSpeed;
        }
        if (input.getKey('ShiftLeft')) {
            camera.position.y -= moveSpeed;
        }
    }
};

engine.addGameObject(playerController);