import winston from 'winston';

export const logger = winston.createLogger({
  exitOnError: false,
  handleExceptions: true,
  level: process.env.NODE_ENV === 'prod' ? 'info' : 'debug',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.printf((obj) =>
      winston.format
        .colorize()
        .colorize(
          obj.level,
          `[${obj.timestamp} ${obj.level.toUpperCase()}]: ${obj.message}`
        )
    )
  ),
});
