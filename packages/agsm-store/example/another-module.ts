import { ModuleDeclaration } from '../src'

export type AnotherState = {
    user: {
        name: string
        uniqueId: string
    },
    loadingUser: boolean
    message: string
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
    middlewares: [
        next => async ({ factory, state, namespace, action, dispatch }) => {
            try {
                await next()
            }
            catch (error) {
                dispatch("$$ERROR$$", error)
            }
        },
        next => async ({ factory }) => {
            window.setTimeout(async () => await next(), 1000)
        }
    ],
    error: ({ factory, state, error }) => {
        console.error(error.stack)
    },
    transforms: {
        "get user": ({ state }) => state.loadingUser = true,
        "found user": ({ state, value }) => {
            state.loadingUser = false
            state.user = value
        }
    },

}
