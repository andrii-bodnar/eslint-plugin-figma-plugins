import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/typescript-estree'
import { addAsyncCallFix, createPluginRule, getTypeName, matchAncestorTypes } from '../util'

// Calls to createPluginRule() cause typechecker errors without this import.
// This is a TypeScript bug; cf https://github.com/microsoft/TypeScript/issues/47663
import type { TSESLint as _ } from '@typescript-eslint/utils'

interface DynamicPageBannedSyncMethod {
  method: string
  replacement: string
  receiverTypes: string[]
}

const dynamicPageBannedSyncMethods: DynamicPageBannedSyncMethod[] = [
  {
    method: 'getNodeById',
    replacement: 'getNodeByIdAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getStyleById',
    replacement: 'getStyleByIdAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getFileThumbnailNode',
    replacement: 'getFileThumbnailNodeAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getLocalTextStyles',
    replacement: 'getLocalTextStylesAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getLocalPaintStyles',
    replacement: 'getLocalPaintStylesAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getLocalEffectStyles',
    replacement: 'getLocalEffectStylesAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getLocalGridStyles',
    replacement: 'getLocalGridStylesAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    method: 'getVariableById',
    replacement: 'getVariableByIdAsync',
    receiverTypes: ['VariablesAPI'],
  },
  {
    method: 'getVariableCollectionById',
    replacement: 'getVariableCollectionByIdAsync',
    receiverTypes: ['VariablesAPI'],
  },
  {
    method: 'getLocalVariableCollections',
    replacement: 'getLocalVariableCollectionsAsync',
    receiverTypes: ['VariablesAPI'],
  },
  {
    method: 'getLocalVariables',
    replacement: 'getLocalVariablesAsync',
    receiverTypes: ['VariablesAPI'],
  },
  {
    method: 'setRangeTextStyle',
    replacement: 'setRangeTextStyleIdAsync',
    receiverTypes: ['NonResizableTextMixin'],
  },
  {
    method: 'setRangeFillStyle',
    replacement: 'setRangeFillStyleIdAsync',
    receiverTypes: ['NonResizableTextMixin'],
  },
]

export const dynamicPageBanSyncMethods = createPluginRule({
  name: 'dynamic-page-ban-sync-methods',
  meta: {
    docs: {
      description: 'Ban synchronous methods that are not compatible with `dynamic-page`',
    },
    fixable: 'code',
    messages: {
      useReplacement:
        '{{receiverType}}.{{method}} is not compatible with the dynamic-page manifest option. Please use {{replacement}} instead.',
    },
    schema: [],
    type: 'problem',
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        const callee = node.callee
        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return
        }

        const calleeProp = callee.property
        if (calleeProp.type !== AST_NODE_TYPES.Identifier) {
          return
        }

        const deprecation = dynamicPageBannedSyncMethods.find((m) => m.method === calleeProp.name)
        if (!deprecation) {
          return
        }

        const receiver = callee.object
        const match = matchAncestorTypes(context, receiver, deprecation.receiverTypes)
        if (!match) {
          return
        }

        context.report({
          node,
          messageId: 'useReplacement',
          data: {
            receiverType: getTypeName(match.nodeType, match.matchedAncestorType),
            method: deprecation.method,
            replacement: deprecation.replacement,
          },
          fix(fixer) {
            return addAsyncCallFix({
              context,
              fixer,
              expression: node,
              receiver: receiver,
              asyncIdentifier: deprecation.replacement,
              args: node.arguments,
            })
          },
        })
      },
    }
  },
})
