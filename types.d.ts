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
        chunkLoadDistance: number;
        chunkUpdateInterval: number;
        lastChunkUpdate: number;
        setChunkLoadDistance(distance: number): void;
        setChunkUpdateInterval(interval: number): void;
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
        renderer: WebGLRenderer;
        vertices: Float32Array;
        colors: Float32Array;
        normals: Float32Array;
        indices: Uint32Array;
        vertexCount: number;
        indexCount: number;

        constructor(renderer: WebGLRenderer);
        reset(): this;
        setGradientMode(mode: 'individual' | 'group'): void;
        addFace(x: number, y: number, z: number, vertices: number[], colors: number[]): void;
        addVoxel(chunk: Chunk, x: number, y: number, z: number): void;
        calculateFaceNormal(vertices: number[]): number[];
        build(): MeshBuffers;
        static scaleToVoxelSize(vertices: number[], targetVoxelSize?: number): {
            vertices: number[];
            scaleFactor: number;
            boundingBox: BoundingBox;
            dimensions: number[];
        };
    }

    export class WebGLRenderer {
        constructor(canvas: HTMLCanvasElement);
        setWireframeMode(enabled: boolean): void;
        clear(): void;
        render(scene: Scene, camera: Camera): void;
        createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram;
        createBuffer(data: ArrayBuffer, target?: number): WebGLBuffer;
        createFramebuffer(width: number, height: number): WebGLFramebuffer;
        createDepthTexture(width: number, height: number): WebGLTexture;
        setShadowMap(texture: WebGLTexture): void;
    }

    export class Voxel {
        x: number;
        y: number;
        z: number;
        type: number;
        visible: boolean;
        light: number;
        groupId: number | null;
        color: Color | null;
        properties: VoxelProperties | null;
        visibleFaces: {
            front: boolean;
            back: boolean;
            top: boolean;
            bottom: boolean;
            right: boolean;
            left: boolean;
        };
        constructor(x: number, y: number, z: number, type: number, properties?: VoxelProperties | null);
        setColor(r: number, g: number, b: number, a?: number): this;
        setGradient(color1: number[], color2: number[], direction?: string): this;
        updateVisibility(neighbors: Voxel[]): void;
        updateVisibleFaces(neighbors: Record<string, Voxel | null>): void;
        getPositionHash(): string;
        isSolid(): boolean;
        isTransparent(): boolean;
        clone(): Voxel;
        getColor(): number[];
        getVariantColor(variant?: number): number[];
    }

    export class Color {
        values: Float32Array;
        constructor(r?: number, g?: number, b?: number, a?: number);
        static fromArray(arr: number[]): Color;
        static fromRGB(r: number, g: number, b: number, a?: number): Color;
        static fromHex(hex: string): Color;
        toArray(): number[];
        toRGB(): { r: number; g: number; b: number; a: number };
        toHex(): string;
        [Symbol.iterator](): Iterator<number>;
        r: number;
        g: number;
        b: number;
        a: number;
    }

    export interface VoxelProperties {
        solid?: boolean;
        transparent?: boolean;
        variants?: number[][];
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
        voxelTypes: Uint8Array;
        voxelData: Uint32Array;
        voxelColors: Float32Array;
        voxelVisibility: Uint8Array;
        isDirty: boolean;
        creationTime: number;
        hasInitializedAnimation: boolean;

        constructor(x?: number, y?: number, z?: number, size?: number);
        getIndex(x: number, y: number, z: number): number;
        setVoxel(x: number, y: number, z: number, voxel: Voxel): boolean;
        getVoxel(x: number, y: number, z: number): Voxel | null;
        isInBounds(x: number, y: number, z: number): boolean;
        updateVoxelVisibility(neighborChunks?: Record<string, Chunk | null>): void;
        getNeighbors(x: number, y: number, z: number, neighborChunks: Record<string, Chunk | null>): Record<string, Voxel | null>;
        calculateVisibilityFlags(neighbors: Record<string, Voxel | null>): number;
        serialize(): ChunkData;
        static deserialize(data: ChunkData): Chunk;
    }

    export interface ChunkData {
        x: number;
        y: number;
        z: number;
        size: number;
        voxelTypes: number[];
        voxelData: number[];
        voxelColors: number[];
        voxelVisibility: number[];
    }

    export class ChunkManager {
        worldManager: WorldManager;
        chunkSize: number;
        loadDistance: number;
        regions: Map<string, Map<string, Chunk>>;
        activeChunks: Map<string, Chunk>;
        chunkCache: Map<string, Chunk>;
        maxCacheSize: number;
        loadQueue: string[];
        unloadQueue: string[];
        loadingPriority: Map<string, number>;
        isProcessing: boolean;
        lastUpdateTime: number;
        updateInterval: number;
        maxChunksPerFrame: number;
        lastPlayerChunk: { x: number; y: number; z: number };
        loadingBoundary: number;

        constructor(worldManager: WorldManager, chunkSize?: number, loadDistance?: number);
        getRegionKey(chunkX: number, chunkY: number, chunkZ: number): string;
        updateChunks(playerPosition: Vector3): void;
        calculateChunkUpdates(centerChunk: { x: number; y: number; z: number }): void;
        processQueues(): Promise<void>;
        loadChunk(key: string): Promise<void>;
        unloadChunk(key: string): Promise<void>;
        generateChunkData(chunk: Chunk): Promise<Chunk>;
        getLoadedChunks(): Chunk[];
        getChunkAt(x: number, y: number, z: number): Chunk | undefined;
        clearCache(): void;
        getStats(): ChunkManagerStats;
    }

    export interface ChunkManagerStats {
        activeChunks: number;
        cachedChunks: number;
        loadQueueSize: number;
        unloadQueueSize: number;
        isProcessing: boolean;
        regions: number;
    }

    export class WorldManager {
        chunks: Map<string, Chunk>;
        objects: Map<string, any>;
        chunkSize: number;
        renderer: WebGLRenderer | null;
        chunkManager: ChunkManager;
        onChunkLoaded: Set<(chunk: Chunk) => void>;
        onChunkUnloaded: Set<(chunk: Chunk) => void>;
        objectPositions: Map<string, Vector3>;
        
        constructor(renderer?: WebGLRenderer | null);
        addChunkLoadListener(callback: (chunk: Chunk) => void): void;
        removeChunkLoadListener(callback: (chunk: Chunk) => void): void;
        notifyChunkLoaded(chunk: Chunk): void;
        reconnectRenderer(renderer: WebGLRenderer): void;
        getChunk(chunkX: number, chunkY: number, chunkZ: number): Chunk | undefined;
        addChunk(chunk: Chunk): void;
        getVoxel(worldX: number, worldY: number, worldZ: number): Voxel | null;
        worldToChunkCoords(worldX: number, worldY: number, worldZ: number): { x: number; y: number; z: number };
        worldToLocalCoords(worldX: number, worldY: number, worldZ: number): { x: number; y: number; z: number };
        updateChunkVisibility(): void;
        getCombinedMesh(chunks?: Map<string, Chunk> | null): MeshBuffers;
        setRenderer(renderer: WebGLRenderer): void;
        updateChunksAroundPlayer(playerPosition: Vector3): void;
        getLoadedChunks(): Chunk[];
        setChunkLoadDistance(distance: number): void;
        trackObject(obj: { id: string; position: Vector3 }): void;
        untrackObject(obj: { id: string }): void;
        updatePosition(obj: { id: string; position: Vector3 }): void;
        getPosition(obj: { id: string }): Vector3 | null;
        findInRadius(center: Vector3, radius: number): string[];
        findInBox(min: Vector3, max: Vector3): string[];
        findNearest(point: Vector3, maxDist?: number): string | null;
        getDistance(a: Vector3, b: Vector3): number;
        isInBox(pos: Vector3, min: Vector3, max: Vector3): boolean;
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
        shadowMap: WebGLTexture | null;
        shadowMatrix: Matrix4;
        constructor(type?: 'directional' | 'point' | 'spot');
        setShadowProjection(left: number, right: number, bottom: number, top: number, near: number, far: number): void;
    }

    export class LightingSystem {
        lights: Light[];
        ambientLight: { color: number[]; intensity: number };
        constructor();
        addLight(light: Light): void;
        removeLight(light: Light): void;
        setAmbientLight(color: number[], intensity: number): void;
    }

    export class GradientUtils {
        static DEG_TO_RAD: number;
        static calculateGradientVector(angle: number): { x: number; y: number };
    }

    export enum GradientType {
        LINEAR_X = 'linear_x',
        LINEAR_Y = 'linear_y',
        LINEAR_Z = 'linear_z',
        ANGULAR = 'angular',
        LINEAR_ANGLE = 'linear_angle'
    }

    export class SceneLoader {
        constructor(engine: Roxel);
        engine: Roxel;
        currentScene: Scene | null;
        nextScene: Scene | null;
        isLoading: boolean;
        sceneRegistry: Map<string, typeof Scene>;
        registerScene(name: string, sceneClass: typeof Scene): void;
        loadScene(name: string): Promise<void>;
        update(): void;
    }
}

interface Vector3 {
    x: number;
    y: number;
    z: number;
}
