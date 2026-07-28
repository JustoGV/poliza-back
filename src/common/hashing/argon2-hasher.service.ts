import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

/**
 * Parámetros explícitos: CLAUDE.md prohíbe bcrypt con rounds bajos y SHA, y
 * pide argon2id sin números mágicos sueltos en el código. OWASP recomienda
 * como mínimo 19 MiB de memoria para argon2id; acá se sube a 64 MiB porque
 * la carga esperada (login de una productora, no un servicio masivo) lo
 * permite sin volverse un vector de DoS.
 */
const OPCIONES: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
}

@Injectable()
export class Argon2Hasher {
  hash(textoPlano: string): Promise<string> {
    return argon2.hash(textoPlano, OPCIONES)
  }

  verificar(hash: string, textoPlano: string): Promise<boolean> {
    return argon2.verify(hash, textoPlano)
  }
}
