import { Voxel } from '../datatypes/Voxel.js';
import { Noise } from '../utils/Noise.js';

let noise;

self.onmessage = function(e) {
    const { x, y, z, chunkSize, noiseSeed, generateFuncStr } = e.data;

    if (!noise) {
        noise = new Noise(noiseSeed);
    }

    // Reconstruct the generation function
    const generate = new Function('x', 'y', 'z', 'noise', `return (${generateFuncStr})(x, y, z, noise);`);
    let solids = 0;

    const voxels = [];
    for (let localX = 0; localX < chunkSize; localX++) {
        for (let localY = 0; localY < chunkSize; localY++) {
            for (let localZ = 0; localZ < chunkSize; localZ++) {
                const worldX = x * chunkSize + localX;
                const worldY = y * chunkSize + localY;
                const worldZ = z * chunkSize + localZ;
                const voxelType = generate(worldX, worldY, worldZ, noise);
                if (voxelType > 0) {
                    voxels.push({ x: localX, y: localY, z: localZ, type: voxelType });
                    solids++;
                }
            }
        }
    }
    self.postMessage({ x, y, z, voxels });
};