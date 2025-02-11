import { Clients } from './entities/client.entity'
import { DataSource, Repository } from 'typeorm'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { createDataSource } from './db.config'

export class DBService {
  private readonly logger = new VercelLogger(DBService.name)
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
    return await this.clientsRepository.update({ id }, { config: config })
  }
}
