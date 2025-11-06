import { Clients } from './entities/base/client.entity'
import { DataSource, Repository } from 'typeorm'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { createDataSource } from './db.config'
import { BadRequestException } from '@nestjs/common'

export class DBBaseService {
  private readonly logger = new VercelLogger(DBBaseService.name)
  private readonly clientDataSource: DataSource
  private readonly clientsRepository: Repository<Clients>

  constructor(dbEnv: string) {
    this.clientDataSource = createDataSource(dbEnv)
    this.clientsRepository = this.clientDataSource.getRepository(Clients)
  }

  async init() {
    if (!this.clientDataSource.isInitialized) {
      await this.clientDataSource.initialize()
    }
  }

  async destroy() {
    if (this.clientDataSource.isInitialized) {
      await this.clientDataSource.destroy()
    }
  }

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
    this.logger.log('getClientConfig', id)
    return this.clientsRepository.findOne({
      select: ['config'],
      where: { id },
    })
  }

  async saveClientConfig(id: string, config: object) {
    this.logger.log('saveClientConfig', id)
    const data = await this.clientsRepository.update({ id }, { config: config })
    if (data.affected === 0) {
      throw new BadRequestException('Error saving config')
    }
    return { message: 'Saved' }
  }
}
