import { ModuleDeclaration, TransformContext } from '../src/index'

export interface ExampleState {
    loading: boolean,
    collection: any[]
}

export const exampleModule = <ModuleDeclaration<ExampleState>>{
    initialState: {
        collection: [],
        loading: false
    },
    asyncs: {},
    middlewares: [],
    factories: {},
    transforms: {
        "Call Service": ({ state, value, rootState }) => state.loading = true
    }
} 