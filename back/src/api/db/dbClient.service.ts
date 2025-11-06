import { DataSource, Repository } from 'typeorm'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { createClientDataSource } from './db.config'
import { Dashboards } from './entities/clients/Dashboards.entity'
import { Suites } from './entities/clients/Suites.entity'
import { BadRequestException } from '@nestjs/common'

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
    config: object,
  ) {
    this.logger.log('saveDatas', id)
    const updateData = { [attribute]: config }
    let data
    if (table === 'dashboards') {
      data = await this.dashboardsRepository.update({ id }, updateData)
    }
    if (table === 'suites') {
      data = await this.suitesRepository.update({ id }, updateData)
    }

    if (data.affected === 0) {
      throw new BadRequestException('Error saving config')
    }
    return { message: 'Saved' }
  }
}
