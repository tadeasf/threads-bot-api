import { registerAs } from '@nestjs/config';

export interface EnvironmentConfig {
  isProduction: boolean;
  isDevelopment: boolean;
  tunnelSubdomain: string;
  productionUrl: string;
}

export default registerAs('environment', (): EnvironmentConfig => ({
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  tunnelSubdomain: process.env.TUNNEL_SUBDOMAIN || 'threads-bot-api',
  productionUrl: 'https://threads-bot-api.loca.lt'
})); 