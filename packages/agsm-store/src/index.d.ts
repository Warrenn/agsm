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

export interface AsyncContext<T> {
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

export interface ErrorContext<T> {
    error: Error
    state: T
    value: any
    context: any
    rootState: T
    factory: ServiceFactory
    dispatch: DispatchCallback
}

export declare type TransformCallback<T> = (context: TransformContext<T>) => void
export declare type AsyncCallback<T> = (context: AsyncContext<T>) => Promise<void>
export declare type FactoryDeclaration = (config: any) => any
export declare type ErrorDeclaration<T> = (error: ErrorContext<T>) => void

export interface ModuleDeclaration<T> {
    transforms?: { [key: string]: TransformCallback<T> }
    asyncs?: { [key: string]: AsyncCallback<T> }
    factories?: { [key: string]: FactoryDeclaration }
    error?: ErrorDeclaration<T>
    initialState?: T
}

export interface StoreBuilder<T> {
    addModule: (declaration: ModuleDeclaration<T>, namespace?: string) => StoreBuilder<T>
    addTransform: (key: string, callback: TransformCallback<T>, namespace?: string) => StoreBuilder<T>
    addAsync: (key: string, callback: AsyncCallback<T>, namespace?: string) => StoreBuilder<T>
    initialState: (initialState: any, namespace?: string) => StoreBuilder<T>
    addConfig: (config: any) => StoreBuilder<T>
    addFactory: (key: string, factory: FactoryDeclaration, namespace?: string) => StoreBuilder<T>
    addErrorHandler: (handler: ErrorDeclaration<T>)=>StoreBuilder<T>
    build: () => Store<T>
}

export declare type WatchCallback<T> = (context: WatchCallbackContext<T>) => void

export interface Store<T> {
    watch: (callback: WatchCallback<T>) => () => void
    dispatch: (action: string, value: any) => void
}
