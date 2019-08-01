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
        output: { file: 'lib/agsm-store.js', format: 'cjs', indent: false },
        external: externalPackages,
        plugins: [typescript()]
    },

    // ES
    {
        input: 'src/index.ts',
        output: { file: 'es/agsm-store.js', format: 'es', indent: false },
        external: externalPackages,
        plugins: [typescript()]
    },

    // ES for Browsers
    {
        input: 'src/index.ts',
        output: { file: 'es/agsm-store.mjs', format: 'es', indent: false },
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
            file: 'dist/agsm-store.js',
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
            file: 'dist/agsm-store.min.js',
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