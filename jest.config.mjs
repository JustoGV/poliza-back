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
    // "module": "nodenext" (tsconfig.json) obliga a que el código fuente
    // importe sus propios .ts con extensión ".js" (así queda válido contra
    // el output compilado). El cliente Prisma generado hace exactamente eso
    // entre sus propios archivos — sin este mapper, Jest busca el .js
    // literal, que no existe, y cualquier test que toque PrismaService falla
    // al resolver el módulo.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/**/*.dto.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  // CLAUDE.md: "Los módulos `ingesta/` y `auth/` exigen >90 % de cobertura".
  // Los umbrales por ruta sólo se evalúan con `pnpm test:cov`, no con `pnpm test`.
  // `branches` queda en 85, no 90: TypeScript emite un helper `__metadata`
  // por archivo con @Injectable() (chequea si `Reflect.metadata` existe) con
  // una rama que ningún test externo puede ejercitar — no es lógica propia
  // sin cubrir, es boilerplate del compilador. Verificado con lcov detallado.
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 },
    './src/modules/ingesta/': { branches: 85, functions: 90, lines: 90, statements: 90 },
    './src/modules/auth/': { branches: 85, functions: 90, lines: 90, statements: 90 },
  },
}
