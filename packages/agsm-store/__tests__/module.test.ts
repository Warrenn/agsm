import { ModuleDeclaration } from '../src/index'
import { createStoreBuilder } from '../src/store'

type TestState = {
  data: any
}

async function testStore(callback: (a: any, t: any) => ModuleDeclaration<TestState>, actions: string[], ns?: string, c?: number) {
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
    await store.dispatch(action, { v: "value" })

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