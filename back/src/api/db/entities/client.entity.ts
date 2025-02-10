import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm'

@Entity()
export class Clients {
  @Column('character varying', { primary: true, name: 'id' })
  id: string

  @Column('character varying', { nullable: true, default: '' })
  company: string

  @Column('jsonb', { nullable: true, default: {} })
  config: object | null

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt: Date
}
