import { Argon2Hasher } from './argon2-hasher.service'

describe('Argon2Hasher', () => {
  const hasher = new Argon2Hasher()

  it('produce un hash que verifica correctamente contra el texto plano original', async () => {
    const hash = await hasher.hash('Correcta123!')
    await expect(hasher.verificar(hash, 'Correcta123!')).resolves.toBe(true)
  })

  it('rechaza un texto plano incorrecto', async () => {
    const hash = await hasher.hash('Correcta123!')
    await expect(hasher.verificar(hash, 'Incorrecta456!')).resolves.toBe(false)
  })

  it('produce hashes con el prefijo argon2id', async () => {
    const hash = await hasher.hash('Correcta123!')
    expect(hash.startsWith('$argon2id$')).toBe(true)
  })
})
