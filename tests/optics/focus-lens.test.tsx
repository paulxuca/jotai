import { StrictMode, Suspense } from 'react'
import { fireEvent, render } from '@testing-library/react'
import * as O from 'optics-ts'
import { atom, useAtom } from 'jotai'
import type { SetStateAction } from 'jotai'
import { focusAtom } from 'jotai/optics'
import { getTestProvider } from '../testUtils'

const Provider = getTestProvider()

const succ = (input: number) => input + 1

it('basic derivation using focus works', async () => {
  const bigAtom = atom({ a: 0 })
  const focusFunction = (optic: O.OpticFor<{ a: number }>) => optic.prop('a')

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction))
    const [bigAtomValue] = useAtom(bigAtom)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount(succ)}>incr</button>
        <button onClick={() => setCount(0)}>set zero</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Provider>
        <Counter />
      </Provider>
    </StrictMode>
  )

  await findByText('count: 0')
  await findByText('bigAtom: {"a":0}')

  fireEvent.click(getByText('incr'))
  await findByText('count: 1')
  await findByText('bigAtom: {"a":1}')

  fireEvent.click(getByText('incr'))
  await findByText('count: 2')
  await findByText('bigAtom: {"a":2}')

  fireEvent.click(getByText('set zero'))
  await findByText('count: 0')
  await findByText('bigAtom: {"a":0}')
})

it('focus on an atom works', async () => {
  const bigAtom = atom({ a: 0 })
  const focusFunction = (optic: O.OpticFor<{ a: number }>) => optic.prop('a')

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction))
    const [bigAtomValue] = useAtom(bigAtom)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount(succ)}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Provider>
        <Counter />
      </Provider>
    </StrictMode>
  )

  await findByText('count: 0')
  await findByText('bigAtom: {"a":0}')

  fireEvent.click(getByText('button'))
  await findByText('count: 1')
  await findByText('bigAtom: {"a":1}')
})

it('double-focus on an atom works', async () => {
  const bigAtom = atom({ a: { b: 0 } })
  const atomA = focusAtom(bigAtom, (optic) => optic.prop('a'))
  const atomB = focusAtom(atomA, (optic) => optic.prop('b'))

  const Counter = () => {
    const [bigAtomValue, setBigAtom] = useAtom(bigAtom)
    const [atomAValue, setAtomA] = useAtom(atomA)
    const [atomBValue, setAtomB] = useAtom(atomB)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>atomA: {JSON.stringify(atomAValue)}</div>
        <div>atomB: {JSON.stringify(atomBValue)}</div>
        <button onClick={() => setBigAtom((v) => ({ a: { b: v.a.b + 1 } }))}>
          inc bigAtom
        </button>
        <button onClick={() => setAtomA((v) => ({ b: v.b + 2 }))}>
          inc atomA
        </button>
        <button onClick={() => setAtomB((v) => v + 3)}>inc atomB</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Provider>
        <Counter />
      </Provider>
    </StrictMode>
  )

  await findByText('bigAtom: {"a":{"b":0}}')
  await findByText('atomA: {"b":0}')
  await findByText('atomB: 0')

  fireEvent.click(getByText('inc bigAtom'))
  await findByText('bigAtom: {"a":{"b":1}}')
  await findByText('atomA: {"b":1}')
  await findByText('atomB: 1')

  fireEvent.click(getByText('inc atomA'))
  await findByText('bigAtom: {"a":{"b":3}}')
  await findByText('atomA: {"b":3}')
  await findByText('atomB: 3')

  fireEvent.click(getByText('inc atomB'))
  await findByText('bigAtom: {"a":{"b":6}}')
  await findByText('atomA: {"b":6}')
  await findByText('atomB: 6')
})

it('focus on async atom works', async () => {
  const baseAtom = atom({ count: 0 })
  const asyncAtom = atom(
    (get) => Promise.resolve(get(baseAtom)),
    (_get, set, param: SetStateAction<{ count: number }>) => {
      set(baseAtom, param)
    }
  )
  const focusFunction = (optic: O.OpticFor<{ count: number }>) =>
    optic.prop('count')

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(asyncAtom, focusFunction))
    const [asyncValue, setAsync] = useAtom(asyncAtom)
    const [baseValue, setBase] = useAtom(baseAtom)
    return (
      <>
        <div>baseAtom: {JSON.stringify(baseValue)}</div>
        <div>asyncAtom: {JSON.stringify(asyncValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount(succ)}>incr count</button>
        <button onClick={() => setAsync((v) => ({ count: v.count + 1 }))}>
          incr async
        </button>
        <button onClick={() => setBase((v) => ({ count: v.count + 1 }))}>
          incr base
        </button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Provider>
        <Suspense fallback={<div>Loading...</div>}>
          <Counter />
        </Suspense>
      </Provider>
    </StrictMode>
  )

  await findByText('baseAtom: {"count":0}')
  await findByText('asyncAtom: {"count":0}')
  await findByText('count: 0')

  await new Promise((r) => setTimeout(r, 100))
  fireEvent.click(getByText('incr count'))
  await findByText('baseAtom: {"count":1}')
  await findByText('asyncAtom: {"count":1}')
  await findByText('count: 1')

  await new Promise((r) => setTimeout(r, 100))
  fireEvent.click(getByText('incr async'))
  await findByText('baseAtom: {"count":2}')
  await findByText('asyncAtom: {"count":2}')
  await findByText('count: 2')

  await new Promise((r) => setTimeout(r, 100))
  fireEvent.click(getByText('incr base'))
  await findByText('baseAtom: {"count":3}')
  await findByText('asyncAtom: {"count":3}')
  await findByText('count: 3')
})

it('basic derivation using focus with scope works', async () => {
  const scope = Symbol()
  const bigAtom = atom({ a: 0 })
  const focusFunction = (optic: O.OpticFor<{ a: number }>) => optic.prop('a')

  const Counter = () => {
    const [count, setCount] = useAtom(focusAtom(bigAtom, focusFunction), scope)
    const [bigAtomValue] = useAtom(bigAtom, scope)
    return (
      <>
        <div>bigAtom: {JSON.stringify(bigAtomValue)}</div>
        <div>count: {count}</div>
        <button onClick={() => setCount(succ)}>incr</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Provider scope={scope}>
        <Counter />
      </Provider>
    </StrictMode>
  )

  await findByText('count: 0')
  await findByText('bigAtom: {"a":0}')

  fireEvent.click(getByText('incr'))
  await findByText('count: 1')
  await findByText('bigAtom: {"a":1}')
})
