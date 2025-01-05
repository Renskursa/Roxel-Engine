import { Entity } from "./Entity";
import { RenderableComponent } from "../components/RenderableComponent";
import { Color } from "../utils/ColorUtils";

class VoxelChunkRenderComponent extends RenderableComponent {
    constructor() {
        super();
        this.instanceData = null;
    }

    generateRenderData() {
        const chunk = this.entity;
        if (!chunk._isDirty && this.instanceData) {
            return { id: chunk.id, instances: this.instanceData };
        }

        const instances = [];
        const maxInstances = 512; // Reduced from 2048 to prevent buffer overflow
        let visibleCount = 0;

        // First pass: Count visible blocks
        for (let y = 0; y <= chunk.yMax && visibleCount < maxInstances; y++) {
            for (let z = 0; z <= chunk.zMax && visibleCount < maxInstances; z++) {
                for (let x = 0; x <= chunk.xMax && visibleCount < maxInstances; x++) {
                    const idx = chunk.coordToIndex(x, y, z);
                    if (chunk.cells[idx] !== 1) continue;
                    if (chunk.isFullyOccludedWithNeighbors(x, y, z)) continue;
                    visibleCount++;
                }
            }
        }

        // Early exit if no visible blocks
        if (visibleCount === 0) {
            this.instanceData = [];
            chunk._isDirty = false;
            return { id: chunk.id, instances: [] };
        }

        // Calculate LOD based on visible count
        const skipFactor = Math.max(1, Math.ceil(visibleCount / maxInstances));

        // Generate instances with LOD
        for (let y = 0; y <= chunk.yMax; y += skipFactor) {
            for (let z = 0; z <= chunk.zMax; z += skipFactor) {
                for (let x = 0; x <= chunk.xMax; x += skipFactor) {
                    if (instances.length >= maxInstances) break;

                    const idx = chunk.coordToIndex(x, y, z);
                    if (chunk.cells[idx] !== 1) continue;
                    if (chunk.isFullyOccludedWithNeighbors(x, y, z)) continue;

                    const worldX = x * chunk.scale + chunk.position.x;
                    const worldY = y * chunk.scale + chunk.position.y;
                    const worldZ = z * chunk.scale + chunk.position.z;

                    // Distance check
                    const camera = chunk.scene?.engine?.camera;
                    const cameraPos = camera?.position;
                    if (cameraPos) {
                        const dx = worldX - cameraPos.x;
                        const dy = worldY - cameraPos.y;
                        const dz = worldZ - cameraPos.z;
                        const distSq = dx * dx + dy * dy + dz * dz;
                        if (distSq > 16384) continue;
                    }

                    instances.push({
                        position: [worldX, worldY, worldZ],
                        color: [
                            chunk.cellColors[idx * 4],
                            chunk.cellColors[idx * 4 + 1],
                            chunk.cellColors[idx * 4 + 2],
                            chunk.cellColors[idx * 4 + 3]
                        ],
                        ao: chunk.calculateAO(x, y, z),
                        normal: chunk.getFaceNormal(x, y, z)
                    });
                }
            }
        }

        this.instanceData = instances;
        chunk._isDirty = false;
        return { id: chunk.id, instances: this.instanceData };
    }
}

export class VoxelChunk extends Entity {
    static NORTH = 0;
    static EAST = 1;
    static SOUTH = 2;
    static WEST = 3;
    static UP = 4;
    static DOWN = 5;

    // Also change the INDEX order to match correct winding
    static INDEX = [0,2,1,0,3,2];

    // Faces in the order of back, right, front left, top, bottom
    static FACES = [
        {   n:[0.0,0.0,-1.0],  // BACK
            v:[0.0, 0.0, 0.0, 0.0,
               0.0, 1.0, 0.0, 1.0,
               1.0, 1.0, 0.0, 2.0,
               1.0, 0.0, 0.0, 3.0] },

        {   n:[1.0,0.0,0.0],   // RIGHT
            v:[1.0, 0.0, 0.0, 0.0,
               1.0, 1.0, 0.0, 1.0,
               1.0, 1.0, 1.0, 2.0,
               1.0, 0.0, 1.0, 3.0] },
     
        {   n:[0.0,0.0,1.0],   // FRONT
            v:[0.0, 0.0, 1.0, 0.0,
               1.0, 0.0, 1.0, 1.0,
               1.0, 1.0, 1.0, 2.0,
               0.0, 1.0, 1.0, 3.0] },

        {   n:[-1.0,0.0,0.0],  // LEFT
            v:[0.0, 0.0, 1.0, 0.0,
               0.0, 1.0, 1.0, 1.0,
               0.0, 1.0, 0.0, 2.0,
               0.0, 0.0, 0.0, 3.0] },
               
        {   n:[0.0,1.0,0.0],   // TOP
            v:[0.0, 1.0, 0.0, 0.0,
               0.0, 1.0, 1.0, 1.0,
               1.0, 1.0, 1.0, 2.0,
               1.0, 1.0, 0.0, 3.0] },

        {   n:[0.0,-1.0,0.0],  // BOTTOM
            v:[0.0, 0.0, 0.0, 0.0,
               1.0, 0.0, 0.0, 1.0,
               1.0, 0.0, 1.0, 2.0,
               0.0, 0.0, 1.0, 3.0] },
    ];

    static nextId = 0;
    static bufferPool = null;  // Will be initialized by engine

    constructor(x=2, y=2, z=2) {
        super();
        this.scale = 1.0;
        this.xLen = x;
        this.yLen = y;
        this.zLen = z;

        this.xMax = (x != 0) ? x-1 : 0;
        this.yMax = (y != 0) ? y-1 : 0;
        this.zMax = (z != 0) ? z-1 : 0;

        this.xzLen = x * z;
        const totalCells = x * y * z;
        
        // Use TypedArrays for better performance
        this.cells = new Uint8Array(totalCells);  // 0-255 is enough for block types
        this.cellColors = new Float32Array(totalCells * 4);  // RGBA colors
        
        // Preallocate render buffers
        this.cachedVertices = null;
        this.cachedColors = null;
        this.vertexCount = 0;

        this._isDirty = true;

        // Add unique ID for buffer caching
        this.id = VoxelChunk.nextId++;
        
        // Add strict limits for buffer sizes
        this.MAX_VERTICES_PER_CHUNK = 32768; // Limit maximum vertices
        this.MAX_INSTANCE_COUNT = 2048;    // Limit maximum instances

        // Add strict instance limits
        this.MAX_INSTANCES = 512; // Reduce from 2048 to 512
        this.currentInstanceCount = 0;
        
        // Buffer size calculations
        const predictedInstanceCount = Math.min(x * y * z, this.MAX_INSTANCES);
        const instanceDataSize = predictedInstanceCount * 8; // 3 for position, 4 for color, 1 for ao
        
        // Use buffer pool with predictable sizes
        if (VoxelChunk.bufferPool) {
            const buffers = VoxelChunk.bufferPool.acquireBuffers(instanceDataSize);
            this.preallocatedVertices = buffers.vertices;
            this.preallocatedColors = buffers.colors;
        } else {
            // Conservative fallback allocation
            const fallbackSize = Math.min(instanceDataSize, 4096);
            this.preallocatedVertices = new Float32Array(fallbackSize);
            this.preallocatedColors = new Float32Array(fallbackSize);
        }

        // Add render component
        this.renderComponent = this.addComponent(new VoxelChunkRenderComponent());
        this.visible = true;
    }

    // Add neighboring chunks
    neighbors = {
        px: null, // positive x
        nx: null, // negative x
        pz: null, // positive z
        nz: null  // negative z
    };

    get(x, y, z, dir = -1) {
        // Check local chunk first
        if (x >= 0 && x <= this.xMax && y >= 0 && y <= this.yMax && z >= 0 && z <= this.zMax) {
            return this.cells[this.coordToIndex(x, y, z)];
        }

        // If out of bounds, check neighboring chunks
        if (x < 0 && this.neighbors.nx) {
            return this.neighbors.nx.get(this.xMax + x, y, z);
        }
        if (x > this.xMax && this.neighbors.px) {
            return this.neighbors.px.get(x - this.xMax - 1, y, z);
        }
        if (z < 0 && this.neighbors.nz) {
            return this.neighbors.nz.get(x, y, this.zMax + z);
        }
        if (z > this.zMax && this.neighbors.pz) {
            return this.neighbors.pz.get(x, y, z - this.zMax - 1);
        }

        // If no neighbor exists, treat as empty space
        return null;
    }

    set(x, y, z, value) {
        if (x < 0 || x > this.xMax || y < 0 || y > this.yMax || z < 0 || z > this.zMax) {
            return false;
        }
        this.cells[this.coordToIndex(x, y, z)] = value;
        this._isDirty = true;
        return true;
    }

    setColor(x, y, z, r, g, b, a = 1.0) {
        if (x < 0 || x > this.xMax || y < 0 || y > this.yMax || z < 0 || z > this.zMax) {
            return false;
        }

        const index = this.coordToIndex(x, y, z) * 4;
        
        if (r instanceof Color) {
            const color = r.toArray();
            this.cellColors[index] = color[0];
            this.cellColors[index + 1] = color[1];
            this.cellColors[index + 2] = color[2];
            this.cellColors[index + 3] = color[3];
        } else {
            this.cellColors[index] = r;
            this.cellColors[index + 1] = g;
            this.cellColors[index + 2] = b;
            this.cellColors[index + 3] = a;
        }

        this._isDirty = true;
        return true;
    }

    getColor(x, y, z) {
        if (x < 0 || x > this.xMax || y < 0 || y > this.yMax || z < 0 || z > this.zMax) {
            return null;
        }
        const index = this.coordToIndex(x, y, z) * 4;
        return [
            this.cellColors[index],
            this.cellColors[index + 1],
            this.cellColors[index + 2],
            this.cellColors[index + 3]
        ];
    }

    coordToIndex(x, y, z) {
        return x + z * this.xLen + y * this.xzLen;
    }

    getBlockAtWorldPos(x, y, z) {
        // Convert world position to local chunk coordinates
        const localX = x - Math.floor(this.position.x);
        const localY = y - Math.floor(this.position.y);
        const localZ = z - Math.floor(this.position.z);

        // Check if in local bounds
        if (localX >= 0 && localX < this.xLen &&
            localY >= 0 && localY < this.yLen &&
            localZ >= 0 && localZ < this.zLen) {
            return this.cells[this.coordToIndex(localX, localY, localZ)];
        }

        // Check neighboring chunks
        if (localX < 0 && this.neighbors.nx) {
            return this.neighbors.nx.get(this.xMax + localX, localY, localZ);
        }
        if (localX >= this.xLen && this.neighbors.px) {
            return this.neighbors.px.get(localX - this.xLen, localY, localZ);
        }
        if (localZ < 0 && this.neighbors.nz) {
            return this.neighbors.nz.get(localX, localY, this.zMax + localZ);
        }
        if (localZ >= this.zLen && this.neighbors.pz) {
            return this.neighbors.pz.get(localX, localY, localZ - this.zLen);
        }

        return null;
    }

    calculateAO(x, y, z) {
        let solid = 0;
        let total = 0;

        // Get world coordinates for this block
        const worldX = x + Math.floor(this.position.x);
        const worldY = y + Math.floor(this.position.y);
        const worldZ = z + Math.floor(this.position.z);

        // Check immediate neighbors first (shares a face)
        const directNeighbors = [
            [0, 1, 0], [0, -1, 0],
            [1, 0, 0], [-1, 0, 0],
            [0, 0, 1], [0, 0, -1]
        ];

        // Check corner neighbors
        const cornerNeighbors = [
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1],
            [-1, 1, -1], [1, 1, -1], [-1, 1, 1], [1, 1, 1]
        ];

        // Check direct neighbors using world coordinates
        for (const [dx, dy, dz] of directNeighbors) {
            const block = this.getBlockAtWorldPos(worldX + dx, worldY + dy, worldZ + dz);
            if (block) {
                solid += 1.5;
            }
            total++;
        }

        // Check corner neighbors using world coordinates
        for (const [dx, dy, dz] of cornerNeighbors) {
            const block = this.getBlockAtWorldPos(worldX + dx, worldY + dy, worldZ + dz);
            if (block) {
                solid += 0.5;
            }
            total++;
        }

        // Calculate final AO value
        const ratio = solid / (total * 1.5);
        return 1.0 - (ratio * 0.6);
    }

    getFaceNormal(x, y, z) {
        // Calculate average normal based on exposed faces
        const normal = [0, 0, 0];
        let faceCount = 0;

        // Check each face and add its normal if exposed
        if (!this.get(x, y+1, z)) { normal[1] += 1; faceCount++; }  // Top
        if (!this.get(x, y-1, z)) { normal[1] -= 1; faceCount++; }  // Bottom
        if (!this.get(x+1, y, z)) { normal[0] += 1; faceCount++; }  // Right
        if (!this.get(x-1, y, z)) { normal[0] -= 1; faceCount++; }  // Left
        if (!this.get(x, y, z+1)) { normal[2] += 1; faceCount++; }  // Front
        if (!this.get(x, y, z-1)) { normal[2] -= 1; faceCount++; }  // Back

        if (faceCount > 0) {
            normal[0] /= faceCount;
            normal[1] /= faceCount;
            normal[2] /= faceCount;
        }
        return normal;
    }

    // Delegate render data generation to component
    generateRenderData() {
        return this.renderComponent.generateRenderData();
    }

    // Update visibility through component
    set visible(value) {
        this.renderComponent.visible = value;
    }

    get visible() {
        return this.renderComponent.visible;
    }

    isFullyOccluded(x, y, z) {
        const idx = this.coordToIndex(x, y, z);
        return y < this.yMax && this.cells[idx + this.xzLen] === 1 &&
               y > 0 && this.cells[idx - this.xzLen] === 1 &&
               x < this.xMax && this.cells[idx + 1] === 1 &&
               x > 0 && this.cells[idx - 1] === 1 &&
               z < this.zMax && this.cells[idx + this.xLen] === 1 &&
               z > 0 && this.cells[idx - this.xLen] === 1;
    }

    isFullyOccludedWithNeighbors(x, y, z) {
        const worldX = x + Math.floor(this.position.x);
        const worldY = y + Math.floor(this.position.y);
        const worldZ = z + Math.floor(this.position.z);

        // Check all six faces using world coordinates
        const neighbors = [
            this.getBlockAtWorldPos(worldX + 1, worldY, worldZ),
            this.getBlockAtWorldPos(worldX - 1, worldY, worldZ),
            this.getBlockAtWorldPos(worldX, worldY + 1, worldZ),
            this.getBlockAtWorldPos(worldX, worldY - 1, worldZ),
            this.getBlockAtWorldPos(worldX, worldY, worldZ + 1),
            this.getBlockAtWorldPos(worldX, worldY, worldZ - 1)
        ];

        return neighbors.every(block => block === 1);
    }

    // Add method to set neighbors
    setNeighbor(direction, chunk) {
        this.neighbors[direction] = chunk;
        this._isDirty = true; // Rebuild because edge AO might change
    }

    dispose() {
        if (VoxelChunk.bufferPool) {
            VoxelChunk.bufferPool.releaseBuffers({
                vertices: this.preallocatedVertices,
                colors: this.preallocatedColors
            });
        }
        this.preallocatedVertices = null;
        this.preallocatedColors = null;
        this.removeComponent(VoxelChunkRenderComponent.name);
    }
}


