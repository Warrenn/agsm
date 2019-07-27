import { ModuleDeclaration } from '../src/index'
import { createStoreBuilder } from '../src/store'

type TestState = {
  data: any
}

async function testStore(callback: (a: any, t: any) => ModuleDeclaration<TestState>, action: string) {
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
  const store = createStoreBuilder().addModule(testModule).build()

  store.watch(testWatch)
  store.dispatch(action, { v: "value" })

  expect(testAsync.mock.calls.length).toBe(1)
  expect(testTransform.mock.calls.length).toBe(1)
  expect(testWatch.mock.calls.length).toBe(1)

  expect(valueAsync.v).toBe("value")
  expect(valueTransform.v).toBe("value")
  expect(valueWatch.data.v).toBe("value")
}

test('test async transform', async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "test": testAsync },
    transforms: { "test": testTransform }
  }, "test")
})

test("* must be called for all actions", async () => {
  await testStore((testAsync, testTransform) => <ModuleDeclaration<TestState>>{
    asyncs: { "*": testAsync },
    transforms: { "*": testTransform }
  }, "unkown")
})

test("* must scoped to the namespace", () => {

})

test("*.* must be used for all actions regardless of namespace", () => {

})