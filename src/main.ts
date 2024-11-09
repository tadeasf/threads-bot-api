import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Threads Bot API')
    .setDescription(`
API for managing Threads posts and content generation.

## Authentication
This API uses OAuth2 for authentication with Threads. The flow is:
1. Get authorization URL from \`/threads/auth-url\`
2. User authorizes the application
3. Threads redirects to callback URL with code
4. Exchange code for token using \`/threads/callback\`
5. Use token for authenticated requests
    `)
    .setVersion('1.0')
    .addTag('threads', 'Endpoints for interacting with Threads API')
    .addTag('chess', 'Endpoints for Chess.com integration')
    .addBearerAuth()
    .setContact('Developer', 'https://github.com/yourusername', 'your@email.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Save OpenAPI spec
  writeFileSync(
    join(process.cwd(), 'public', 'openapi.json'),
    JSON.stringify(document, null, 2)
  );

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Traditional Swagger UI at /api
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  
  console.log(`
🚀 Application is running on: http://localhost:3000
📚 API Documentation (Scalar): http://localhost:3000/docs
🔧 API Documentation (Swagger): http://localhost:3000/api
  `);
}
bootstrap();