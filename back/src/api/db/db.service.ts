import { Injectable } from '@nestjs/common'
import { Clients } from './entities/client.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class DBService {
  constructor(
    @InjectRepository(Clients)
    private readonly clientsRepository: Repository<Clients>,
  ) {}

  async getClients() {
    return this.clientsRepository.find({
      select: ['id'],
    })
  }

  async getClientConfig(id: string) {
    return this.clientsRepository.findOne({
      select: ['config'],
      where: { id },
    })
  }

  async saveClientConfig(id: string, config: object) {
    return this.clientsRepository.update({ id }, { config: config })
  }
}
