import { DataSource, Repository } from 'typeorm'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { createClientDataSource } from './db.config'
import { Dashboards } from './entities/clients/Dashboards.entity'
import { Suites } from './entities/clients/Suites.entity'
import { BadRequestException, ConflictException } from '@nestjs/common'

export class DBClientService {
  private readonly logger = new VercelLogger(DBClientService.name)
  private readonly clientDataSource: DataSource
  private readonly dashboardsRepository: Repository<Dashboards>
  private readonly suitesRepository: Repository<Suites>

  constructor(dbEnv: string, clientId: string) {
    this.clientDataSource = createClientDataSource(dbEnv, clientId)
    this.dashboardsRepository = this.clientDataSource.getRepository(Dashboards)
    this.suitesRepository = this.clientDataSource.getRepository(Suites)
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

  //? CLients
  async getDatas(table: string) {
    this.logger.log('getDatas', table)
    if (table === 'dashboards') {
      return this.dashboardsRepository.find({ order: { createdAt: 'DESC' } })
    }
    if (table === 'suites') {
      return this.suitesRepository.find({ order: { createdAt: 'DESC' } })
    }
  }

  async saveDatas(
    id: string,
    table: string,
    attribute: string,
    expectedConfig: object | null,
    nextConfig: object | null,
  ) {
    this.logger.log('saveDatas', id)
    const updateData = { [attribute]: nextConfig }
    const expected =
      expectedConfig === null ? null : JSON.stringify(expectedConfig)
    let repository: Repository<Dashboards> | Repository<Suites>

    if (table === 'dashboards') {
      repository = this.dashboardsRepository
    } else if (table === 'suites') {
      repository = this.suitesRepository
    } else {
      throw new BadRequestException('Unsupported table')
    }

    const column = repository.metadata.findColumnWithPropertyName(attribute)
    if (!column || column.type !== 'jsonb') {
      throw new BadRequestException('Unsupported attribute')
    }

    const data = await repository
      .createQueryBuilder()
      .update()
      .set(updateData)
      .where('id = :id', { id })
      .andWhere(
        `"${column.databaseName}" IS NOT DISTINCT FROM CAST(:expected AS jsonb)`,
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
