import { Module } from '@nestjs/common'
import { BaseModule } from './api/base/base.module'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
