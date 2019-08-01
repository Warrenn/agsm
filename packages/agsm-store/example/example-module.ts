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
    factories: {
        "service": (config: any) => {
            return {
                fetch: async ({ value, state }) => {
                    let response = await fetch(`${config.baseUrl}getService`, {
                        headers: state.headers,
                        body: JSON.stringify(value)
                    })
                    let data = response.json()
                    return data
                }
            }
        }
    },
    asyncs: {
        "Call Service": async ({ factory, state, value, dispatch }) => {
            const service = factory.createService("service")
            const data = await service.fetch(value, state)
            await dispatch("Service Returned", data)
        }
    },
    transforms: {
        "*:*": ({ action, value }) => console.log(`[${action}] ${JSON.stringify(value)}`),
        "Call Service": ({ state }) => state.loading = true,
        "Service Returned": ({ state, value }) => {
            state.loading = false
            state.collection = value
        }
    }
}