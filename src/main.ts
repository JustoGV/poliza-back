import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module'
import { ErroresDeNegocioFilter } from './common/filters/errores-de-negocio.filter'
import { AppConfigService } from './config/app-config.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const config = app.get(AppConfigService)

  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({ origin: config.corsOrigins, credentials: true })
  app.setGlobalPrefix(config.apiPrefix)
  app.useGlobalPipes(new ZodValidationPipe())
  app.useGlobalFilters(new ErroresDeNegocioFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MF Seguros — API')
    .setDescription('Gestión y normalización de pólizas')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document))

  await app.listen(config.apiPort)
}

// Un fallo de arranque tiene que matar el proceso con código distinto de 0.
// Sin este catch queda como promesa rechazada sin manejar y el orquestador
// cree que el servicio levantó bien.
bootstrap().catch((error: unknown) => {
  console.error('Fallo el arranque de la API', error)
  process.exit(1)
})
