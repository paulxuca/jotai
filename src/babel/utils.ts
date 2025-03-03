import { types } from '@babel/core'

export interface PluginOptions {
  customAtomNames?: string[]
}

export function isAtom(
  t: typeof types,
  callee: babel.types.Expression | babel.types.V8IntrinsicIdentifier,
  customAtomNames: PluginOptions['customAtomNames'] = []
) {
  if (t.isIdentifier(callee) && atomFunctionNames.includes(callee.name)) {
    return true
  }

  if (t.isMemberExpression(callee)) {
    const { property } = callee
    if (
      t.isIdentifier(property) &&
      [...atomFunctionNames, ...customAtomNames].includes(property.name)
    ) {
      return true
    }
  }
  return false
}

const atomFunctionNames = [
  'abortableAtom',
  'atom',
  'atomFamily',
  'atomWithDefault',
  'atomWithHash',
  'atomWithImmer',
  'atomWithInfiniteQuery',
  'atomWithMachine',
  'atomWithMutation',
  'atomWithObservable',
  'atomWithProxy',
  'atomWithQuery',
  'atomWithReducer',
  'atomWithReset',
  'atomWithSubscription',
  'atomWithStorage',
  'atomWithStore',
  'freezeAtom',
  'loadable',
  'selectAtom',
  'splitAtom',
]
