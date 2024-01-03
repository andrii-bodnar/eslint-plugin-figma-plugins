import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/typescript-estree'
import { addAsyncCallFix, createPluginRule, getTypeName, matchAncestorTypes } from '../util'

// Calls to createPluginRule() cause typechecker errors without this import.
// This is a TypeScript bug; cf https://github.com/microsoft/TypeScript/issues/47663
import type { TSESLint as _ } from '@typescript-eslint/utils'

interface DynamicPageBannedSyncPropSetter {
  property: string
  replacement: string
  receiverTypes: string[]
}

const dynamicPageBannedSyncPropSetters: DynamicPageBannedSyncPropSetter[] = [
  {
    property: 'currentPage',
    replacement: 'setCurrentPageAsync',
    receiverTypes: ['PluginAPI'],
  },
  {
    property: 'effectStyleId',
    replacement: 'setEffectStyleIdAsync',
    receiverTypes: ['BlendMixin'],
  },
  {
    property: 'fillStyleId',
    replacement: 'setFillStyleIdAsync',
    receiverTypes: ['MinimalFillsMixin'],
  },
  {
    property: 'gridStyleId',
    replacement: 'setGridStyleIdAsync',
    receiverTypes: ['BaseFrameMixin'],
  },
  {
    property: 'strokeStyleId',
    replacement: 'setStrokeStyleIdAsync',
    receiverTypes: ['MinimalStrokesMixin'],
  },
  {
    property: 'textStyleId',
    replacement: 'setTextStyleIdAsync',
    receiverTypes: ['TextNode'],
  },
  {
    property: 'backgroundStyleId',
    replacement: 'setFillStyleIdAsync',
    receiverTypes: ['DeprecatedBackgroundMixin'],
  },
]

export const dynamicPageBanSyncPropSetters = createPluginRule({
  name: 'dynamic-page-ban-sync-prop-setters',
  meta: {
    docs: {
      description: 'Ban synchronous property getters that are not compatible with `dynamic-page`',
    },
    fixable: 'code',
    messages: {
      useReplacement:
        'Assigning to {{receiverType}}.{{property}} is deprecated. Please use {{replacement}} instead.',
    },
    schema: [],
    type: 'problem',
  },
  defaultOptions: [],
  create(context) {
    return {
      AssignmentExpression(node: TSESTree.AssignmentExpression) {
        if (node.left.type !== AST_NODE_TYPES.MemberExpression) {
          return
        }

        const prop = node.left.property
        if (prop.type !== AST_NODE_TYPES.Identifier) {
          return
        }

        const deprecation = dynamicPageBannedSyncPropSetters.find((s) => s.property === prop.name)
        if (!deprecation) {
          return
        }

        const receiver = node.left.object
        const match = matchAncestorTypes(context, receiver, deprecation.receiverTypes)
        if (!match) {
          return
        }

        context.report({
          node,
          messageId: 'useReplacement',
          data: {
            receiverType: getTypeName(match.nodeType, match.matchedAncestorType),
            property: deprecation.property,
            replacement: deprecation.replacement,
          },
          fix(fixer) {
            return addAsyncCallFix({
              context,
              fixer,
              expression: node,
              receiver,
              asyncIdentifier: deprecation.replacement,
              args: [node.right],
            })
          },
        })
      },
    }
  },
})
