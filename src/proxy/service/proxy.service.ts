import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { serviceConfig } from '../../config/gateway.config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  async proxyRequest(
    serviceName: keyof typeof serviceConfig,
    method: string,
    path: string,
    data?: any,
    headers?: any,
    userInfo?: any,
  ) {
    const service = serviceConfig[serviceName];
    const url = `${service.url}${path}`;

    this.logger.log(`Proxying request to ${serviceName}: ${method} ${url}`);

    try {
      const enhancedHeaders = {
        ...headers,
        'x-user-id': userInfo?.id,
        'x-user-email': userInfo?.email,
        'x-user-role': userInfo?.roles,
      };

      const response = await firstValueFrom(
        this.httpService.request({
          method: method.toLocaleLowerCase() as any,
          url,
          data,
          headers: enhancedHeaders,
          timeout: service.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error proxying request to ${serviceName}: ${service.url}`,
      );
      throw error;
    }
  }

  async getServiceHealth(serviceName: keyof typeof serviceConfig) {
    try {
      const service = serviceConfig[serviceName];
      const response = await firstValueFrom(
        this.httpService.get(`${service.url}/health`, {
          timeout: service.timeout,
        }),
      );
      return { status: 'healthy', data: response.data };
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
