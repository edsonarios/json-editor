import { Logger, Module } from '@nestjs/common'
import { BaseModule } from './api/base/base.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './api/db/db.module'
const { STAGE } = process.env

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const credentialsBase = {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        }
        if (STAGE !== 'prod') {
          Logger.verbose('Connecting Base DB by', credentialsBase)
        }

        return {
          type: 'postgres',
          host: credentialsBase.host,
          port: credentialsBase.port,
          username: credentialsBase.username,
          password: credentialsBase.password,
          database: credentialsBase.database,
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
