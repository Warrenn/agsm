import { exampleStore } from '../example/wire-up'
import { AnotherState } from '../example/another-module'
import { ExampleState } from '../example/example-module'

test('doing a test', async () => {
  const store = exampleStore
    .addFactory("service", (config) => {
      return {
        fetch: async (value: any, state: ExampleState) => await new Promise((res) => {
          res(["a", "b"])
        })
      }
    })
    .build()
  let ss: ExampleState | AnotherState
  store.watch(({ state }) => ss = state)
  await store.dispatch("Call Service", { "service": 123 })

  console.log(JSON.stringify(ss))
  expect((<ExampleState>ss).collection.length).toBe(2)
})