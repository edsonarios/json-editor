import { Injectable } from '@nestjs/common'
import { DBBaseService } from '../db/dbBase.service'
import { VercelLogger } from 'src/common/nestConfig/logger'
import { DateTime } from 'luxon'
import * as fs from 'fs-extra'
import * as path from 'path'

@Injectable()
export class BaseService {
  private readonly logger = new VercelLogger(BaseService.name)
  private dbService: DBBaseService

  constructor() {}

  initDB(dbEnv: string) {
    this.logger.log('initDB', dbEnv)
    this.dbService = new DBBaseService(dbEnv)
  }

  async getClients(dbEnv: string) {
    this.logger.log('getClients', dbEnv)

    this.dbService = new DBBaseService(dbEnv)
    await this.dbService.init()

    const clients = await this.dbService.getClients()

    await this.dbService.destroy()
    return clients.map((client) => client.id)
  }

  async findClientConfig(dbEnv: string, id: string) {
    this.logger.log('findClientConfig', dbEnv, id)

    this.dbService = new DBBaseService(dbEnv)
    await this.dbService.init()

    const config = await this.dbService.getClientConfig(id)

    await this.dbService.destroy()
    if (config && config.config) {
      await this.saveConfigBackup(id, dbEnv, config.config, 'findClientConfig')
    }
    if (process.env.CLEAN_BACKUPS === 'true') {
      await this.cleanBackups()
    }

    return config
  }

  async update(dbEnv: string, id: string, config: object) {
    this.logger.log('update', dbEnv, id)
    this.dbService = new DBBaseService(dbEnv)
    await this.dbService.init()

    const data = await this.dbService.saveClientConfig(id, config)
    await this.dbService.destroy()

    if (config) {
      await this.saveConfigBackup(id, dbEnv, config, 'update')
    }

    return data
  }

  private async saveConfigBackup(
    id: string,
    dbEnv: string,
    config: object,
    action: string,
  ) {
    const date = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss')
    const dir = path.join(process.cwd(), 'backups', id)
    const filePath = path.join(dir, dbEnv, action, `${date}.json`)

    await fs.ensureDir(path.dirname(filePath))
    await fs.writeJson(filePath, config, { spaces: 2 })

    this.logger.verbose(
      `Config backup ${id}, ${dbEnv}, ${action}, saved: ${filePath}`,
    )
  }

  private async cleanBackups() {
    const BACKUP_ROOT = path.join(process.cwd(), 'backups')
    const DAYS_LIMIT = 7
    const MIN_FILES_TO_KEEP = 1 // minimum number of files to keep

    this.logger.debug(`📦 Init clean backups in: ${BACKUP_ROOT}`)
    if (!(await fs.pathExists(BACKUP_ROOT))) {
      this.logger.error('❌ No backups folder found')
      return
    }

    const clients = await fs.readdir(BACKUP_ROOT)

    for (const client of clients) {
      const clientPath = path.join(BACKUP_ROOT, client)
      const environments = await fs.readdir(clientPath)

      for (const env of environments) {
        const envPath = path.join(clientPath, env)
        const functions = await fs.readdir(envPath)

        for (const func of functions) {
          const funcPath = path.join(envPath, func)
          const files = (await fs.readdir(funcPath))
            .filter((f) => f.endsWith('.json'))
            .map((f) => ({
              name: f,
              fullPath: path.join(funcPath, f),
              date: this.extractDateFromFilename(f),
            }))
            .filter((f) => f.date !== null)
            .sort((a, b) => b.date!.toMillis() - a.date!.toMillis()) // sort by date

          if (files.length <= MIN_FILES_TO_KEEP) {
            continue // no need to clean
          }

          const cutoff = DateTime.now().minus({ days: DAYS_LIMIT })

          let kept = 0
          for (const file of files) {
            const isOld = file.date! < cutoff
            const shouldKeep = kept < MIN_FILES_TO_KEEP

            if (isOld && !shouldKeep) {
              await fs.remove(file.fullPath)
              this.logger.debug(`🗑️ Erased: ${file.fullPath}`)
            } else {
              kept++
            }
          }
        }
      }
    }

    this.logger.debug('✅ Limpieza completa')
  }

  extractDateFromFilename(filename: string): DateTime | null {
    const match = filename.match(
      /^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.json$/,
    )
    if (!match) return null
    const dateStr = `${match[1]}T${match[2].replace(/-/g, ':')}`
    return DateTime.fromISO(dateStr)
  }
}
