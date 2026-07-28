import 'reflect-metadata'
import { IS_PUBLIC_KEY, Public } from './public.decorator'
import { ROLES_KEY, Roles } from './roles.decorator'

describe('Public', () => {
  it('marca el metadato esPublico=true', () => {
    class Objetivo {
      @Public()
      metodo(): void {
        return
      }
    }
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, Objetivo.prototype.metodo) as boolean
    expect(metadata).toBe(true)
  })
})

describe('Roles', () => {
  it('guarda la lista de roles requeridos', () => {
    class Objetivo {
      @Roles('ADMIN', 'OPERADOR')
      metodo(): void {
        return
      }
    }
    const metadata = Reflect.getMetadata(ROLES_KEY, Objetivo.prototype.metodo) as string[]
    expect(metadata).toEqual(['ADMIN', 'OPERADOR'])
  })
})
