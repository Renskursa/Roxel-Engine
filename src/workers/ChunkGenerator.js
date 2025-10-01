import { Noise } from '../utils/Noise.js';

let noise;

// Helper to get a random color based on position
function getColor(x, y, z) {
    const r = Math.sin(x * 0.1) * 0.5 + 0.5;
    const g = Math.sin(y * 0.1) * 0.5 + 0.5;
    const b = Math.sin(z * 0.1) * 0.5 + 0.5;
    return [r, g, b, 1.0]; // RGBA
}

self.onmessage = function(e) {
    const { x, y, z, chunkSize, noiseSeed, generateFuncStr } = e.data;

    if (!noise) {
        noise = new Noise(noiseSeed);
    }

    const generate = new Function('x', 'y', 'z', 'noise', `return (${generateFuncStr})(x, y, z, noise);`);

    const totalVoxels = chunkSize * chunkSize * chunkSize;
    const voxelTypes = new Uint8Array(totalVoxels);
    const voxelColors = new Float32Array(totalVoxels * 4);

    let i = 0;
    for (let localZ = 0; localZ < chunkSize; localZ++) {
        for (let localY = 0; localY < chunkSize; localY++) {
            for (let localX = 0; localX < chunkSize; localX++) {
                const worldX = x * chunkSize + localX;
                const worldY = y * chunkSize + localY;
                const worldZ = z * chunkSize + localZ;

                const type = generate(worldX, worldY, worldZ, noise);
                voxelTypes[i] = type;

                if (type > 0) {
                    const color = getColor(worldX, worldY, worldZ);
                    const colorIndex = i * 4;
                    voxelColors[colorIndex] = color[0];
                    voxelColors[colorIndex + 1] = color[1];
                    voxelColors[colorIndex + 2] = color[2];
                    voxelColors[colorIndex + 3] = color[3];
                }
                i++;
            }
        }
    }

    self.postMessage({
        x, y, z,
        voxelTypes: voxelTypes.buffer,
        voxelColors: voxelColors.buffer
    }, [voxelTypes.buffer, voxelColors.buffer]);
};