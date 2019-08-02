import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import nodeResolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const externalPackages = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {})
]

export default [ // CommonJS
    {
        input: 'src/index.ts',
        output: { file: 'lib/agsm-webworker.js', format: 'cjs', indent: false },
        external: externalPackages,
        plugins: [typescript()]
    },

    // ES
    {
        input: 'src/index.ts',
        output: { file: 'es/agsm-webworker.js', format: 'es', indent: false },
        external: externalPackages,
        plugins: [typescript()]
    },

    // ES for Browsers
    {
        input: 'src/index.ts',
        output: { file: 'es/agsm-webworker.mjs', format: 'es', indent: false },
        plugins: [
            nodeResolve(),
            typescript(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    warnings: false
                }
            })
        ]
    },

    // UMD Development
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/agsm-webworker.js',
            format: 'umd',
            name: 'AGSM Store',
            indent: false
        },
        plugins: [
            nodeResolve(),
            typescript()
        ]
    },

    // UMD Production
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/agsm-webworker.min.js',
            format: 'umd',
            name: 'AGSM Store',
            indent: false
        },
        plugins: [
            nodeResolve(),
            typescript(),
            terser({
                compress: {
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    warnings: false
                }
            })
        ]
    }
]