import { ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator((name) => `https://example.com/rule/${name}`)

export const demoRuleA = createRule({
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (node.id != null) {
          if (/^[a-z]/.test(node.id.name)) {
            context.report({
              messageId: 'uppercase',
              node: node.id,
            })
          }
        }
      },
    }
  },
  name: 'demo-rule-a',
  meta: {
    docs: {
      description: 'Function declaration names should start with an upper-case letter.',
      recommended: 'recommended',
    },
    messages: {
      uppercase: 'Start this name with an upper-case letter.',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
})
