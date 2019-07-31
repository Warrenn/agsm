import { ModuleDeclaration, createStoreBuilder } from '../src/index'

type TestState = {
    data: any
}
/*
test("when an error is thrown", () => {
    let errorValue: any = {}
    let errorState: any = {}

    const testTransform = jest.fn(({ value, state }) => state.data = value)
    const errorTransform = jest.fn(({ value, state }) => {
        errorValue = value
        errorState = state
    })
    const testWatch = jest.fn(() => { throw new Error("Error") })
    const store = createStoreBuilder()
        .addModule(<ModuleDeclaration<TestState>>{
            transforms: {
                "throwError": testTransform,
                "$$ERROR": errorTransform
            }
        })
        .build()

    store.watch(testWatch)
    store.dispatch("throwError", { v: "value" })

    expect(testTransform.mock.calls.length).toBe(1)
    expect(testWatch.mock.calls.length).toBe(1)

    expect(errorValue.message).toBe("Error")
    expect(errorState.data.v).toBe("value")
})*/