import { ExampleState, exampleModule } from './example-module'
import { AnotherState, anotherModule } from './another-module'
import { createStoreBuilder } from '../src/store'

export const exampleStore = createStoreBuilder<ExampleState | AnotherState>()
    .addModule(anotherModule)
    .addModule(exampleModule)
    .addConfig({ baseUrl: 'https://example/' })