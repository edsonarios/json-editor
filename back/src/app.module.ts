import { Module } from '@nestjs/common'
import { BaseModule } from './api/base/base.module'
import { ConfigModule } from '@nestjs/config'
import { ClientModule } from './api/clients/client.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BaseModule,
    ClientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
