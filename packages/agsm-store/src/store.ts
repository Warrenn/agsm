import { deepCopy } from './utils/utils'
import { StoreBuilder, AsyncCallback, FactoryDeclaration, MiddleWareChain, ErrorDeclaration, ErrorContext, MiddleWareContext, ModuleDeclaration, Store, WatchCallback, ServiceFactory, TransformContext, MiddleWareCallback, AsyncContext, TransformCallback, TransformChain, GlobalState } from './types'

export function createStoreBuilder<T>(): StoreBuilder<T> {
    const _transforms: { [key: string]: TransformCallback<T>[] } = {}
    const _asyncs: { [key: string]: AsyncCallback<T>[] } = {}
    const _factories: { [key: string]: FactoryDeclaration } = {}
    const _state: GlobalState<T> = {}
    let _middlewares: MiddleWareChain<T>[] = []
    let _transformWraps: TransformChain<T>[] = []
    let _config: any = {}

    let _errorHandler: ErrorDeclaration<T> = (context: ErrorContext<T>) => console.error(`${JSON.stringify({
        context: context.context,
        state: context.state,
        rootState: context.globalState,
        value: context.value,
        error: {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack
        }
    })}`)

    const _wrapTryCatchMiddleWare: MiddleWareChain<T> = next => async (ctx: MiddleWareContext<T>) => {
        try { return await next(ctx) }
        catch (error) {
            _errorHandler({
                error,
                state: ctx.state,
                value: ctx.value,
                context: ctx.context,
                globalState: ctx.globalState,
                factory: ctx.factory,
                action: ctx.action,
                namespace: ctx.namespace
            })
        }
    }

    function addModule(declaration: ModuleDeclaration<T>, namespace?: string): StoreBuilder<T> {
        if (!declaration) throw ''
        const stateKey = namespace || "__"
        if (namespace) namespace = `${namespace}:`
        else namespace = ""

        let concatCallbacks = (existingCallbacks: any, newCallbacks: any) => Object
            .keys(newCallbacks)
            .map(k => {
                let key = (k === "*:*") ? "*:*" : `${namespace}${k}`
                existingCallbacks[key] = existingCallbacks[key] || []
                existingCallbacks[key].push(newCallbacks[k])
            })

        if (declaration.transforms) concatCallbacks(_transforms, declaration.transforms)
        if (declaration.asyncs) concatCallbacks(_asyncs, declaration.asyncs)
        if (declaration.middlewares && declaration.middlewares.length > 0) _middlewares = [..._middlewares, ...declaration.middlewares]
        if (declaration.errorHandler) _errorHandler = declaration.errorHandler
        if (declaration.transformWraps && declaration.transformWraps.length > 0) _transformWraps = [..._transformWraps, ...declaration.transformWraps]

        const factories = declaration.factories || {}
        Object.keys(factories).map(k => _factories[`${namespace}${k}`] = factories[k])
        const clone = Object.assign(deepCopy(_state[stateKey] || {}, false, []), declaration.initialState || {})

        _state[stateKey] = deepCopy(clone, true, [])

        return this
    }

    function addTransformWrap(chain: TransformChain<T>) {
        _transformWraps = [chain, ..._transformWraps]
        return this
    }

    function addMiddleware(chain: MiddleWareChain<T>): StoreBuilder<T> {
        _middlewares = [chain, ..._middlewares]
        return this
    }

    function addTransform(key: string, callback: TransformCallback<T>, namespace?: string): StoreBuilder<T> {
        if (namespace && key !== "*:*") key = `${namespace}:${key}`
        _transforms[key] = _transforms[key] || []
        _transforms[key].push(callback)
        return this
    }

    function addAsync(key: string, callback: AsyncCallback<T>, namespace?: string): StoreBuilder<T> {
        if (namespace && key !== "*:*") key = `${namespace}:${key}`
        _asyncs[key] = _asyncs[key] || []
        _asyncs[key].push(callback)
        return this
    }

    function initialState(initialState: any, namespace?: string): StoreBuilder<T> {
        const nsKey = namespace || "__"
        const clone = Object.assign(deepCopy(_state[nsKey] || {}, false, []), initialState || {})
        _state[nsKey] = deepCopy(clone, true, [])
        return this
    }

    function addConfig(config: any): StoreBuilder<T> {
        _config = Object.assign(_config || {}, config || {})
        return this
    }

    function addFactory(key: string, factory: FactoryDeclaration, namespace?: string): StoreBuilder<T> {
        if (namespace) key = `${namespace}:${key}`
        _factories[key] = factory
        return this
    }

    function addErrorHandler(handler: ErrorDeclaration<T>): StoreBuilder<T> {
        _errorHandler = handler
        return this
    }

    function build(): Store<T> {
        const _watchers: WatchCallback<T>[] = []
        const _initializedServices: { [key: string]: any } = {}
        const _mainMiddleware = [_wrapTryCatchMiddleWare, ..._middlewares]
            .reduce((a, b) => (...args) => a(b(...args)))

        Object.keys(_factories).map(k => _initializedServices[k] = _factories[k](_config))

        function getState(key?: string): T {
            key = key || "__"
            return _state[key]
        }

        async function dispatch(actionNs: string, value: any, root?: boolean): Promise<void> {
            if (!actionNs) throw "The action must be provided for dispatch"

            let namespace = ""
            let allMatches = "*"
            const split = actionNs.split(":")
            const action = split[split.length - 1]

            if (!root && split.length > 1) {
                namespace = split[(split.length - 2)]
                allMatches = `${namespace}:*`
                actionNs = `${namespace}:${action}`
            }
            if (root) actionNs = action

            const nsKey = namespace || "__"
            const transforms: TransformCallback<T>[] = [...(_transforms[actionNs] || []), ...(_transforms[allMatches] || []), ...(_transforms["*:*"] || [])] || []
            const asyncs: AsyncCallback<T>[] = [...(_asyncs[actionNs] || []), ...(_asyncs[allMatches] || []), ...(_asyncs["*:*"] || [])] || []

            if (transforms.length == 0 && asyncs.length == 0) return

            const globalState: GlobalState<T> = deepCopy(_state || {}, false, [])
            const state: T = globalState[nsKey] || <T>{}
            const context = { config: _config }

            const factory = <ServiceFactory>{
                createService: (key: string) => {
                    if (namespace && _initializedServices[`${namespace}:${key}`]) return _initializedServices[`${namespace}:${key}`]
                    if (_initializedServices[`${key}`]) return _initializedServices[`${key}`]
                    throw `the service for ${key} could not be found`
                }
            }

            if (transforms.length > 0) {
                const innerTransform: TransformCallback<T> = ctx => transforms.map(t => t && t(ctx))
                const outerTransformWrap: TransformChain<T> = next => (ctx: TransformContext<T>) => {
                    try {
                        next(ctx)
                    }
                    catch (error) {
                        _errorHandler({
                            error,
                            state: ctx.state,
                            action,
                            context: ctx.context,
                            factory,
                            namespace,
                            globalState: ctx.globalState,
                            value
                        })
                    }
                }

                const mainTransformWrap: TransformChain<T> = [outerTransformWrap, ..._transformWraps]
                    .reduce((a, b) => (...args) => a(b(...args)))

                const transContext = <TransformContext<T>>{ state, action, value, globalState, context, namespace }
                mainTransformWrap(innerTransform)(transContext)

                Object.keys(_state).map(k => _state[k] = <T>deepCopy(globalState[k] || {}, false, []), true)
                _state[nsKey] = deepCopy(state, true, [])

                const watchers: WatchCallback<T>[] = _watchers.slice()
                try {
                    watchers.map(w => w && w({ state: _state[nsKey], globalState: _state }))
                }
                catch (error) {
                    _errorHandler({ globalState: _state, value, state: _state[nsKey], factory, error, context, action, namespace })
                }
            }

            if (asyncs.length == 0) return

            const _children: { key: string, value: any, root?: boolean }[] = []
            const _dispatch = (act: string, value: any, root?: boolean) => {
                if (root || !namespace) _children.push({ key: act, value, root })
                else _children.push({ key: `${namespace}:${act}`, value, root })
            }

            const innerMiddleware: MiddleWareCallback<T> = async context => {
                const promises = asyncs
                    .filter(a => !!a)
                    .map(a => a(<AsyncContext<T>>{
                        action: context.action,
                        state: _state[nsKey],
                        value: context.value,
                        context: context.context,
                        globalState: _state,
                        factory: context.factory,
                        dispatch: context.dispatch
                    }))
                await Promise.all(promises)
            }

            const middlewareContext = <MiddleWareContext<T>>{ namespace, state, globalState: globalState, value, context, factory, dispatch: _dispatch, action }
            await _mainMiddleware(innerMiddleware)(middlewareContext)

            for (let i = 0; i < _children.length; i++) {
                await dispatch(_children[i].key, _children[i].value, _children[i].root)
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
            dispatch,
            getState
        }
    }

    return <StoreBuilder<T>>{
        addModule,
        addTransform,
        initialState,
        addAsync,
        addConfig,
        build,
        addFactory,
        addMiddleware,
        addErrorHandler,
        addTransformWrap
    }
}