import { DataSource } from 'typeorm'
import { Clients } from './entities/client.entity'
import { Envs } from './interface/envs.interface'

export const createDataSource = (dbEnv: string): DataSource => {
  let credentials
  if (dbEnv === Envs.LOCAL.toString()) {
    credentials = {
      host: process.env.LOCAL_HOST,
      port: process.env.LOCAL_PORT ? +process.env.LOCAL_PORT : 5432,
      username: process.env.LOCAL_USER,
      password: process.env.LOCAL_PASSWORD,
      database: process.env.LOCAL_NAME,
    }
  }
  if (dbEnv === Envs.STAGING.toString()) {
    credentials = {
      host: process.env.STAGING_HOST,
      port: process.env.STAGING_PORT ? +process.env.STAGING_PORT : 5432,
      username: process.env.STAGING_USER,
      password: process.env.STAGING_PASSWORD,
      database: process.env.STAGING_NAME,
    }
  }
  if (dbEnv === Envs.PROD.toString()) {
    credentials = {
      host: process.env.PROD_HOST,
      port: process.env.PROD_PORT ? +process.env.PROD_PORT : 5432,
      username: process.env.PROD_USER,
      password: process.env.PROD_PASSWORD,
      database: process.env.PROD_NAME,
    }
  }
  return new DataSource({
    type: 'postgres',
    database: credentials.database,
    username: credentials.username,
    password: credentials.password,
    host: credentials.host,
    port: credentials.port,
    entities: [Clients],
    synchronize: false,
  })
}
