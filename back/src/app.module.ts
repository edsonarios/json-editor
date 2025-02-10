import { Module } from '@nestjs/common'
import { BaseModule } from './api/base/base.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './api/db/db.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const localCredentials = {
          host: process.env.LOCAL_HOST,
          port: process.env.LOCAL_PORT ? +process.env.LOCAL_PORT : 5432,
          username: process.env.LOCAL_USER,
          password: process.env.LOCAL_PASSWORD,
          database: process.env.LOCAL_NAME,
        }
        return {
          type: 'postgres',
          host: localCredentials.host,
          port: localCredentials.port,
          username: localCredentials.username,
          password: localCredentials.password,
          database: localCredentials.database,
          autoLoadEntities: true,
          synchronize: false,
          logging: false,
          ssl: { rejectUnauthorized: false },
        }
      },
    }),
    BaseModule,
    DbModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
