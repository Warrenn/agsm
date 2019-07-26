import { ModuleDeclaration } from '../src/index'

export type ExampleState = {
    loading: boolean,
    collection: any[]
}

export const exampleModule = <ModuleDeclaration<ExampleState>>{
    initialState: {
        collection: [],
        loading: false,
        more: false
    },
    asyncs: {
        "Call Service": async ({ factory, state, value, dispatch }) => {
            const service = factory.createService("service")
            const data = await service.fetch(value, state)
            await dispatch("Service Returned", data)
        }
    },
    middlewares: [
        async ({ action, value }) => console.log(`[${action}] ${value}`)
    ],
    factories: {
        "service": (config: any) => {
            return {
                fetch: async (value: any, state: ExampleState) => await new Promise((res, rej) => {
                    if (!config.timeout) rej("no timeout set")
                    else window.setTimeout(() => res([value, state]), config.timeout)
                })
            }
        }
    },
    transforms: {
        "Call Service": ({ state }) => state.loading = true,
        "service Returned": ({ state, value }) => {
            state.loading = false
            state.collection = value
        }
    }
}