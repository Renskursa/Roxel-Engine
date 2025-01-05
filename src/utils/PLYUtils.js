export function getPropertySize(type) {
    switch (type) {
        case 'char': case 'uchar': case 'int8': case 'uint8': return 1;
        case 'short': case 'ushort': case 'int16': case 'uint16': return 2;
        case 'int': case 'uint': case 'float': case 'int32': case 'uint32': case 'float32': return 4;
        case 'double': case 'float64': return 8;
        default: return 4;
    }
}

export function readProperty(dataView, offset, type, isLittleEndian) {
    switch (type) {
        case 'char': case 'int8': return dataView.getInt8(offset);
        case 'uchar': case 'uint8': return dataView.getUint8(offset);
        case 'short': case 'int16': return dataView.getInt16(offset, isLittleEndian);
        case 'ushort': case 'uint16': return dataView.getUint16(offset, isLittleEndian);
        case 'int': case 'int32': return dataView.getInt32(offset, isLittleEndian);
        case 'uint': case 'uint32': return dataView.getUint32(offset, isLittleEndian);
        case 'float': case 'float32': return dataView.getFloat32(offset, isLittleEndian);
        case 'double': case 'float64': return dataView.getFloat64(offset, isLittleEndian);
        default: return dataView.getFloat32(offset, isLittleEndian);
    }
}

export function parseHeader(lines) {
    let headerEnd = 0;
    let format = '';
    let vertexCount = 0;
    let faceCount = 0;
    let vertexProps = [];
    let faceProps = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'end_header') {
            headerEnd = i + 1;
            break;
        } else if (line.startsWith('format')) {
            format = line.split(' ')[1];
        } else if (line.startsWith('element vertex')) {
            vertexCount = parseInt(line.split(' ')[2]);
        } else if (line.startsWith('element face')) {
            faceCount = parseInt(line.split(' ')[2]);
        } else if (line.startsWith('property')) {
            const parts = line.split(' ');
            if (parts[parts.length - 2] === 'vertex_indices') {
                faceProps.push({ name: parts[parts.length - 1], type: 'list', listType: parts[2], itemType: parts[3] });
            } else {
                vertexProps.push({ name: parts[parts.length - 1], type: parts[1] });
            }
        }
    }
    
    // Add validation
    if (vertexCount <= 0 || faceCount <= 0) {
        throw new Error('Invalid vertex or face count in PLY header');
    }
    
    return { format, vertexCount, faceCount, vertexProps, faceProps, headerEnd };
}

export function generateNormals(vertices, indices) {
    // Add validation
    if (!vertices || !indices || vertices.length === 0 || indices.length === 0) {
        console.warn('Invalid input for normal generation');
        return new Array(vertices.length).fill(0);
    }
    
    const normals = new Array(vertices.length).fill(0);
    
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i] * 3;
        const i1 = indices[i + 1] * 3;
        const i2 = indices[i + 2] * 3;
        
        // Calculate vectors for cross product
        const v0 = vertices.slice(i0, i0 + 3);
        const v1 = vertices.slice(i1, i1 + 3);
        const v2 = vertices.slice(i2, i2 + 3);
        
        const vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        
        const normal = [
            vec1[1] * vec2[2] - vec1[2] * vec2[1],
            vec1[2] * vec2[0] - vec1[0] * vec2[2],
            vec1[0] * vec2[1] - vec1[1] * vec2[0]
        ];
        
        for (let j = 0; j < 3; j++) {
            normals[i0 + j] += normal[j];
            normals[i1 + j] += normal[j];
            normals[i2 + j] += normal[j];
        }
    }
    
    // Normalize
    for (let i = 0; i < normals.length; i += 3) {
        const len = Math.sqrt(
            normals[i] * normals[i] +
            normals[i + 1] * normals[i + 1] +
            normals[i + 2] * normals[i + 2]
        );
        if (len > 0) {
            normals[i] /= len;
            normals[i + 1] /= len;
            normals[i + 2] /= len;
        }
    }
    
    return normals;
}

// Add new helper function
export function validateFace(vertexIndices, vertexCount) {
    if (!Array.isArray(vertexIndices) || vertexIndices.length < 3) {
        return false;
    }
    
    return vertexIndices.every(index => 
        Number.isInteger(index) && 
        index >= 0 && 
        index < vertexCount
    );
}

export function calculateBoundingBox(vertices) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    
    for (let i = 0; i < vertices.length; i += 3) {
        for (let j = 0; j < 3; j++) {
            min[j] = Math.min(min[j], vertices[i + j]);
            max[j] = Math.max(max[j], vertices[i + j]);
        }
    }
    
    return { min, max };
}
