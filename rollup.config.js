import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/roxel-engine.js',
            format: 'umd',
            name: 'RoxelEngine',
            globals: {
                three: 'THREE'
            }
        },
        {
            file: 'dist/roxel-engine.min.js',
            format: 'umd',
            name: 'RoxelEngine',
            globals: {
                three: 'THREE'
            },
            plugins: [terser()]
        },
        {
            file: 'dist/roxel-engine.esm.js',
            format: 'es'
        }
    ],
    external: [
        'three',
        'three/examples/jsm/controls/OrbitControls'
    ],
    plugins: [
        resolve({
            preferBuiltins: false,
            browser: true
        }),
        commonjs()
    ]
};
