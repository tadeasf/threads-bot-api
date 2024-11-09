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
  productionUrl: process.env.PRODUCTION_URL || 'https://your-production-domain.com'
})); 