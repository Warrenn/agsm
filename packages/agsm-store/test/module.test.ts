import { exampleStore } from '../example/wire-up'
import { AnotherState } from '../example/another-module'
import { ExampleState } from '../example/example-module'

test('doing a test', async () => {
  const store = exampleStore
    .addFactory("service", (config) => {
      return {
        fetch: async (value: any, state: ExampleState) => ["a", "b"]
      }
    })
    .build()

  let ss: ExampleState | AnotherState
  store.watch(({ state }) => ss = state)
  await store.dispatch("Call Service", { "service": 123 })

  expect((<ExampleState>ss).collection.length).toBe(2)
})

test("* must be called for all actions", () => {

})

test("* must scoped to the namespace", () => {

})

test("*.* must be used for all actions regardless of namespace", () => {

})