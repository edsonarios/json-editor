import { Clients } from './entities/base/client.entity'
import { DataSource, Repository } from 'typeorm'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { createDataSource } from './db.config'
import { ConflictException } from '@nestjs/common'

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
    return await this.clientsRepository.findOne({
      select: ['config'],
      where: { id },
    })
  }

  async saveClientConfig(
    id: string,
    expectedConfig: object | null,
    nextConfig: object | null,
  ) {
    this.logger.log('saveClientConfig', id)
    const expected =
      expectedConfig === null ? null : JSON.stringify(expectedConfig)
    const data = await this.clientsRepository
      .createQueryBuilder()
      .update(Clients)
      .set({ config: nextConfig })
      .where('id = :id', { id })
      .andWhere(
        'config IS NOT DISTINCT FROM CAST(:expected AS jsonb)',
        { expected },
      )
      .execute()

    if (data.affected === 0) {
      throw new ConflictException(
        'La configuración cambió desde que la cargaste. Recárgala antes de volver a guardar.',
      )
    }
    return { message: 'Saved' }
  }
}
