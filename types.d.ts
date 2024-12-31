declare module 'roxel-engine' {
    export class Roxel {
        constructor(canvasId: string);
        start(): void;
        stop(): void;
        setCamera(camera: Camera): void;
        setScene(scene: Scene): void;
        addGameObject(obj: GameObject): GameObject;
        removeGameObject(obj: GameObject): void;
        enableFocusManager(): void;
        disableFocusManager(): void;
        setTargetFPS(fps: number): void;
        getCurrentFPS(): number;
    }

    export class GameObject {
        position: Vector3;
        rotation: Vector3;
        scale: Vector3;
        awake(): void;
        start(): void;
        update(deltaTime: number): void;
        fixedUpdate(fixedDeltaTime: number): void;
    }

    export class Camera {
        position: Vector3;
        rotation: Vector3;
        fov: number;
        setPerspective(fov: number, aspect: number, near: number, far: number): void;
        lookAt(target: Vector3): void;
    }

    export class Scene {
        children: any[];
        objects: any[];
        engine: Roxel | null;
        add(object: any): boolean;
        remove(object: any): void;
        clear(): void;
        load(): Promise<void>;
        unload(): Promise<void>;
        awake(): void;
        update(): void;
    }

    export class SceneWorker {
        constructor();
        createWorker(name: string, workerScript: string): boolean;
        executeTask(workerName: string, taskType: string, data: any): Promise<any>;
        terminateWorker(name: string): void;
        terminateAll(): void;
    }

    export class Noise {
        constructor(seed?: number);
        noise2D(x: number, y: number): number;
        noise3D(x: number, y: number, z: number): number;
    }

    export class VoxelMesh {
        constructor(renderer: WebGLRenderer);
        reset(): this;
        setGradientMode(mode: 'individual' | 'group'): void;
        addFace(x: number, y: number, z: number, vertices: number[], colors: number[]): void;
        addVoxel(voxel: Voxel): void;
        build(): MeshBuffers;
    }

    export class WebGLRenderer {
        constructor(canvas: HTMLCanvasElement);
        setWireframeMode(enabled: boolean): void;
        clear(): void;
        render(scene: Scene, camera: Camera): void;
        createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram;
        createBuffer(data: ArrayBuffer, target?: number): WebGLBuffer;
    }

    export class Voxel {
        x: number;
        y: number;
        z: number;
        type: number;
        visible: boolean;
        light: number;
        groupId: number | null;
        visibleFaces: {
            front: boolean;
            back: boolean;
            top: boolean;
            bottom: boolean;
            right: boolean;
            left: boolean;
        };
        constructor(x: number, y: number, z: number, type: number, groupId?: number | null);
        setColor(r: number, g: number, b: number, a?: number): this;
        setGradient(color1: number[], color2: number[], direction?: string): this;
        updateVisibleFaces(neighbors: Record<string, Voxel | null>): void;
        isSolid(): boolean;
        getColor(): number[];
    }

    interface MeshBuffers {
        vertexBuffer: WebGLBuffer;
        colorBuffer: WebGLBuffer;
        indexBuffer: WebGLBuffer;
        edgeBuffer: WebGLBuffer;
        normalBuffer: WebGLBuffer;
        indexCount: number;
        vertexCount: number;
        edgeCount: number;
    }

    export class Matrix4 {
        elements: Float32Array;
        constructor();
        identity(): this;
        perspective(fov: number, aspect: number, near: number, far: number): this;
        translate(x: number, y: number, z: number): this;
        rotateX(angle: number): this;
        rotateY(angle: number): this;
        rotateZ(angle: number): this;
        multiply(other: Matrix4): this;
        static multiply(a: Matrix4, b: Matrix4): Matrix4;
    }

    export class RenderableEntity {
        position: Vector3;
        rotation: Vector3;
        scale: Vector3;
        mesh: MeshBuffers | null;
        material: any | null;
        setMesh(mesh: MeshBuffers): void;
        setMaterial(material: any): void;
    }

    export class Vector3 {
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
        normalize(): this;
        dot(other: Vector3): number;
        static add(a: Vector3, b: Vector3): Vector3;
        static subtract(a: Vector3, b: Vector3): Vector3;
        static multiply(a: Vector3, scalar: number): Vector3;
        static cross(a: Vector3, b: Vector3): Vector3;
        static distance(a: Vector3, b: Vector3): number;
        static fromArray(array: number[]): Vector3;
        static toArray(vector: Vector3): number[];
    }

    export class Chunk {
        x: number;
        y: number;
        z: number;
        size: number;
        voxels: Map<string, Voxel>;
        isDirty: boolean;
        constructor(x?: number, y?: number, z?: number, size?: number);
        setVoxel(x: number, y: number, z: number, voxel: Voxel): boolean;
        getVoxel(x: number, y: number, z: number): Voxel | undefined;
        isInBounds(x: number, y: number, z: number): boolean;
        updateVoxelVisibility(neighborChunks?: Record<string, Chunk | null>): void;
    }

    export class WorldManager {
        chunks: Map<string, Chunk>;
        objects: Map<string, any>;
        chunkSize: number;
        renderer: WebGLRenderer | null;
        constructor(renderer?: WebGLRenderer | null);
        getChunk(chunkX: number, chunkY: number, chunkZ: number): Chunk | undefined;
        addChunk(chunk: Chunk): void;
        getVoxel(worldX: number, worldY: number, worldZ: number): Voxel | null;
        worldToChunkCoords(worldX: number, worldY: number, worldZ: number): { x: number; y: number; z: number };
        worldToLocalCoords(worldX: number, worldY: number, worldZ: number): { x: number; y: number; z: number };
        updateChunkVisibility(): void;
        getCombinedMesh(chunks?: Map<string, Chunk> | null): MeshBuffers;
        setRenderer(renderer: WebGLRenderer): void;
    }

    export class Timing {
        targetFPS: number;
        currentFPS: number;
        constructor(targetFPS?: number);
        update(currentTime: number): number;
        getAccumulatedTime(): number;
        consumeAccumulatedTime(amount: number): void;
        getCurrentFPS(): number;
        getAverageFrameTime(): number;
        setTargetFPS(fps: number): void;
    }

    export class Input {
        static MOUSE_BUTTON_LEFT: number;
        static MOUSE_BUTTON_RIGHT: number;
        static MOUSE_BUTTON_MIDDLE: number;
        static initialize(): void;
        static update(): void;
        static isPressed(input: string): boolean;
        static isJustPressed(input: string): boolean;
        static isJustReleased(input: string): boolean;
        static addAction(name: string, inputs: string[]): void;
        static addAxis(name: string, positiveAction: string, negativeAction: string): void;
        static clearActions(): void;
        static isActionPressed(action: string): boolean;
        static isActionHeld(action: string): boolean;
        static isActionReleased(action: string): boolean;
        static getMousePosition(): { x: number; y: number };
        static getMouseMotion(): { x: number; y: number };
        static getMouseWheelDelta(): number;
        static getAxisValue(axisName: string): number;
    }

    export class Light {
        type: 'directional' | 'point' | 'spot';
        position: Vector3;
        direction: Vector3;
        color: number[];
        intensity: number;
        constructor(type?: 'directional' | 'point' | 'spot');
    }

    export class LightingSystem {
        lights: Light[];
        ambientLight: { color: number[]; intensity: number };
        constructor();
        addLight(light: Light): void;
        removeLight(light: Light): void;
        setAmbientLight(color: number[], intensity: number): void;
    }
}

interface Vector3 {
    x: number;
    y: number;
    z: number;
}
