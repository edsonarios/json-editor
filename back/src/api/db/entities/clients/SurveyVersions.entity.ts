import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { SurveyVersionsState } from './client.enums.util'

@Index('survey_versions_pkey', ['id'], { unique: true })
@Entity('survey_versions', { schema: 'public' })
export class SurveyVersions {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('integer', { name: 'version', nullable: true, default: 0 })
  version: number | null

  @Column('enum', {
    name: 'state',
    nullable: true,
    enum: SurveyVersionsState,
    default: SurveyVersionsState.DRAFT,
  })
  state: SurveyVersionsState

  @Column('integer', {
    name: 'token_life_days',
    nullable: true,
    default: 7,
  })
  tokenLifeDays: number | null

  @Column('jsonb', { name: 'config', nullable: true, default: {} })
  config: object | null

  @Column('jsonb', { name: 'structure', nullable: true, default: {} })
  structure: object | null

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date
}
