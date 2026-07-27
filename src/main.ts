import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT ?? 3000)
}

// Un fallo de arranque tiene que matar el proceso con código distinto de 0.
// Sin este catch queda como promesa rechazada sin manejar y el orquestador
// cree que el servicio levantó bien.
bootstrap().catch((error: unknown) => {
  console.error('Fallo el arranque de la API', error)
  process.exit(1)
})
