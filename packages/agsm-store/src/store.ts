import { ModuleDeclaration, TransformCallback, MiddleWareCallback, FactoryDeclaration, StoreBuilder, Store, WatchCallback, TransformContext, MiddlewareContext, ServiceFactory, GetterCallback } from './index'
import { deepCopy } from './utils/utils'

export function createStoreBuilder<T>(): StoreBuilder<T> {
    let _transforms: { [key: string]: TransformCallback<T>[] } = {}
    let _asyncs: { [key: string]: MiddleWareCallback<T>[] } = {}
    let _middlewares: { [key: string]: MiddleWareCallback<T>[] } = {}
    let _factories: { [key: string]: FactoryDeclaration } = {}
    let _state: { [key: string]: any } = {}
    let _config: any = {}

    function addModule(declaration: ModuleDeclaration<T>, namespace?: string): StoreBuilder<T> {
        const nsKey = namespace || "__"
        if (namespace) namespace = `${namespace}:`
        else namespace = ""

        if (declaration.transforms) Object
            .keys(declaration.transforms)
            .map(k => {
                let key = `${namespace}${k}`
                _transforms[key] = _transforms[key] || []
                _transforms[key].push(declaration.transforms[k])
            })

        if (declaration.asyncs) Object
            .keys(declaration.asyncs)
            .map(k => {
                let key = `${namespace}${k}`
                _asyncs[key] = _asyncs[key] || []
                _asyncs[key].push(declaration.asyncs[k])
            })

        _middlewares[nsKey] = [...(_middlewares[nsKey] || []), ...declaration.middlewares]

        if (declaration.factories) Object
            .keys(declaration.factories)
            .map(k => _factories[`${namespace}${k}`] = declaration.factories[k])

        _state[nsKey] = { ...(_state[nsKey] || {}), ...declaration.initialState }

        return this
    }

    function addMiddleware(callback: MiddleWareCallback<T>, namespace?: string): StoreBuilder<T> {
        let midKey = namespace || "__"
        _middlewares[midKey] = _middlewares[midKey] || []
        _middlewares[midKey].push(callback)
        return this
    }

    function addTransform(key: string, callback: TransformCallback<T>, namespace?: string): StoreBuilder<T> {
        if (namespace) key = `${namespace}:${key}`
        _transforms[key] = _transforms[key] || []
        _transforms[key].push(callback)
        return this
    }

    function addAsync(key: string, callback: MiddleWareCallback<T>, namespace?: string): StoreBuilder<T> {
        if (namespace) key = `${namespace}:${key}`
        _asyncs[key] = _asyncs[key] || []
        _asyncs[key].push(callback)
        return this
    }

    function initialState(initialState: any, namespace?: string): StoreBuilder<T> {
        const nsKey = namespace || "__"
        _state[nsKey] = { ..._state[nsKey], ...initialState }
        return this
    }

    function addConfig(config: any): StoreBuilder<T> {
        _config = { ..._config, ...config }
        return this
    }

    function addFactory(key: string, factory: FactoryDeclaration, namespace?: string): StoreBuilder<T> {
        if (namespace) key = `${namespace}:${key}`
        _factories[key] = factory
        return this
    }

    function build(): Store<T> {
        const _watchers: WatchCallback<T>[] = []
        const _initializedServices: { [key: string]: any } = {}
        const _watchGetters: { [key: string]: WatchCallback<T>[] } = {}

        Object.keys(_factories).map(k => _initializedServices[k] = _factories[k](_config))

        async function dispatch(actionNs: string, value: any): Promise<void> {
            if (!actionNs) throw "The action must be provided for dispatch"

            let namespace = ""
            const split = actionNs.split(":")
            if (split.length > 1) namespace = split[0]

            const nsKey = namespace || "__"
            const transforms: TransformCallback<T>[] = _transforms[actionNs] || []
            const middlewares: MiddleWareCallback<T>[] = [...(_asyncs[actionNs] || []), ...(_middlewares[nsKey] || [])] || []

            const factory = <ServiceFactory>{
                createService: (key: string) => {
                    if (namespace && _initializedServices[`${namespace}:${key}`]) return _initializedServices[`${namespace}:${key}`]
                    if (_initializedServices[`${key}`]) return _initializedServices[`${key}`]
                    throw `the service for ${key} could not be found`
                }
            }
            let rootState: T = <T>deepCopy(_state["__"] || {})
            let state: T = <T>deepCopy(_state[nsKey] || {})

            const transContext = <TransformContext<T>>{ state, action: actionNs, value, rootState }
            transforms.map(t => t(transContext))

            _state["__"] = <T>deepCopy(rootState)
            _state[nsKey] = <T>deepCopy(state)

            const watchers: WatchCallback<T>[] = _watchers.slice()
            watchers.map(w => w({ state, rootState }))

            const _children: { key: string, value: any }[] = []
            const _dispatch = (act: string, value: any, root?: boolean) => {
                if (root || !namespace) _children.push({ key: act, value })
                else _children.push({ key: `${namespace}:${act}`, value })
            }

            const midContext = <MiddlewareContext<T>>{ state, rootState, value, context: _config, factory, dispatch: _dispatch, action: actionNs }
            const promises = middlewares.map(m => m(midContext))
            await Promise.all(promises)
            for (let i = 0; i < _children.length; i++) {
                await dispatch(_children[i].key, _children[i].value)
            }
        }

        function watch(callback: WatchCallback<T>): () => void {
            let isSubscribed = true
            _watchers.push(callback)

            return (): void => {
                if (!isSubscribed) return

                isSubscribed = false
                const index = _watchers.indexOf(callback)
                _watchers.splice(index, 1)
            }
        }

        return <Store<T>>{
            watch,
            dispatch
        }
    }

    return <StoreBuilder<T>>{
        addModule,
        addMiddleware,
        addTransform,
        initialState,
        addAsync,
        addConfig,
        build,
        addFactory
    }
}