import { Module } from '@nestjs/common'
import { join } from 'path'
import { ServeStaticModule } from '@nestjs/serve-static'
import { BaseModule } from './api/base/base.module'
import { ConfigModule } from '@nestjs/config'
import { ClientModule } from './api/clients/client.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api/{*splat}'],
    }),
    BaseModule,
    ClientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
