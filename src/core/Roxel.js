import { Scene } from '../scenes/Scene.js';
import { Input } from './Input.js';
import { WebGLRenderer } from '../renderer/WebGLRenderer.js';
import { Camera } from './Camera.js';
import { WorldManager } from './WorldManager.js';
import { Timing } from './Timing.js';

export class Roxel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.renderer = new WebGLRenderer(this.canvas);
        this.worldManager = new WorldManager(this.renderer);
        this.activeScene = new Scene();
        this.gameObjects = new Set();
        this.isRunning = false;
        this.lastFrameTime = 0;
        
        this.camera = new Camera();
        this.camera.setPerspective(
            Math.PI/4,
            this.canvas.width/this.canvas.height,
            0.1,
            100
        );
        
        Input.initialize();
        this.onResize();
        window.addEventListener('resize', () => this.onResize());
        this._gameLoop = this._gameLoop.bind(this);

        this.debugWireframe = false;
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                this.debugWireframe = !this.debugWireframe;
                this.renderer.setWireframeMode(this.debugWireframe);
            }
        });

        this.isFocusManaged = false;
        this.isPointerLocked = false;
        this.focusEnabled = false;
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });

        this.renderTiming = new Timing(60);
        this.physicsTiming = new Timing(120);
        this.vsyncEnabled = true;

        console.log('Roxel engine initialised: ', this);
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

    getWorldManager() {
        return this.worldManager;
    }

    setTargetFPS(fps) {
        this.renderTiming.setTargetFPS(fps);
        console.log(`Render FPS target set to ${fps}`);
    }

    setVSync(enabled) {
        this.vsyncEnabled = enabled;
        console.log(`VSync: ${this.vsyncEnabled ? 'Enabled' : 'Disabled'}`);
        
        if (this.vsyncEnabled) {
            this.canvas.setAttribute('style', 
                `${this.canvas.getAttribute('style') || ''}; image-rendering: pixelated;`);
        } else {
            this.canvas.setAttribute('style', 
                `${this.canvas.getAttribute('style') || ''}; image-rendering: auto;`);
        }
    }

    setPhysicsFPS(fps) {
        this.physicsTiming.setTargetFPS(fps);
        console.log(`Physics FPS target set to ${fps}`);
    }

    getCurrentFPS() {
        return this.renderTiming.getCurrentFPS();
    }

    getAverageFrameTime() {
        return this.renderTiming.getAverageFrameTime();
    }

    _gameLoop(timestamp) {
        if (!this.isRunning) return;

        const renderDelta = this.renderTiming.update(timestamp);
        const physicsDelta = this.physicsTiming.update(timestamp);

        const frameDelay = 1000 / this.renderTiming.targetFPS;
        const timeSinceLastRender = timestamp - this.lastFrameTime;

        if (!this.vsyncEnabled && timeSinceLastRender < frameDelay) {
            requestAnimationFrame(this._gameLoop);
            return;
        }

        this.lastFrameTime = timestamp;

        let physicsIterations = 0;
        const maxPhysicsIterations = 5;
        
        while (this.physicsTiming.getAccumulatedTime() >= this.physicsTiming.targetFrameTime && 
               physicsIterations < maxPhysicsIterations) {
            this.gameObjects.forEach(obj => {
                if (obj.fixedUpdate) {
                    obj.fixedUpdate(this.physicsTiming.targetFrameTime / 1000);
                }
            });
            this.physicsTiming.consumeAccumulatedTime(this.physicsTiming.targetFrameTime);
            physicsIterations++;
        }

        const deltaTime = renderDelta / 1000;
        
        this.gameObjects.forEach(obj => {
            if (obj.earlyUpdate) obj.earlyUpdate(deltaTime);
            if (obj.update) obj.update(deltaTime);
            if (obj.lateUpdate) obj.lateUpdate(deltaTime);
        });

        Input.update();

        if (this.activeScene && this.camera) {
            this.renderer.render(this.activeScene, this.camera);
        }

        this.renderTiming.consumeAccumulatedTime(this.renderTiming.targetFrameTime);

        if (this.vsyncEnabled) {
            requestAnimationFrame(this._gameLoop);
        } else {
            const targetDelay = Math.max(0, frameDelay - (performance.now() - timestamp));
            setTimeout(() => requestAnimationFrame(this._gameLoop), targetDelay);
        }
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setScene(scene) {
        this.activeScene = scene;
    }

    onResize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = '0';
            this.canvas.style.top = '0';
            
            this.renderer.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.camera) {
                this.camera.setPerspective(
                    Math.PI/4,
                    this.canvas.width/this.canvas.height,
                    0.1,
                    100
                );
            }
            
            this.gameObjects.forEach(obj => {
                if (obj.onResize) obj.onResize(this.canvas.width, this.canvas.height);
            });
        }
    }

    enableFocusManager() {
        if (this.isFocusManaged || !this.focusEnabled) return;
        this.isFocusManaged = true;

        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked && this.focusEnabled) {
                this.canvas.requestPointerLock();
            }
        });

        this.canvas.style.cursor = 'none';
        this.canvas.style.outline = 'none';
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        console.log('Focus manager enabled');
    }

    disableFocusManager() {
        if (!this.isFocusManaged) return;
        this.isFocusManaged = false;

        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        }

        this.canvas.style.cursor = 'auto';

        console.log('Focus manager disabled');
    }
    
    setFocusEnabled(enabled) {
        this.focusEnabled = enabled;
        if (!enabled && this.isPointerLocked) {
            document.exitPointerLock();
        }
    }

    getFocusEnabled() {
        return this.focusEnabled;
    }
    
    get worldManager() {
        return this._worldManager;
    }
    
    set worldManager(manager) {
        this._worldManager = manager;
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
