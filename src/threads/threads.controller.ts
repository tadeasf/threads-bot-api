import { Controller, Post, Body, Get, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiHeader 
} from '@nestjs/swagger';
import { ThreadsService } from './threads.service';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('threads')
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @ApiOperation({ summary: 'Get authorization URL' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the authorization URL',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://www.threads.net/oauth/authorize?client_id=...'
        }
      }
    }
  })
  @Get('auth-url')
  getAuthUrl() {
    return this.threadsService.getAuthorizationUrl();
  }

  @ApiOperation({ summary: 'Exchange code for token' })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code from Threads',
    required: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the access token',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        userId: { type: 'string' },
        expiresIn: { type: 'number' }
      }
    }
  })
  @Get('callback')
  handleCallback(@Query('code') code: string) {
    return this.threadsService.exchangeCodeForToken(code);
  }

  @ApiOperation({ summary: 'Create a new post' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token from authentication',
    required: true,
    schema: { type: 'string' }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Post created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        permalink: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('post')
  createPost(
    @Headers('authorization') auth: string,
    @Body() post: CreatePostDto
  ) {
    // Extract token from "Bearer <token>"
    const token = auth?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return this.threadsService.createPost(token, post);
  }
} 