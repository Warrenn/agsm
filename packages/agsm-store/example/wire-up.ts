import { ExampleState, exampleModule } from './example-module'
import { AnotherState, anotherModule } from './another-module'
import { createStoreBuilder } from '../src/store'

export const exampleStore = createStoreBuilder<AnotherState | ExampleState>()
    .addModule(exampleModule)
    .addModule(anotherModule)
    .addConfig({
        timeout: 2000,
        userTimer: 2000
    })