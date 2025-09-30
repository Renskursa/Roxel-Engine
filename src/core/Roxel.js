import { Input } from './Input.js';
import { WebGLRenderer } from '../renderer/WebGLRenderer.js';
import { Camera } from './Camera.js';
import { Timing } from './Timing.js';
import { SceneLoader } from '../scenes/SceneLoader.js';
import { Scene } from '../scenes/Scene.js';

export class Roxel {
    #input;
    #renderTiming;
    #physicsTiming;
    #vsyncEnabled;
    #focusManager;
    #sceneLoader;

    constructor(canvasId) {
        // Initialize core systems
        this.#initializeCore(canvasId);
        
        // Initialize managers
        this.#initializeManagers();
        
        // Set up event listeners
        this.#setupEventListeners();
        
        // Initialize game state
        this.#initializeGameState();
        
        console.log('Roxel engine initialized');
    }

    #initializeCore(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.renderer = new WebGLRenderer(this.canvas);
        this.#input = new Input();
        this.#renderTiming = new Timing(60);
        this.#physicsTiming = new Timing(120);
        this.#vsyncEnabled = false;
        
        this.camera = new Camera();
        this.camera.setPerspective(Math.PI/4, this.canvas.width/this.canvas.height, 0.1, 1000);
        this.camera.setPosition(0, 5, -10);
        this.camera.lookAt(0, 0, 0);
    }

    #initializeManagers() {
        this.#sceneLoader = new SceneLoader(this);
        this.#focusManager = {
            isPointerLocked: false,
            isManaged: false,
            isEnabled: false
        };
    }

    #setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        window.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            this.stop();
            console.error('WebGL context lost');
        });

        window.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored - reinitializing...');
            this.renderer = new WebGLRenderer(this.canvas);
            this.start();
        });

        document.addEventListener('pointerlockchange', () => {
            this.#focusManager.isPointerLocked = document.pointerLockElement === this.canvas;
        });
    }

    #initializeGameState() {
        this.activeScene = new Scene();
        this.gameObjects = new Set();
        this.isRunning = false;
        this.lastTime = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        // Chunk management settings
        this.chunkLoadDistance = 8;
        this.chunkUpdateInterval = 500;
        this.lastChunkUpdate = 0;

        this._gameLoop = this._gameLoop.bind(this);
        this.#input.initialize();
        this.onResize();
    }

    _gameLoop(timestamp) {
        if (!this.isRunning) return;

        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        // Update timing systems
        this.#renderTiming.update(timestamp);
        this.#physicsTiming.update(timestamp);

        // Handle frame timing for vsync
        if (!this.#vsyncEnabled) {
            const frameDelay = 1000 / this.#renderTiming.targetFPS;
            if (timestamp - this.lastFrameTime < frameDelay) {
                requestAnimationFrame(this._gameLoop);
                return;
            }
        }
        this.lastFrameTime = timestamp;

        // Update systems
        this.#input.update();
        this.#updateGameObjects();
        this.#sceneLoader.update();
        this.#updateChunks(timestamp);
        
        // Render
        if (this.camera) {
            this.camera.update();
            if (this.activeScene) {
                this.renderer.render(this.activeScene, this.camera);
            }
        }

        // Schedule next frame
        if (this.#vsyncEnabled) {
            requestAnimationFrame(this._gameLoop);
        } else {
            const targetDelay = Math.max(0, 1000/this.#renderTiming.targetFPS - (performance.now() - timestamp));
            setTimeout(() => requestAnimationFrame(this._gameLoop), targetDelay);
        }
    }

    #updateGameObjects() {
        // Physics updates with scaled time
        let physicsIterations = 0;
        const physicsScaledDelta = this.#physicsTiming.getScaledDelta();
        
        while (this.#physicsTiming.getAccumulatedTime() >= this.#physicsTiming.targetFrameTime && 
               physicsIterations < 5) {
            this.gameObjects.forEach(obj => {
                obj.fixedUpdate?.(physicsScaledDelta);
            });
            this.#physicsTiming.consumeAccumulatedTime(this.#physicsTiming.targetFrameTime);
            physicsIterations++;
        }

        // Regular updates with scaled time
        const scaledDelta = this.#renderTiming.getScaledDelta();
        this.gameObjects.forEach(obj => {
            obj.earlyUpdate?.(scaledDelta);
            obj.update?.(scaledDelta);
            obj.lateUpdate?.(scaledDelta);
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        this.gameObjects.forEach(obj => {
            if (obj.awake) obj.awake();
        });

        this.gameObjects.forEach(obj => {
            if (obj.start) obj.start();
        });

        requestAnimationFrame(this._gameLoop);
    }

    stop() {
        this.isRunning = false;
    }

    addGameObject(gameObject) {
        gameObject.engine = this;
        this.gameObjects.add(gameObject);
        if (gameObject.mesh && gameObject.material) {
            this.activeScene.add(gameObject);
        }
        return gameObject;
    }

    removeGameObject(gameObject) {
        this.gameObjects.delete(gameObject);
        this.activeScene.remove(gameObject);
    }

    setGameFPS(fps) {
        this.#renderTiming.setTargetFPS(fps);
    }

    setVSync(enabled) {
        this.#vsyncEnabled = enabled;
        
        if (this.#vsyncEnabled) {
            this.canvas.setAttribute('style', 
                `${this.canvas.getAttribute('style') || ''}; image-rendering: pixelated;`);
        } else {
            this.canvas.setAttribute('style', 
                `${this.canvas.getAttribute('style') || ''}; image-rendering: auto;`);
        }
    }

    setPhysicsFPS(fps) {
        this.#physicsTiming.setTargetFPS(fps);
    }

    getCurrentFPS() {
        return this.#renderTiming.getCurrentFPS();
    }

    getAverageFrameTime() {
        return this.#renderTiming.getAverageFrameTime();
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setScene(scene) {
        if (!scene) return;
        const sceneName = scene.constructor.name;
        this.#sceneLoader.registerScene(sceneName, scene.constructor);
        this.#sceneLoader.loadScene(sceneName);
    }

    onResize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = '0';
            this.canvas.style.top = '0';
            
            console.log('[Roxel] Canvas resized:', {
                width: this.canvas.width,
                height: this.canvas.height,
                style: this.canvas.style.cssText
            });
            
            this.renderer.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.camera) {
                // Only update aspect ratio, not FOV
                this.camera.updateAspectRatio(this.canvas.width/this.canvas.height);
            }
            
            this.gameObjects.forEach(obj => {
                if (obj.onResize) obj.onResize(this.canvas.width, this.canvas.height);
            });
        }
    }

    enableFocusManager(enabled = true) {  // Changed default to true and fixed logic
        if (enabled && !this.#focusManager.isManaged) {
            this.#focusManager.isEnabled = true;
            this.#focusManager.isManaged = true;

            this.canvas.addEventListener('click', () => {
                if (!this.#focusManager.isPointerLocked && this.#focusManager.isEnabled) {
                    this.canvas.requestPointerLock();
                }
            });
            
            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        } else if (!enabled) {
            this.disableFocusManager();
        }
    }
    
    setFocusEnabled(enabled) {
        this.#focusManager.isEnabled = enabled;
        try {
            if (!enabled && this.#focusManager.isPointerLocked) {
                document.exitPointerLock();
            }
        } catch (e) {
            console.error('Failed to unlock pointer:', e);
        }
    }

    getFocusEnabled() {
        return this.#focusManager.isEnabled;
    }
    
    createGameObject(options = {}) {
        const obj = new GameObject();
        
        // Apply any provided options
        Object.assign(obj, options);
        
        obj.engine = this;
        this.gameObjects.add(obj);
        
        return obj;
    }

    // Add performance monitoring
    getStats() {
        return {
            renderer: this.renderer.stats,
            fps: this.#renderTiming.getCurrentFPS(),
            frameTime: this.#renderTiming.getAverageFrameTime(),
            objects: this.gameObjects.size
        };
    }

    getDeltaTime() {
        return this.deltaTime;
    }

    getScaledDeltaTime() {
        return this.#renderTiming.getScaledDelta();
    }

    setTimeScale(scale) {
        this.#renderTiming.setTimeScale(scale);
        this.#physicsTiming.setTimeScale(scale);
    }

    getInput() {
        return this.#input;
    }

    getAxis(axisName) {
        return this.#input.getAxis(axisName);
    }

    getAxisRaw(axisName) {
        return this.#input.getAxisRaw(axisName);
    }

    getKey(keyCode) {
        return this.#input.getKey(keyCode);
    }

    getKeyDown(keyCode) {
        return this.#input.getKeyDown(keyCode);
    }

    getKeyUp(keyCode) {
        return this.#input.getKeyUp(keyCode);
    }

    getMathUtils() {
        return MathUtils;
    }

    async loadPLY(url) {
        return PLYLoader.load(url);
    }

    createNoise(seed = Math.random()) {
        return new Noise(seed);
    }

    createMatrix4() {
        return new Matrix4();
    }

    createVoxel(x, y, z, type) {
        return new Voxel(x, y, z, type);
    }

    createChunk(x, y, z, size) {
        return new Chunk(x, y, z, size);
    }

    createVoxelMesh() {
        console.warn('createVoxelMesh() is deprecated');
        return null;
    }

    createSceneWorker() {
        return new SceneWorker();
    }

    // Add these new getter methods
    getRenderTiming() {
        return {
            targetFPS: this.#renderTiming.targetFPS,
            getCurrentFPS: () => this.#renderTiming.getCurrentFPS(),
            getAverageFrameTime: () => this.#renderTiming.getAverageFrameTime(),
            getScaledDelta: () => this.#renderTiming.getScaledDelta()
        };
    }

    getPhysicsTiming() {
        return {
            targetFPS: this.#physicsTiming.targetFPS,
            getCurrentFPS: () => this.#physicsTiming.getCurrentFPS(),
            getAverageFrameTime: () => this.#physicsTiming.getAverageFrameTime(),
            getScaledDelta: () => this.#physicsTiming.getScaledDelta()
        };
    }

    getFocusManager() {
        return {
            isEnabled: () => this.#focusManager.isEnabled,
            isPointerLocked: () => this.#focusManager.isPointerLocked,
            isManaged: () => this.#focusManager.isManaged
        };
    }

    get vsyncEnabled() {
        return this.#vsyncEnabled;
    }

    // Optional: Add scene management methods
    async loadScene(name) {
        return this.#sceneLoader.loadScene(name);
    }

    registerScene(name, sceneClass) {
        this.#sceneLoader.registerScene(name, sceneClass);
    }

    setChunkLoadDistance(distance) {
        this.chunkLoadDistance = distance;
    }

    setChunkUpdateInterval(interval) {
        this.chunkUpdateInterval = interval;
    }

    #updateChunks(timestamp) {
        if (timestamp - this.lastChunkUpdate > this.chunkUpdateInterval) {
            this.lastChunkUpdate = timestamp;

            if (this.activeScene && this.activeScene.world && this.camera) {
                const world = this.activeScene.world;
                const cameraPos = this.camera.position;
                const chunkSize = world.chunkSize;
                const currentChunkX = Math.floor(cameraPos.x / chunkSize);
                const currentChunkY = Math.floor(cameraPos.y / chunkSize);
                const currentChunkZ = Math.floor(cameraPos.z / chunkSize);

                for (let x = currentChunkX - this.chunkLoadDistance; x <= currentChunkX + this.chunkLoadDistance; x++) {
                    for (let y = currentChunkY - this.chunkLoadDistance; y <= currentChunkY + this.chunkLoadDistance; y++) {
                        for (let z = currentChunkZ - this.chunkLoadDistance; z <= currentChunkZ + this.chunkLoadDistance; z++) {
                            if (!world.getChunk(x, y, z)) {
                                world.createChunk(x, y, z);
                            }
                        }
                    }
                }
            }
        }
    }

    // Add proper cleanup
    destroy() {
        this.stop();
        this.gameObjects.clear();
        if (this.renderer) {
            this.renderer.dispose();
        }
        this.disableFocusManager();
        
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        this.canvas = null;
    }
}

export class GameObject {
    constructor() {
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = { x: 1, y: 1, z: 1 };
        this.engine = null;
    }

    awake() {}
    start() {}
    earlyUpdate() {}
    fixedUpdate() {}
    update() {}
    lateUpdate() {}
    onDestroy() {}
    onEnable() {}
    onDisable() {}
    onCollision() {}
    onTrigger() {}
    onResize() {}
}