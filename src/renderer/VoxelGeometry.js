export const VoxelGeometry = {
    faces: [
        // 0: front (-z)
        {
            normal: [0, 0, -1],
            vertices: [
                { pos: [0, 1, 0], uv: [0, 1] },
                { pos: [1, 1, 0], uv: [1, 1] },
                { pos: [1, 0, 0], uv: [1, 0] },
                { pos: [0, 0, 0], uv: [0, 0] },
            ],
            indices: [0, 1, 2, 0, 2, 3]
        },
        // 1: back (+z)
        {
            normal: [0, 0, 1],
            vertices: [
                { pos: [1, 1, 1], uv: [0, 1] },
                { pos: [0, 1, 1], uv: [1, 1] },
                { pos: [0, 0, 1], uv: [1, 0] },
                { pos: [1, 0, 1], uv: [0, 0] },
            ],
            indices: [0, 1, 2, 0, 2, 3]
        },
        // 2: top (+y)
        {
            normal: [0, 1, 0],
            vertices: [
                { pos: [0, 1, 1], uv: [0, 1] },
                { pos: [1, 1, 1], uv: [1, 1] },
                { pos: [1, 1, 0], uv: [1, 0] },
                { pos: [0, 1, 0], uv: [0, 0] },
            ],
            indices: [0, 1, 2, 0, 2, 3]
        },
        // 3: bottom (-y)
        {
            normal: [0, -1, 0],
            vertices: [
                { pos: [0, 0, 0], uv: [0, 1] },
                { pos: [1, 0, 0], uv: [1, 1] },
                { pos: [1, 0, 1], uv: [1, 0] },
                { pos: [0, 0, 1], uv: [0, 0] },
            ],
            indices: [0, 1, 2, 0, 2, 3]
        },
        // 4: right (+x)
        {
            normal: [1, 0, 0],
            vertices: [
                { pos: [1, 1, 0], uv: [0, 1] },
                { pos: [1, 1, 1], uv: [1, 1] },
                { pos: [1, 0, 1], uv: [1, 0] },
                { pos: [1, 0, 0], uv: [0, 0] },
            ],
            indices: [0, 1, 2, 0, 2, 3]
        },
        // 5: left (-x)
        {
            normal: [-1, 0, 0],
            vertices: [
                { pos: [0, 1, 1], uv: [0, 1] },
                { pos: [0, 1, 0], uv: [1, 1] },
                { pos: [0, 0, 0], uv: [1, 0] },
                { pos: [0, 0, 1], uv: [0, 0] },
            ],
            indices: [0, 1, 2, 0, 2, 3]
        },
    ]
};