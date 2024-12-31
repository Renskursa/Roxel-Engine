export class VoxelMesh {
    constructor(renderer) {
        this.renderer = renderer;
        this.reset();
    }

    reset() {
        this.vertices = [];
        this.colors = [];
        this.normals = [];
        this.indices = [];
        this.currentIndex = 0;
        return this;
    }

    setGradientMode(mode) {
        this.gradientMode = mode; // 'individual' or 'group'
    }

    addFace(x, y, z, vertices, colors) {
        const startIndex = this.vertices.length / 3;
        
        // Add normal data for lighting
        const normal = this.calculateFaceNormal(vertices);
        for (let i = 0; i < 4; i++) {
            this.normals.push(...normal);
        }
        
        // Add vertices in correct winding order (counter-clockwise when viewed from outside)
        for (let i = 0; i < 4; i++) {
            this.vertices.push(
                x + vertices[i * 3],
                y + vertices[i * 3 + 1],
                z + vertices[i * 3 + 2]
            );
            this.colors.push(...colors.slice(i * 4, (i + 1) * 4));
        }

        // Create two triangles with correct winding order
        this.indices.push(
            startIndex, startIndex + 1, startIndex + 2,  // First triangle
            startIndex + 2, startIndex + 3, startIndex   // Second triangle
        );
    }

    calculateFaceNormal(vertices) {
        // Calculate two edges of the face for cross product
        const v1 = [
            vertices[3] - vertices[0], // Edge 1 x component
            vertices[4] - vertices[1], // Edge 1 y component
            vertices[5] - vertices[2]  // Edge 1 z component
        ];
        const v2 = [
            vertices[6] - vertices[0],
            vertices[7] - vertices[1],
            vertices[8] - vertices[2]
        ];
        
        // Cross product
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }

    getVoxelColors(voxel, localY, localX, groupBounds = null) {
        if (voxel.color) {
            return voxel.color;
        }

        if (voxel.colorGradient) {
            const { start, end, direction } = voxel.colorGradient;
            let t;

            if (this.gradientMode === 'group' && groupBounds) {
                // Calculate global coordinates relative to group bounds
                let globalX = voxel.x + localX - groupBounds.minX;
                let globalY = voxel.y + localY - groupBounds.minY;
                
                // Normalize coordinates based on gradient direction
                switch(direction) {
                    case 'diagonal':
                        // Use maximum dimension to ensure consistent gradient across different group sizes
                        const maxDim = Math.max(
                            groupBounds.maxX - groupBounds.minX,
                            groupBounds.maxY - groupBounds.minY
                        );
                        t = (globalX + globalY) / (maxDim * 2);
                        break;
                    case 'horizontal':
                        globalX = voxel.x + localX;
                        t = (globalX - groupBounds.minX) / Math.max(1, groupBounds.maxX - groupBounds.minX);
                        break;
                    case 'connected':
                        globalX = voxel.x + localX;
                        globalY = voxel.y + localY;
                        const tx = (globalX - groupBounds.minX) / Math.max(1, groupBounds.maxX - groupBounds.minX);
                        const ty = (globalY - groupBounds.minY) / Math.max(1, groupBounds.maxY - groupBounds.minY);
                        t = (tx + ty) / 2;
                        break;
                    default: // 'vertical'
                        globalY = voxel.y + localY;
                        t = (globalY - groupBounds.minY) / Math.max(1, groupBounds.maxY - groupBounds.minY);
                }
            } else {
                // Individual voxel mode
                switch (direction) {
                    case 'diagonal':
                        t = (localX + localY) / 2;
                        break;
                    case 'horizontal':
                        t = localX;
                        break;
                    case 'connected':
                        t = (localX + localY) / 2;
                        break;
                    default: // 'vertical'
                        t = localY;
                }
            }

            // Ensure t is properly bounded
            t = Math.max(0, Math.min(1, t));

            // Colors are already in 0-1 range from setGradient()
            return [
                start[0] + (end[0] - start[0]) * t,
                start[1] + (end[1] - start[1]) * t,
                start[2] + (end[2] - start[2]) * t,
                start[3] + (end[3] - start[3]) * t
            ];
        }

        // Default color if no gradient or solid color is set (white)
        return [1, 1, 1, 1];
    }

    addVoxel(voxel) {
        if (!voxel.visible || !voxel.isSolid()) return;

        // Each face defined with vertices in counter-clockwise order for proper face culling
        const faceDefinitions = [
            // Front face (normal pointing towards negative Z)
            {
                vertices: [0,0,0, 1,0,0, 1,1,0, 0,1,0],
                normal: [0,0,-1],
                name: 'front'
            },
            {
                vertices: [0,0,1, 0,1,1, 1,1,1, 1,0,1],
                normal: [0,0,1],
                name: 'back'
            },
            {
                vertices: [0,1,0, 1,1,0, 1,1,1, 0,1,1],
                normal: [0,1,0],
                name: 'top'
            },
            {
                vertices: [0,0,0, 0,0,1, 1,0,1, 1,0,0],
                normal: [0,-1,0],
                name: 'bottom'
            },
            {
                vertices: [1,0,0, 1,0,1, 1,1,1, 1,1,0],
                normal: [1,0,0],
                name: 'right'
            },
            {
                vertices: [0,0,0, 0,1,0, 0,1,1, 0,0,1],
                normal: [-1,0,0],
                name: 'left'
            }
        ];

        // Add each visible face
        faceDefinitions.forEach(({vertices, normal, name}) => {
            if (voxel.visibleFaces[name]) {
                const startIndex = this.vertices.length / 3;
                
                // Add normal data
                for (let i = 0; i < 4; i++) {
                    this.normals.push(...normal);
                }
                
                // Add vertices
                for (let i = 0; i < 4; i++) {
                    this.vertices.push(
                        voxel.x + vertices[i * 3],
                        voxel.y + vertices[i * 3 + 1],
                        voxel.z + vertices[i * 3 + 2]
                    );
                    
                    // Get color, either solid or gradient
                    const color = voxel.getColor ? voxel.getColor() : [1, 1, 1, 1];
                    this.colors.push(...color);
                }

                // Add indices for two triangles
                this.indices.push(
                    startIndex, startIndex + 1, startIndex + 2,
                    startIndex + 2, startIndex + 3, startIndex
                );
            }
        });
    }

    build() {
        // Create edge vertices for wireframe rendering
        const edgeVertices = [];
        for (let i = 0; i < this.vertices.length; i += 12) {
            // For each face (4 vertices), create edge lines
            for (let j = 0; j < 4; j++) {
                const v1 = j * 3;
                const v2 = ((j + 1) % 4) * 3;
                
                // Add first vertex
                edgeVertices.push(
                    this.vertices[i + v1],
                    this.vertices[i + v1 + 1],
                    this.vertices[i + v1 + 2]
                );
                
                // Add second vertex
                edgeVertices.push(
                    this.vertices[i + v2],
                    this.vertices[i + v2 + 1],
                    this.vertices[i + v2 + 2]
                );
            }
        }

        return {
            vertexBuffer: this.renderer.createBuffer(new Float32Array(this.vertices)),
            colorBuffer: this.renderer.createBuffer(new Float32Array(this.colors)),
            indexBuffer: this.renderer.createBuffer(new Uint16Array(this.indices), this.renderer.gl.ELEMENT_ARRAY_BUFFER),
            edgeBuffer: this.renderer.createBuffer(new Float32Array(edgeVertices)),
            normalBuffer: this.renderer.createBuffer(new Float32Array(this.normals)),
            indexCount: this.indices.length,
            vertexCount: this.vertices.length / 3,
            edgeCount: edgeVertices.length / 3
        };
    }
}
