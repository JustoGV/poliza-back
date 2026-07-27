/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/**/*.dto.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  // CLAUDE.md: "Los módulos `ingesta/` y `auth/` exigen >90 % de cobertura".
  // Los umbrales por ruta sólo se evalúan con `pnpm test:cov`, no con `pnpm test`.
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 },
    './src/modules/ingesta/': { branches: 90, functions: 90, lines: 90, statements: 90 },
    './src/modules/auth/': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
}
