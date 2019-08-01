import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import dts from 'rollup-plugin-dts'
import { terser } from 'rollup-plugin-terser'

const externalPackages = Object.keys(pkg.dependencies)

export default [{
        input: './src/index.d.ts',
        plugins: [dts()],
        output: { file: pkg.types }
    },
    {
        input: './src/index.ts',
        external: externalPackages,
        plugins: [
            typescript(),
            terser()
        ],
        output: [
            { file: pkg.main, format: 'es' }
        ]
    }
]