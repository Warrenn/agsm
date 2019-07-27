import { ModuleDeclaration } from '../src'

export type AnotherState = {
    user: {
        name: string
        uniqueId: string
    },
    loadingUser: boolean
}

export const anotherModule = <ModuleDeclaration<AnotherState>>{
    factories: {
        "userservice": (config) => {
            return {
                getUser: async () => {
                    let response = await fetch(`${config.baseUrl}getUser`)
                    let data = response.json()
                    return data
                }
            }
        }
    },
    asyncs: {
        "get user": async ({ factory, dispatch }) => {
            const service = factory.createService("userservice")
            const data = await service.getUser()
            await dispatch("found user", data)
        }
    },
    transforms: {
        "get user": ({ state }) => state.loadingUser = true,
        "found user": ({ state, value }) => {
            state.loadingUser = false
            state.user = value
        }
    }
}
