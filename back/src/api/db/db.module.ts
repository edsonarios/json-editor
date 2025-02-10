import { Module } from '@nestjs/common'
import { DBService } from './db.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Clients } from './entities/client.entity'

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Clients])],
  providers: [DBService],
})
export class DbModule {}
