import { Injectable } from '@nestjs/common'
import { UpdateBaseDto } from './dto/update-base.dto'
import { DBService } from '../db/db.service'

@Injectable()
export class BaseService {
  constructor(private readonly dbService: DBService) {}

  async getClients() {
    const clients = await this.dbService.getClients()
    return clients.map((client) => client.id)
  }

  findOne(id: number) {
    return `This action returns a #${id} base`
  }

  update(id: number, updateBaseDto: UpdateBaseDto) {
    return `This action updates a #${id} base`
  }

  remove(id: number) {
    return `This action removes a #${id} base`
  }
}
