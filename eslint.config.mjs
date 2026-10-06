import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default defineConfig([
	{
		ignores: [
			'**/logs',
			'**/*.log',
			'**/npm-debug.log*',
			'**/yarn-debug.log*',
			'**/yarn-error.log*',
			'**/lerna-debug.log*',
			'**/report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
			'**/pids',
			'**/*.pid',
			'**/*.seed',
			'**/*.pid.lock',
			'**/lib-cov',
			'**/coverage',
			'**/*.lcov',
			'**/.nyc_output',
			'**/.grunt',
			'**/bower_components',
			'**/.lock-wscript',
			'build/Release',
			'**/node_modules/',
			'**/jspm_packages/',
			'**/typings/',
			'**/*.tsbuildinfo',
			'**/.npm',
			'**/.eslintcache',
			'**/.rpt2_cache/',
			'**/.rts2_cache_cjs/',
			'**/.rts2_cache_es/',
			'**/.rts2_cache_umd/',
			'**/.node_repl_history',
			'**/*.tgz',
			'**/.yarn-integrity',
			'**/.env',
			'**/.env.test',
			'**/.cache',
			'**/.next',
			'**/.nuxt',
			'**/dist',
			'**/.cache/',
			'.vuepress/dist',
			'**/.serverless/',
			'**/.fusebox/',
			'**/.dynamodb/',
			'**/.tern-port',
		],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintConfigPrettier,
	{
		languageOptions: {
			globals: {
				...globals.commonjs,
				...globals.node,
				client: 'writable',
			},
			parserOptions: {
				project: ['./tsconfig.json'],
				extraFileExtensions: ['.template'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
		},
	},
])
