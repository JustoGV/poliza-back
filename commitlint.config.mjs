/**
 * Conventional Commits + convención propia: el subject arranca con el ID de
 * la tarjeta de Trello.
 *
 *   feat(ingesta): F4-19 cascada de resolución de equivalencias
 *   fix(polizas): F4-11 endoso vacío rompe la clave natural
 */
const ID_TARJETA = /^F\d-\d{2} /

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'infra',
        'auth',
        'users',
        'audit',
        'aseguradoras',
        'clientes',
        'polizas',
        'catalogo',
        'seguimientos',
        'ingesta',
        'homologacion',
        'deps',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'body-max-line-length': [1, 'always', 100],
  },
  plugins: [
    {
      rules: {
        'referencia-tarjeta': ({ subject, type }) => {
          if (type === 'chore' || type === 'docs' || type === 'ci') return [true]
          return [
            typeof subject === 'string' && ID_TARJETA.test(subject),
            'el subject debe arrancar con el ID de la tarjeta, ej: "F4-19 cascada de resolución"',
          ]
        },
      },
    },
  ],
  // Se activa cuando el backlog esté cargado en Trello.
  // Para exigirlo ya: mover a `rules` como ['referencia-tarjeta']: [2, 'always']
}
