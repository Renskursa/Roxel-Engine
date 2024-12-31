export class Timing {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.targetFrameTime = 1000 / targetFPS;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.frameTimeHistory = new Array(30).fill(this.targetFrameTime);
        this.currentFPS = targetFPS;
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();
        this.lastFrameTime = performance.now();
    }

    update(currentTime) {
        // Prevent spiral of death with frame time limiting
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        const targetFrameTime = 1000 / this.targetFPS;
        const limitedDelta = Math.min(deltaTime, targetFrameTime);
        
        this.frameTimeHistory.push(limitedDelta);
        this.frameTimeHistory.shift();
        this.frameCount++;

        if (currentTime - this.fpsUpdateTime >= 1000) {
            const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
            this.currentFPS = Math.round(1000 / avgFrameTime);
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        this.accumulator += limitedDelta;
        return limitedDelta;
    }

    getAccumulatedTime() {
        return this.accumulator;
    }

    consumeAccumulatedTime(amount) {
        this.accumulator -= amount;
    }

    getCurrentFPS() {
        return this.currentFPS;
    }

    getAverageFrameTime() {
        return this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
    }

    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.targetFrameTime = 1000 / fps;
    }
}
