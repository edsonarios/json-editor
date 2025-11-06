export interface IEvent {
  clientId?: string
  force?: boolean
  typeSends?: toSendDeliveries[]
}
export interface TEvent {
  clientId: string
  force?: boolean
  typeSends?: toSendDeliveries[]
}
export enum toSendDeliveries {
  SEND = 'send',
  RESEND = 'resend',
  RERESEND = 'reresend',
}

export enum SurveyVersionsState {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PRODUCTIVE = 'PRODUCTIVE',
}

export enum SurveyDeliveryGroupStatus {
  PENDING = 'PENDING',
  PAUSED = 'PAUSED',
  SENT = 'SENT',
  CANCELED = 'CANCELED',
  RESENT = 'RESENT',
  PARTIALSENT = 'PARTIALSENT',
}

export enum SurveyDeliveryGroupSendType {
  WSSP = 'WSSP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WSSPEMAIL = 'WSSPEMAIL',
  WSSPEMAILSMS = 'WSSPEMAILSMS',
  WSSPSMS = 'WSSPSMS',
  SMSEMAIL = 'SMSEMAIL',
}

export enum SurveyDeliveriesStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  RESPONDED = 'RESPONDED',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  CUARENTINE = 'CUARENTINE',
}

export enum SurveyDeliveriesCsatProfiling {
  PROMOTOR = 'PROMOTOR',
  DETRACTOR = 'DETRACTOR',
  NEUTRAL = 'NEUTRAL',
}

export enum SurveyDeliveriesNpsProfiling {
  PROMOTOR = 'PROMOTOR',
  DETRACTOR = 'DETRACTOR',
  NEUTRAL = 'NEUTRAL',
}

export enum SurveyDeliveriesSendType {
  WSSP = 'WSSP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum DeliveryTemplateType {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
}

export enum DeliveryTemplateDefaultVariant {
  SIMPLE = 'SIMPLE',
  NPS = 'NPS',
  CSAT = 'CSAT',
}

export enum CuarentineSurveyDeliveriesStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  RESPONDED = 'RESPONDED',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  CUARENTINE = 'CUARENTINE',
}

export enum CuarentineSurveyDeliveriesCsatProfiling {
  PROMOTOR = 'PROMOTOR',
  DETRACTOR = 'DETRACTOR',
  NEUTRAL = 'NEUTRAL',
}

export enum CuarentineSurveyDeliveriesNpsProfiling {
  PROMOTOR = 'PROMOTOR',
  DETRACTOR = 'DETRACTOR',
  NEUTRAL = 'NEUTRAL',
}

export enum CuarentineSurveyDeliveriesSendType {
  WSSP = 'WSSP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum TicketResolutionsChurnPrediction {
  HIGH = 'HIGH',
  LOW = 'LOW',
  MIDDLE = 'MIDDLE',
  MUY_BAJA = 'MUY_BAJA',
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  MUY_ALTA = 'MUY_ALTA',
}

export enum TicketResolutionsCategory {
  DETRACTOR = 'DETRACTOR',
  PROMOTOR = 'PROMOTOR',
  NEUTRAL = 'NEUTRAL',
}

export enum TicketResolutionsCategoryNpsClose {
  DETRACTOR = 'DETRACTOR',
  PROMOTOR = 'PROMOTOR',
  NEUTRAL = 'NEUTRAL',
}

export enum TicketResolutionsCategoryCsatClose {
  DETRACTOR = 'DETRACTOR',
  PROMOTOR = 'PROMOTOR',
  NEUTRAL = 'NEUTRAL',
}
