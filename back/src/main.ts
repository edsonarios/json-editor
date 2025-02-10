import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { VercelLogger } from 'src/common/nestConfig/logger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new VercelLogger(),
  })

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
  })

  const PORT = process.env.PORT || 5000
  await app.listen(PORT)
}
bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error)
})
