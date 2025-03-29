import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const SecurityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      auditFile: 'logs/security-audit.json',
    }),
  ],
});
