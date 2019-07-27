import { ModuleDeclaration, TransformCallback, AsyncCallback, FactoryDeclaration, StoreBuilder, Store, WatchCallback, TransformContext, AsyncContext, ServiceFactory } from './index.d'
import { deepCopy } from './utils/utils'

export function createStoreBuilder<T>(): StoreBuilder<T> {
    const _transforms: { [key: string]: TransformCallback<T>[] } = {}
    const _asyncs: { [key: string]: AsyncCallback<T>[] } = {}
    const _factories: { [key: string]: FactoryDeclaration } = {}
    const _state: { [key: string]: any } = {}
    let _config: any = {}

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

        const factories = declaration.factories || {}
        Object.keys(factories).map(k => _factories[`${namespace}${k}`] = factories[k])

        _state[stateKey] = { ...(_state[stateKey] || {}), ...declaration.initialState }

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

    function build(): Store<T> {
        const _watchers: WatchCallback<T>[] = []
        const _initializedServices: { [key: string]: any } = {}

        Object.keys(_factories).map(k => _initializedServices[k] = _factories[k](_config))

        async function dispatch(actionNs: string, value: any): Promise<void> {
            if (!actionNs) throw "The action must be provided for dispatch"

            let namespace = ""
            let allMatches = "*"
            const split = actionNs.split(":")
            if (split.length > 1) {
                namespace = split[0]
                allMatches = `${namespace}:*`
            }

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

            const transContext = <TransformContext<T>>{ state, action: actionNs, value, rootState }
            try { transforms.map(t => t && t(transContext)) }
            catch (error) { try { dispatch("$$ERROR", error) } catch (inner) { console.error(inner) } }

            _state["__"] = <T>deepCopy(rootState)
            _state[nsKey] = <T>deepCopy(state)

            if (transforms.length > 0) {
                const watchers: WatchCallback<T>[] = _watchers.slice()
                try { watchers.map(w => w && w({ state, rootState })) }
                catch (error) { try { dispatch("$$ERROR", error) } catch (inner) { console.error(inner) } }
            }

            const _children: { key: string, value: any }[] = []
            const _dispatch = (act: string, value: any, root?: boolean) => {
                if (root || !namespace) _children.push({ key: act, value })
                else _children.push({ key: `${namespace}:${act}`, value })
            }

            const asyncContext = <AsyncContext<T>>{ state, rootState, value, context: _config, factory, dispatch: _dispatch, action: actionNs }
            const promises = asyncs.filter(m => !!m).map(m => m(asyncContext))

            await Promise.all(promises)
            for (let i = 0; i < _children.length; i++) {
                try { await dispatch(_children[i].key, _children[i].value) }
                catch (error) { try { dispatch("$$ERROR", error) } catch (inner) { console.error(inner) } }
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
        addTransform,
        initialState,
        addAsync,
        addConfig,
        build,
        addFactory
    }
}