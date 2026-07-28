import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from './jwt-auth.guard'

function crearContexto(): ExecutionContext {
  return { getHandler: () => undefined, getClass: () => undefined } as unknown as ExecutionContext
}

describe('JwtAuthGuard', () => {
  it('deja pasar sin validar JWT si el handler es @Public()', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) } as unknown as Reflector
    const guard = new JwtAuthGuard(reflector)

    expect(guard.canActivate(crearContexto())).toBe(true)
  })

  it("delega en AuthGuard('jwt') cuando el handler no es público", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector
    const guard = new JwtAuthGuard(reflector)

    const baseProto = Object.getPrototypeOf(JwtAuthGuard.prototype) as { canActivate: () => boolean }
    const espia = jest.spyOn(baseProto, 'canActivate').mockReturnValue(true)

    expect(guard.canActivate(crearContexto())).toBe(true)
    expect(espia).toHaveBeenCalledTimes(1)

    espia.mockRestore()
  })
})
