import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Index('suites_pkey', ['id'], { unique: true })
@Entity('suites', { schema: 'public' })
export class Suites {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('character varying', { name: 'name', nullable: true, length: 255 })
  name: string | null

  @Column('jsonb', { name: 'config', nullable: true, default: {} })
  config: object | null

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

  @Column('jsonb', { name: 'indicators', nullable: true })
  indicators: object | null

  @Column('jsonb', { name: 'structure', nullable: true })
  structure: object | null
}
