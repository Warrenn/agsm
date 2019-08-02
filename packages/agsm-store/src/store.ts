import { deepCopy } from './utils/utils'
import { StoreBuilder, AsyncCallback, FactoryDeclaration, MiddleWareChain, ErrorDeclaration, ErrorContext, MiddleWareContext, ModuleDeclaration, Store, WatchCallback, ServiceFactory, TransformContext, MiddleWareCallback, AsyncContext, TransformCallback, TransformChain } from './types'

export function createStoreBuilder<T>(): StoreBuilder<T> {
    const _transforms: { [key: string]: TransformCallback<T>[] } = {}
    const _asyncs: { [key: string]: AsyncCallback<T>[] } = {}
    const _factories: { [key: string]: FactoryDeclaration } = {}
    const _state: { [key: string]: any } = {}
    let _middlewares: MiddleWareChain<T>[] = []
    let _transformWraps: TransformChain<T>[] = []
    let _config: any = {}

    let _errorHandler: ErrorDeclaration<T> = (context: ErrorContext<T>) => console.error(`${JSON.stringify({
        context: context.context,
        state: context.state,
        rootState: context.rootState,
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
                rootState: ctx.rootState,
                factory: ctx.factory,
                action: ctx.action,
                namespace: ctx.namespace
            })
        }
    }

    function createTryCatchTransformWrap(factory: ServiceFactory): TransformChain<T> {
        return next => (ctx: TransformContext<T>) => {
            try { next(ctx) }
            catch (error) {
                _errorHandler({
                    error,
                    state: ctx.state,
                    action: ctx.action,
                    context: ctx.context,
                    factory: factory,
                    namespace: ctx.namespace,
                    rootState: ctx.rootState,
                    value: ctx.value
                })
            }
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

        _state[stateKey] = { ...(_state[stateKey] || {}), ...declaration.initialState }

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

        function getState<T>(key?: string) {
            key = key || "__"
            return <T>_state[key]
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

            const factory = <ServiceFactory>{
                createService: (key: string) => {
                    if (namespace && _initializedServices[`${namespace}:${key}`]) return _initializedServices[`${namespace}:${key}`]
                    if (_initializedServices[`${key}`]) return _initializedServices[`${key}`]
                    throw `the service for ${key} could not be found`
                }
            }
            let rootState: T = <T>deepCopy(_state["__"] || {})
            let state: T = <T>deepCopy(_state[nsKey] || {})
            let context = { config: _config }

            const innerTransform: TransformCallback<T> = ctx => transforms.map(t => t && t(ctx))
            const outerTransformWrap: TransformChain<T> = createTryCatchTransformWrap(factory)
            const mainTransformWrap: TransformChain<T> = [outerTransformWrap, ..._transformWraps]
                .reduce((a, b) => (...args) => a(b(...args)))

            const transContext = <TransformContext<T>>{ state, action, value, rootState, context, namespace }
            mainTransformWrap(innerTransform)(transContext)

            try { transforms.map(t => t && t(transContext)) }
            catch (error) { _errorHandler({ rootState, value, state, factory, error, context, action, namespace }) }

            _state["__"] = <T>deepCopy(rootState)
            _state[nsKey] = <T>deepCopy(state)

            if (transforms.length > 0) {
                const watchers: WatchCallback<T>[] = _watchers.slice()
                try { watchers.map(w => w && w({ state, rootState })) }
                catch (error) { _errorHandler({ rootState, value, state, factory, error, context, action, namespace }) }
            }

            const _children: { key: string, value: any, root?: boolean }[] = []
            const _dispatch = (act: string, value: any, root?: boolean) => {
                if (root || !namespace) _children.push({ key: act, value, root })
                else _children.push({ key: `${namespace}:${act}`, value, root })
            }

            const innerMiddleware: MiddleWareCallback<T> = async context => {
                const asyncContext = <AsyncContext<T>>{
                    action: context.action,
                    state: context.state,
                    value: context.value,
                    context: context.context,
                    rootState: context.rootState,
                    factory: context.factory,
                    dispatch: context.dispatch
                }
                const promises = asyncs.filter(m => !!m).map(m => m(asyncContext))
                await Promise.all(promises)
            }

            const middlewareContext = <MiddleWareContext<T>>{ namespace, state, rootState, value, context, factory, dispatch: _dispatch, action }
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