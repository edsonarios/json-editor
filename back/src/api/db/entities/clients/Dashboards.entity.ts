import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Index('dashboards_pkey', ['id'], { unique: true })
@Entity('dashboards', { schema: 'public' })
export class Dashboards {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('character varying', { name: 'name', nullable: true, length: 255 })
  name: string | null

  @Column('character varying', {
    name: 'description',
    nullable: true,
    length: 255,
  })
  description: string | null

  @Column('jsonb', { name: 'preview_structure', nullable: true, default: {} })
  previewStructure: object | null

  @Column('jsonb', { name: 'preview_indicators', nullable: true, default: {} })
  previewIndicators: object | null

  @Column('jsonb', { name: 'structure', nullable: true, default: {} })
  structure: object | null

  @Column('jsonb', {
    name: 'indicators',
    nullable: true,
    default: { configs: [], surveys: [] },
  })
  indicators: object | null

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

  @Column('jsonb', { name: 'dashboard_card_templates', nullable: true })
  dashboardCardTemplates: object | null
}
