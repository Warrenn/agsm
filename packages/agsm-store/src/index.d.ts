export interface TransformContext<T> {
    state: T
    action: string
    value: any
    rootState: any
}

export interface ServiceFactory {
    createService(key: string): any
}

export declare type DispatchCallback = (action: string, value: any, root?: boolean) => Promise<void>

export interface MiddlewareContext<T> {
    action: string
    state: T
    value: any
    context: any
    rootState: T
    factory: ServiceFactory
    dispatch: DispatchCallback
}

export interface WatchCallbackContext<T> {
    state: T
    rootState: T
}

export declare type TransformCallback<T> = (context: TransformContext<T>) => void
export declare type GetterCallback<T> = (state: T) => any
export declare type MiddleWareCallback<T> = (context: MiddlewareContext<T>) => Promise<void>
export declare type FactoryDeclaration = (config: any) => any

export interface ModuleDeclaration<T> {
    transforms?: { [key: string]: TransformCallback<T> }
    asyncs?: { [key: string]: MiddleWareCallback<T> }
    middlewares?: MiddleWareCallback<T>[]
    factories?: { [key: string]: FactoryDeclaration }
    initialState?: T
}

export interface StoreBuilder<T> {
    addModule: (declaration: ModuleDeclaration<T>, namespace?: string) => StoreBuilder<T>
    addMiddleware: (callback: MiddleWareCallback<T>, namespace?: string) => StoreBuilder<T>
    addTransform: (key: string, callback: TransformCallback<T>, namespace?: string) => StoreBuilder<T>
    addAsync: (key: string, callback: MiddleWareCallback<T>, namespace?: string) => StoreBuilder<T>
    initialState: (initialState: any, namespace?: string) => StoreBuilder<T>
    addConfig: (config: any) => StoreBuilder<T>
    addFactory: (key: string, factory: FactoryDeclaration, namespace?: string) => StoreBuilder<T>
    build: () => Store<T>
}

export declare type WatchCallback<T> = (context: WatchCallbackContext<T>) => void

export interface Store<T> {
    watch: (callback: WatchCallback<T>) => () => void
    dispatch: (action: string, value: any) => void
}
