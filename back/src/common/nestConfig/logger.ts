import { Injectable, Scope, LoggerService, ConsoleLogger } from '@nestjs/common'
import * as winston from 'winston'
import * as Transport from 'winston-transport'
import { cyan, green, magenta, red, yellow } from 'colors'
import { inspect } from 'util'
import * as dotenv from 'dotenv'
dotenv.config()

@Injectable({ scope: Scope.DEFAULT })
export class VercelLogger extends ConsoleLogger implements LoggerService {
  private readonly logger: winston.Logger
  private readonly isLocal: boolean
  logs: any[] = []

  constructor(context?: string) {
    super()
    this.context = context
    this.isLocal = process.env.STAGE === 'local'
    const transports: Transport[] = [
      new winston.transports.Console({
        format: winston.format.printf(
          ({ level, message, context, timestamp }) => {
            const messageAsArray = message as string[]
            const currentDefaultContext = defaultContext.includes(
              messageAsArray[messageAsArray.length - 1],
            )
              ? messageAsArray.pop()
              : 'App'
            const contextMessage = `[${context || this.context || currentDefaultContext}]`
            const nest = this.colorizedMessage(level, '[Nest]')
            const parsedLevelMessage = level === 'info' ? 'log' : level
            const levelMessage = this.colorizedMessage(
              level,
              parsedLevelMessage.toUpperCase(),
            )
            const messageToLog = this.formatMessages(level, message as any[])
            const time = this.isLocal ? timestamp : ''
            return `${nest} ${time} ${levelMessage} ${yellow(contextMessage)} ${messageToLog}`
          },
        ),
      }),
    ]

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'user-service' },
      transports,
    })
  }

  log(...messages: any[]) {
    this.logger.info(messages)
  }

  error(...messages: any[]) {
    this.logger.error(messages)
  }

  warn(...messages: any[]) {
    this.logger.warn(messages)
  }

  debug(...messages: any[]) {
    this.logger.debug(messages)
  }

  verbose(...messages: any[]) {
    this.logger.verbose(messages)
  }

  private colorizedMessage(level: string, message: string) {
    let coloredMessage = message

    switch (level) {
      case 'error':
        coloredMessage = red(message)
        break
      case 'warn':
        coloredMessage = yellow(message)
        break
      case 'debug':
        coloredMessage = magenta(message)
        break
      case 'verbose':
        coloredMessage = cyan(message)
        break
      case 'log':
        coloredMessage = green(message)
        break
      case 'info':
      default:
        coloredMessage = green(message)
        break
    }
    return coloredMessage
  }

  private formatMessages(level: string, messages: any[]) {
    const parsedMessages = this.parseMessages(messages)
    const { STAGE } = process.env
    return parsedMessages
      .map((message) => {
        return typeof message === 'object'
          ? inspect(message, {
              depth: null,
              colors: STAGE === 'local' ? true : false,
            })
          : this.colorizedMessage(level, message)
      })
      .join(' ')
  }

  private parseMessages(messages: any[]) {
    return messages.filter((message) => {
      if (!defaultContext.includes(message)) {
        return message
      }
    })
  }
}

export function f(...messages: any[]) {
  const { STAGE } = process.env
  return messages
    .map((message) => {
      return typeof message === 'object'
        ? inspect(message, {
            depth: null,
            colors: STAGE === 'local' ? true : false,
          })
        : message
    })
    .join(' ')
}

const defaultContext = [
  'NestFactory',
  'InstanceLoader',
  'RouterExplorer',
  'RoutesResolver',
  'NestApplication',
]

// const ignoreContext = ['InstanceLoader', 'RouterExplorer', 'RoutesResolver']
