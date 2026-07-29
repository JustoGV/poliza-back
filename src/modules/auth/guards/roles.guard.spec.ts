import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { JwtPayload } from '../jwt-payload.interface'
import { RolesGuard } from './roles.guard'

function crearContexto(user?: JwtPayload): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  function crearGuard(rolesRequeridos: string[] | undefined) {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(rolesRequeridos) } as unknown as Reflector
    return new RolesGuard(reflector)
  }

  it('deja pasar si el handler no declara @Roles()', () => {
    const guard = crearGuard(undefined)
    expect(guard.canActivate(crearContexto({ sub: '1', email: 'a@a.com', rol: 'OPERADOR' }))).toBe(true)
  })

  it('deja pasar si @Roles() está vacío', () => {
    const guard = crearGuard([])
    expect(guard.canActivate(crearContexto({ sub: '1', email: 'a@a.com', rol: 'OPERADOR' }))).toBe(true)
  })

  it('rechaza sin usuario autenticado', () => {
    const guard = crearGuard(['ADMIN'])
    expect(guard.canActivate(crearContexto(undefined))).toBe(false)
  })

  it('rechaza si el rol del usuario no está en la lista requerida', () => {
    const guard = crearGuard(['ADMIN'])
    expect(guard.canActivate(crearContexto({ sub: '1', email: 'a@a.com', rol: 'OPERADOR' }))).toBe(false)
  })

  it('deja pasar si el rol del usuario está en la lista requerida', () => {
    const guard = crearGuard(['ADMIN', 'OPERADOR'])
    expect(guard.canActivate(crearContexto({ sub: '1', email: 'a@a.com', rol: 'OPERADOR' }))).toBe(true)
  })
})
