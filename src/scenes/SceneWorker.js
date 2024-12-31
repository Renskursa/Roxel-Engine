export class SceneWorker {
    constructor() {
        this.workers = new Map();
        this.tasks = new Map();
        this.taskId = 0;
    }

    createWorker(name, workerScript) {
        try {
            const worker = new Worker(workerScript, { type: 'module' });
            
            worker.onmessage = (e) => this.handleWorkerMessage(name, e);
            worker.onerror = (e) => this.handleWorkerError(name, e);
            
            this.workers.set(name, worker);
            
            return true;
        } catch (error) {
            console.error(`Failed to create worker ${name}:`, error);
            return false;
        }
    }

    async executeTask(workerName, taskType, data) {
        const worker = this.workers.get(workerName);
        if (!worker) {
            throw new Error(`Worker ${workerName} not found`);
        }

        const taskId = this.taskId++;
        
        return new Promise((resolve, reject) => {
            this.tasks.set(taskId, { resolve, reject });
            
            worker.postMessage({
                taskId,
                type: taskType,
                data
            });
        });
    }

    handleWorkerMessage(workerName, event) {
        const { taskId, result, error } = event.data;
        
        const task = this.tasks.get(taskId);
        if (task) {
            if (error) {
                task.reject(error);
            } else {
                task.resolve(result);
            }
            this.tasks.delete(taskId);
        }
    }

    handleWorkerError(workerName, error) {
        console.error(`Worker ${workerName} error:`, error);
    }

    terminateWorker(name) {
        const worker = this.workers.get(name);
        if (worker) {
            worker.terminate();
            this.workers.delete(name);
        }
    }

    terminateAll() {
        for (const [name] of this.workers) {
            this.terminateWorker(name);
        }
        this.tasks.clear();
    }
}
