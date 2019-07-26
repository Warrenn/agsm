import { ModuleDeclaration } from '../src/index'

export type AnotherState = {
    user: {
        name: string
        uniqueId: string
    },
    loadingUser: boolean
}

export const anotherModule = <ModuleDeclaration<AnotherState>>{
    asyncs: {
        "get user": async ({ factory, dispatch }) => {
            const service = factory.createService("userservice")
            const data = await service.getUser()
            await dispatch("found user", data)
        }
    },
    factories: {
        "userservice": (config) => {
            return {
                getUser: () => new Promise((r, x) => {
                    if (config.userTimer) x('no user timer')
                    window.setTimeout(() => r({ name: "anonymous", uniqueId: "veryuniqe" }), config.userTimer)
                })
            }
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
