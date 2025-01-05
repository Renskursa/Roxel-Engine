export class PLYLoader {
    static async load(url) {
        const response = await fetch(url);
        const text = await response.text();
        return this.parse(text);
    }

    static parse(data) {
        const lines = data.split('\n');
        let isHeader = true;
        let vertexCount = 0;
        let faceCount = 0;
        let vertices = [];
        let indices = [];
        let colors = [];

        for (let line of lines) {
            line = line.trim();
            if (isHeader) {
                if (line.startsWith('element vertex')) {
                    vertexCount = parseInt(line.split(' ')[2]);
                } else if (line.startsWith('element face')) {
                    faceCount = parseInt(line.split(' ')[2]);
                } else if (line === 'end_header') {
                    isHeader = false;
                }
            } else {
                if (vertexCount > 0) {
                    const parts = line.split(' ');
                    vertices.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
                    colors.push(parseFloat(parts[3]) / 255, parseFloat(parts[4]) / 255, parseFloat(parts[5]) / 255, 1.0);
                    vertexCount--;
                } else if (faceCount > 0) {
                    const parts = line.split(' ');
                    const vertexIndices = parts.slice(1).map(Number);
                    indices.push(...vertexIndices);
                    faceCount--;
                }
            }
        }

        return {
            vertexBuffer: new Float32Array(vertices),
            indexBuffer: new Uint16Array(indices),
            colorBuffer: new Float32Array(colors),
            vertexCount: vertices.length / 3,
            indexCount: indices.length
        };
    }
}
