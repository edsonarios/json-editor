import { PartialType } from '@nestjs/mapped-types'
import { CreateClientDto } from './client.entity'

export class UpdateClientDto extends PartialType(CreateClientDto) {}
