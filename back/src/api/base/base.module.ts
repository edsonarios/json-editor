import { Module } from '@nestjs/common'
import { BaseService } from './base.service'
import { BaseController } from './base.controller'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Clients } from '../db/entities/client.entity'
import { DBService } from '../db/db.service'

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Clients])],
  controllers: [BaseController],
  providers: [BaseService, DBService],
})
export class BaseModule {}
