import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {
  SurveyDeliveriesCsatProfiling,
  SurveyDeliveriesSendType,
  SurveyDeliveriesStatus,
} from './client.enums.util'

@Index('aditional_info', ['aditionalInfo'], {})
@Index('nps_csat_index', ['csatProfiling', 'npsProfiling'], {})
@Index('survey_deliveries_pkey', ['id'], { unique: true })
@Index('response', ['response'], {})
@Entity('survey_deliveries', { schema: 'public' })
export class SurveyDeliveries {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('character varying', {
    name: 'sucursal',
    nullable: true,
    length: 255,
  })
  sucursal: string | null

  @Column('jsonb', { name: 'aditional_info', nullable: true, default: {} })
  aditionalInfo: object | null

  @Column('enum', {
    name: 'status',
    nullable: true,
    enum: SurveyDeliveriesStatus,
    default: SurveyDeliveriesStatus.PENDING,
  })
  status: SurveyDeliveriesStatus

  @Column('timestamp with time zone', { name: 'sended_date', nullable: true })
  sendedDate: Date | null

  @Column('timestamp with time zone', {
    name: 'responded_date',
    nullable: true,
  })
  respondedDate: Date | null

  @Column('jsonb', { name: 'response', nullable: true })
  response: object | null

  @Column('boolean', {
    name: 'finished',
    nullable: true,
    default: false,
  })
  finished: boolean | null

  @Column('enum', {
    name: 'csat_profiling',
    nullable: true,
    enum: SurveyDeliveriesCsatProfiling,
  })
  csatProfiling: SurveyDeliveriesCsatProfiling

  @Column('enum', {
    name: 'nps_profiling',
    nullable: true,
    enum: SurveyDeliveriesCsatProfiling,
  })
  npsProfiling: SurveyDeliveriesCsatProfiling

  @Column('character varying', { name: 'error', nullable: true, length: 255 })
  error: string | null

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

  @Column('character varying', { name: 'country', nullable: true, length: 255 })
  country: string | null

  @Column('enum', {
    name: 'send_type',
    nullable: true,
    enum: SurveyDeliveriesSendType,
    default: SurveyDeliveriesSendType.EMAIL,
  })
  sendType: SurveyDeliveriesSendType

  @Column('jsonb', { name: 'wssp_status', nullable: true })
  wsspStatus: object | null

  @Column('boolean', { name: 'resent', default: false })
  resent: boolean

  @Column('jsonb', { name: 'text_mining', nullable: true })
  textMining: object | null

  @Column('character varying', {
    name: 'from_delivery',
    nullable: true,
    length: 255,
  })
  fromDelivery: string | null

  @Column('jsonb', { name: 'emotion_analitics', nullable: true })
  emotionAnalitics: object | null

  @Column('boolean', { name: 'meta_read', default: false })
  metaRead: boolean

  @Column('jsonb', { name: 'wssp_resent_status', nullable: true })
  wsspResentStatus: object | null

  @Column('boolean', {
    name: 'open_html',
    nullable: true,
    default: false,
  })
  openHtml: boolean | null

  @Column('timestamp with time zone', {
    name: 'first_resend_date',
    nullable: true,
  })
  firstResendDate: Date | null

  @Column('timestamp with time zone', {
    name: 'last_resend_date',
    nullable: true,
  })
  lastResendDate: Date | null

  @Column('integer', {
    name: 'resend_count',
    nullable: true,
    default: 0,
  })
  resendCount: number | null

  @Column('boolean', {
    name: 'isCheckedQuarentine',
    default: false,
  })
  isCheckedQuarentine: boolean

  @Column('uuid', { name: 'survey_id' })
  surveyId: string

  @Column('uuid', { name: 'user_id' })
  userId: string
}
