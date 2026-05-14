import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {

  private readonly logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    this.logger.log(`Incoming Request: ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length') || 0;
      const duration = Date.now() - startTime;
      this.logger.log(`Completed Request: ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${contentLength} bytes`);

      if(statusCode >= 400) {
        this.logger.error(`Error Response: ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${contentLength} bytes`);
      }
    })

    req.on('error', (err: any) => {
      this.logger.error(`Request Error: ${method} ${originalUrl} - ${ip} - ${userAgent} - ${err.message}`);
    });

    req.on('timeout', () => {
      this.logger.warn(`Request Timeout: ${method} ${originalUrl} - ${ip} - ${userAgent}`);
    })

    next();
  }
}
