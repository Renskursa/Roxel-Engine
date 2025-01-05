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

            // End current scene if exists
            if (this.currentScene) {
                await this.currentScene.onSceneEnd();
                await this.currentScene.onSceneUnload();
                this.engine.clear();
            }

            const newScene = new SceneClass();
            newScene.engine = this.engine;
            
            // Use scene-specific lifecycle methods
            await newScene.onSceneLoad();
            this.currentScene = newScene;
            // Set the active scene in the engine
            this.engine.activeScene = this.currentScene;
            await this.currentScene.onSceneStart();
            
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
