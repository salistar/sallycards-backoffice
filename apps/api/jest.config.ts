/**
 * Configuration Jest pour le backend API.
 * Utilise ts-jest pour les fichiers TypeScript.
 */
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Skip type-checking pour aller plus vite (les vrais checks TS sont dans tsc)
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
    },
  },
};

export default config;
