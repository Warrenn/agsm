import { ModuleDeclaration } from '../src/index'
import { createStoreBuilder } from '../src/store'

type TestState = {
  data: any
}

async function testStore(callback: (a: any, t: any) => ModuleDeclaration<TestState>, actions: string[], ns?: string, c?: number, root?: boolean) {
  c = c || 1
  let valueAsync: any = {}
  let valueTransform: any = {}
  let valueWatch: any = {}

  const testAsync = jest.fn(async ({ value }) => valueAsync = value)
  const testTransform = jest.fn(({ value, state }) => {
    valueTransform = value
    state.data = value
  })
  const testWatch = jest.fn(({ state }) => valueWatch = state)
  const testModule: ModuleDeclaration<TestState> = callback(testAsync, testTransform)
  const store = createStoreBuilder().addModule(testModule, ns).build()

  store.watch(testWatch)
  for (let action of actions)
    await store.dispatch(action, { v: "value" }, root)

  expect(testAsync.mock.calls.length).toBe(c)
  expect(testTransform.mock.calls.length).toBe(c)
  expect(testWatch.mock.calls.length).toBe(c)

  expect(valueAsync.v).toBe("value")
  expect(valueTransform.v).toBe("value")
  expect(valueWatch.data.v).toBe("value")
}

test('test async transform', async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "test": testAsync },
    transforms: { "test": testTransform }
  }, ["test"])
})

test("* must be called for all actions", async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "*": testAsync },
    transforms: { "*": testTransform }
  }, ["unkown"])
})

test("* must scoped to the namespace", async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "*": testAsync },
    transforms: { "*": testTransform }
  }, ["namespace:unkown", "unkown:do"], "namespace")

})

test("*.* must be used for all actions regardless of namespace", async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "*:*": testAsync },
    transforms: { "*:*": testTransform }
  }, ["namespace:unkown", "unknown:do"], "namespace", 2)

})

test("an exception in the transform must be caught by the error handler", async () => {
  let errorTransformValue: any = {}
  let errorState: any = {}
  let errorCheck: Error = new Error

  const errorTransform = jest.fn(({ value, state, error }) => {
    errorCheck = error
    errorTransformValue = value
    errorState = state
  })
  const store = createStoreBuilder().addModule(
    <ModuleDeclaration<TestState>>{
      transforms: {
        "throwError": () => { throw new Error("Error") }
      },
      error: errorTransform,
      initialState: <TestState>{
        data: "data"
      }
    }
  ).build()

  await store.dispatch("throwError", { v: "value" })

  expect(errorTransform.mock.calls.length).toBe(1)
  expect(errorCheck.message).toBe("Error")
  expect(errorState.data).toBe("data")
  expect(errorTransformValue.v).toBe("value")
})
test("an exception in the async must be caught by an error handler", async () => {
  let errorTransform: Error = new Error("not this value")
  let errorTransformValue: any = {}
  let errorState: any = {}
  const errorAsync = jest.fn(async ({ value, state, error }) => {
    errorTransform = error
    errorState = state
    errorTransformValue = value
  })

  const store = createStoreBuilder().addModule(
    <ModuleDeclaration<TestState>>{
      asyncs: {
        "throwError": async () => { throw new Error("Error") }
      },
      error: errorAsync,
      initialState: <TestState>{
        data: "data"
      }
    }
  ).build()

  await store.dispatch("throwError", { v: "value" })

  expect(errorAsync.mock.calls.length).toBe(1)
  expect(errorTransformValue.v).toBe("value")
  expect(errorState.data).toBe("data")
  expect(errorTransform.message).toBe("Error")

})

test("an exception in the watch must dispatch an $$ERROR action", async () => {
  let errorTransformError: Error = new Error("not this value")
  let errorState: any = {}
  let errorValue: any = {}

  const errorTransform = jest.fn(({ value, state, error }) => {
    errorTransformError = error
    errorState = state
    errorValue = value
  })
  const store = createStoreBuilder().addModule(
    <ModuleDeclaration<TestState>>{
      transforms: {
        "throwError": ({ value, state }) => { state.data = value }
      },
      error: errorTransform
    }
  ).build()

  store.watch(() => { throw new Error("Error") })
  await store.dispatch("throwError", { v: "value" })

  expect(errorTransform.mock.calls.length).toBe(1)
  expect(errorValue.v).toBe("value")
  expect(errorState.data.v).toBe("value")
  expect(errorTransformError.message).toBe("Error")

})

test("a dispatched action with root enabled must occur on the root regardless of namespace", async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "test": testAsync },
    transforms: { "test": testTransform }
  }, ["unknown:test"], undefined, undefined, true)
})