/**
 *The context used in the transform function when transforming state
 *
 * @export
 * @interface TransformContext
 * @template T
 */
export interface TransformContext<T> {
    /**
     *The current state scoped to the current namespace
     *
     * @type {T}
     * @memberof TransformContext
     */
    state: T
    /**
     *Name of the action that was dispatched
     *
     * @type {string}
     * @memberof TransformContext
     */
    action: string
    /**
     *The current namespace that the transform is scoped to
     *
     * @type {string}
     * @memberof TransformContext
     */
    namespace: string
    /**
     *Value of the dispatched action
     *
     * @type {*}
     * @memberof TransformContext
     */
    value: any
    /**
     *The root state which is namespace agnostic
     *
     * @type {*}
     * @memberof TransformContext
     */
    globalState: any
    /**
     *Volitile context data that will be passed to each transform and then onto the asyncs
     *
     * @type {*}
     * @memberof TransformContext
     */
    context: any
}

/**
 *Factory to create services for a given key. A service is identified by key and is initialized once with config 
 *data when the store is built. Services can be overiden by definitions if a declaration in the store builder has 
 *the same key once a store is created there will only ever be one service instance per key. 
 *
 * @export
 * @interface ServiceFactory
 */
export interface ServiceFactory {
    /**
     *Function that can be called to obtain the service instance for the corresponding key.
     *
     * @param {string} key
     * @returns {*}
     * @memberof ServiceFactory
     */
    createService(key: string): any
}

export declare type DispatchCallback = (action: string, value: any, root?: boolean) => Promise<void>

/**
 *Context instance for async functions
 *
 * @export
 * @interface AsyncContext
 * @template T
 */
export interface AsyncContext<T> {
    /**
     *The action name that was recently dispatched
     *
     * @type {string}
     * @memberof AsyncContext
     */
    action: string
    /**
    *The current namespace that the store is currently scoped to
    *
    * @type {string}
    * @memberof ErrorContext
    */
    namespace: string
    /**
     *Current state of the store scoped to the current namespace
     *
     * @type {T}
     * @memberof AsyncContext
     */
    state: T
    /**
     *Value of the dispatched action
     *
     * @type {*}
     * @memberof AsyncContext
     */
    value: any
    /**
     *Context value passed from transformers and carried through to all the async and middleware functions
     *
     * @type {*}
     * @memberof AsyncContext
     */
    context: any
    /**
     *Global state of the store which includes all namespaces regardless of the current namespace scope
     *
     * @type {GlobalState<T>}
     * @memberof AsyncContext
     */
    globalState: GlobalState<T>
    /**
     *Factory to return created service instances identified by key
     *
     * @type {ServiceFactory}
     * @memberof AsyncContext
     */
    factory: ServiceFactory
    /**
     *Function to dispatch further action. Dispatched actions in an async function will always keep their namespace
     *
     * @type {DispatchCallback}
     * @memberof AsyncContext
     */
    dispatch: DispatchCallback
}

/**
 *Context relevent for middlware functions
 *
 * @export
 * @interface MiddleWareContext
 * @template T
 */
export interface MiddleWareContext<T> {
    /**
     *The action name that was recently dispatched
     *
     * @type {string}
     * @memberof MiddleWareContext
     */
    action: string
    /**
     *
     *
     * @type {T}
     * @memberof MiddleWareContext
     */
    state: T
    /**
     *Current state of the store scoped to the current namespace
     *
     * @type {*}
     * @memberof MiddleWareContext
     */
    value: any
    /**
     *Context value passed from transformers and carried through to all the async and middleware functions
     *
     * @type {*}
     * @memberof MiddleWareContext
     */
    context: any
    /**
     *Global state of the store for all namespaces regardless of the currently scoped namespace
     *
     * @type {GlobalState<T>}
     * @memberof MiddleWareContext
     */
    globalState: GlobalState<T>
    /**
     *The namespace is the scope under which all transforms and async functions are executing
     *
     * @type {string}
     * @memberof MiddleWareContext
     */
    namespace: string
    /**
     *Factory to return created service instances identified by key
     *
     * @type {ServiceFactory}
     * @memberof MiddleWareContext
     */
    factory: ServiceFactory
    /**
     *Function to dispatch further action. Dispatched actions in an async function will always keep their namespace
     *
     * @type {DispatchCallback}
     * @memberof MiddleWareContext
     */
    dispatch: DispatchCallback
}

/**
 *Context data for watch callback functions that will be called when the state of the store has changed
 *
 * @export
 * @interface WatchCallbackContext
 * @template T
 */
export interface WatchCallbackContext<T> {
    /**
     *The current state of the store scoped to the current namespace
     *
     * @type {T}
     * @memberof WatchCallbackContext
     */
    state: T
    /**
     *The global state of the store including all namespace scopes
     *
     * @type {GlobalState<T>}
     * @memberof WatchCallbackContext
     */
    globalState: GlobalState<T>
}

/**
 *Context data for Error Handlers
 *
 * @export
 * @interface ErrorContext
 * @template T
 */
export interface ErrorContext<T> {
    /**
     *The error that was bubbled from transform, watch or async function
     *
     * @type {Error}
     * @memberof ErrorContext
     */
    error: Error
    /**
     *State of the store at the time of the error scoped to the current namespace
     *
     * @type {T}
     * @memberof ErrorContext
     */
    state: T
    /**
     *The action that was dispatched
     *
     * @type {string}
     * @memberof ErrorContext
     */
    action: string
    /**
     *The current namespace that the store is currently scoped to
     *
     * @type {string}
     * @memberof ErrorContext
     */
    namespace: string
    /**
     *Value of the action that was last dispatched
     *
     * @type {*}
     * @memberof ErrorContext
     */
    value: any
    /**
     *Context data carried accross transforms and asyncs
     *
     * @type {*}
     * @memberof ErrorContext
     */
    context: any
    /**
     *Root state of the store agnostice to namespace
     *
     * @type {GlobalState<T>}
     * @memberof ErrorContext
     */
    globalState: GlobalState<T>
    /**
     *Factory to return service instance corresponding to given key
     *
     * @type {ServiceFactory}
     * @memberof ErrorContext
     */
    factory: ServiceFactory
}

export declare type TransformChain<T> = (next: TransformCallback<T>) => TransformCallback<T>
export declare type MiddleWareChain<T> = (next: MiddleWareCallback<T>) => MiddleWareCallback<T>
export declare type MiddleWareCallback<T> = (context: MiddleWareContext<T>) => Promise<void>
export declare type TransformCallback<T> = (context: TransformContext<T>) => void
export declare type AsyncCallback<T> = (context: AsyncContext<T>) => Promise<void>
export declare type FactoryDeclaration = (config: any) => any
export declare type ErrorDeclaration<T> = (error: ErrorContext<T>) => void
export declare type GlobalState<T> = { [namespace: string]: T }

/**
 *Module declaration for a state type including transforms,asyncs,factories,middlewares,transformWraps,errorhandler 
 *and initialState. A module declaration is the fundamental unit used to compose a store via the store builder. 
 *Modules can achieve isolation through namespaces or are merged into the global state management through the 
 *instrumentation made on the store builder 
 *
 * @export
 * @interface ModuleDeclaration
 * @template T
 */
export interface ModuleDeclaration<T> {
    /**
     *The array of method chains that wrap the transform functions. Starting from the outer 
     *most functions going to the inner functions
     *
     * @type {TransformChain<T>[]}
     * @memberof ModuleDeclaration
     */
    transformWraps?: TransformChain<T>[]
    /**
     *Transform functions that will transform the store's state for a given action identified by the key
     *
     * @type {{ [key: string]: TransformCallback<T> }}
     * @memberof ModuleDeclaration
     */
    transforms?: { [key: string]: TransformCallback<T> }
    /**
     *Asyncronous functions that will be run in parallel when a given action identified by the key is dispatched
     *
     * @type {{ [key: string]: AsyncCallback<T> }}
     * @memberof ModuleDeclaration
     */
    asyncs?: { [key: string]: AsyncCallback<T> }
    /**
     *Service creation method for each service identified by the key provided. Factory declarations are 
     *functions that will initialize a service with the provided config and return the instance of the 
     *initialized service. The store will use only one instance of a service per key. Service declarations
     * can be overriden in store builders
     *
     * @type {{ [key: string]: FactoryDeclaration }}
     * @memberof ModuleDeclaration
     */
    factories?: { [key: string]: FactoryDeclaration }
    /**
     *Middleware functions that wrap the async functions. Middleware functions wrap in order of declaration from
     *outer to inner
     *
     * @type {MiddleWareChain<T>[]}
     * @memberof ModuleDeclaration
     */
    middlewares?: MiddleWareChain<T>[]
    /**
     *Error Handler function to catch any exceptions that bubble from the transfroms, asyncs or watches
     *
     * @type {ErrorDeclaration<T>}
     * @memberof ModuleDeclaration
     */
    errorHandler?: ErrorDeclaration<T>
    /**
     *The initial value of the state of the store for the defined module
     *
     * @type {T}
     * @memberof ModuleDeclaration
     */
    initialState?: T
}

/**
 *Store builder is the fundamental orchestrating tool to instrument the creation of the global store. Store Builder
 *will merge defined modules and allows for additional declartions to be added. Declarations can be chained 
 *together. Only once the builder calls build will the store be created and once created the store declarations 
 *can no longer be changed. 
 *
 * @export
 * @interface StoreBuilder
 * @template T
 */
export interface StoreBuilder<T> {
    /**
     *Will add the module declaration to the store definition. The module can be isolated to a defined namespace 
     *in which the state, dispatched actions, transforms and asyncs will all be scoped to the provided namespace
     *
     * @memberof StoreBuilder
     */
    addModule: (declaration: ModuleDeclaration<T>, namespace?: string) => StoreBuilder<T>
    /**
     *Prepends transform chain functions to the array of already declared transform functions. Transform chain
     *functions wrap transform functions
     *
     * @memberof StoreBuilder
     */
    addTransformWrap: (chain: TransformChain<T>) => StoreBuilder<T>
    /**
     *Prepend middleware chain functions to the array of already declared middleware functions. Middleware 
     *functions wrap async functions
     *
     * @memberof StoreBuilder
     */
    addMiddleware: (chain: MiddleWareChain<T>) => StoreBuilder<T>
    /**
     *Add a transform function to the array of already declared transforms. Transform functions will transform 
     *the store's state for a given action identified by the specified key. A transform function can be scoped 
     *to a namespace which means the transform will only be called when an action is dispatched in the context 
     *of the specified namespace
     *
     * @memberof StoreBuilder
     */
    addTransform: (key: string, callback: TransformCallback<T>, namespace?: string) => StoreBuilder<T>
    /**
     *Add an async function to the array of already declared asyncs. An async function will run in parallel with
     *other async functions for the given action specified by the key. An async function can be scoped to a 
     *namespace which means the async function will only run when an action is dispatched in the context of the 
     *specified namespace
     *
     * @memberof StoreBuilder
     */
    addAsync: (key: string, callback: AsyncCallback<T>, namespace?: string) => StoreBuilder<T>
    /**
     *Initializes the state of the store. InitialState will override values if previously initialize and can be 
     *scoped to a given namespace
     *
     * @memberof StoreBuilder
     */
    initialState: (initialState: any, namespace?: string) => StoreBuilder<T>
    /**
     *Config is the configuration values passed in to the Factory declarations to create an instance of a service. 
     *Config is global regardless of namespace and carried over in calls via the context object as the property 
     * named config
     *
     * @memberof StoreBuilder
     */
    addConfig: (config: any) => StoreBuilder<T>
    /**
     *Adds a factory declaration for a service identified by the key. A factory declaration is how a service 
     *instance is created when provided the config values. Factory declaration with the same key declared earlier 
     *will be overrided. Factory declarations can be scoped to a namespace. When the create service is called the
     *lookup on key will be first to the scoped namespace then on the root namespace
     *
     * @memberof StoreBuilder
     */
    addFactory: (key: string, factory: FactoryDeclaration, namespace?: string) => StoreBuilder<T>
    /**
     *Defines the error handling function for any error that might have bubbled up from transforms, 
     *asyncs and watches. It will override any already declared error handler
     *
     * @memberof StoreBuilder
     */
    addErrorHandler: (handler: ErrorDeclaration<T>) => StoreBuilder<T>
    /**
     *Builds the global store for the given declarations and models. It initializes the services and listens for
     *actions. Once built the store can no longer change its declarations
     *
     * @memberof StoreBuilder
     */
    build: () => Store<T>
}

export declare type WatchCallback<T> = (context: WatchCallbackContext<T>) => void

/**
 *The Global store that is instrumented from the Store Builder. The store is used to pass to the UI where any
 *state changes can be monitored and can be used to dispatch actions.
 *
 * @export
 * @interface Store
 * @template T
 */
export interface Store<T> {
    /**
     *The function used to subscribe to any state changes in the store it returns a function to unsubscribe from
     *monitoring. Once subscribed the subscriber must unsubscribe to prevent any further state change notifications
     *
     * @memberof Store
     */
    watch: (callback: WatchCallback<T>) => () => void
    /**
     *Dispatch will dispatch an action with a given value on the store to any transformers or asyncs listening 
     *for the action specified. Dispatch will by default dispatch an action within in the currently set scope 
     *unless root is set to true.
     *
     * @memberof Store
     */
    dispatch: (action: string, value: any, root?: boolean) => void
    /**
     *Returns the state of the store currently. It can be used to get the state of the store for a given 
     *namespace by default it will return the root state
     *
     * @memberof Store
     */
    getState: (namespace?: string) => T
}
