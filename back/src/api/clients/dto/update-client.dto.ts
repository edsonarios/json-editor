import { PartialType } from '@nestjs/mapped-types'
import { CreateBaseDto } from './create-client.dto'

export class UpdateBaseDto extends PartialType(CreateBaseDto) {}
