import { RuleTester } from '@typescript-eslint/utils/ts-eslint'
import * as path from 'path'

export function ruleTester(): RuleTester {
  return new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
      tsconfigRootDir: path.join(__dirname, 'fixture'),
      project: path.join(__dirname, 'fixture', 'tsconfig.json'),
    },
  })
}
