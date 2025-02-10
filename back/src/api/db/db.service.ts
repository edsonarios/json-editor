import { Injectable } from '@nestjs/common'
import { Clients } from './entities/client.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { VercelLogger } from 'src/common/nestConfig/logger'

@Injectable()
export class DBService {
  private readonly logger = new VercelLogger(DBService.name)

  constructor(
    @InjectRepository(Clients)
    private readonly clientsRepository: Repository<Clients>,
  ) {}

  async getClients() {
    this.logger.log('getClients')
    return this.clientsRepository.find({
      select: ['id'],
      order: {
        id: 'ASC',
      },
    })
  }

  async getClientConfig(id: string) {
    this.logger.log('getClientConfig')
    return this.clientsRepository.findOne({
      select: ['config'],
      where: { id },
    })
  }

  async saveClientConfig(id: string, config: object) {
    this.logger.log('saveClientConfig')
    return this.clientsRepository.update({ id }, { config: config })
  }
}
