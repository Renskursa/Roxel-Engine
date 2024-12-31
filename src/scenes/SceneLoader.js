export class SceneLoader {
    constructor(engine) {
        this.engine = engine;
        this.currentScene = null;
        this.nextScene = null;
        this.isLoading = false;
        this.sceneRegistry = new Map();
    }

    registerScene(name, sceneClass) {
        this.sceneRegistry.set(name, sceneClass);
    }

    async loadScene(name) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const SceneClass = this.sceneRegistry.get(name);
            if (!SceneClass) {
                throw new Error(`Scene '${name}' not found in registry`);
            }

            if (this.currentScene) {
                await this.currentScene.unload();
                this.engine.clear();
            }

            const newScene = new SceneClass();
            newScene.engine = this.engine;
            
            await newScene.load();
            
            this.currentScene = newScene;
            
            await this.currentScene.awake();
            
            console.log(`Scene '${name}' loaded successfully`);
        } catch (error) {
            console.error('Error loading scene:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    update() {
        if (this.currentScene && !this.isLoading) {
            this.currentScene.update();
        }
    }
}
