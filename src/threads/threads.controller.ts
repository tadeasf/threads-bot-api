import { Controller, Post, Body, Get, Query, Headers, UnauthorizedException, Redirect, BadRequestException } from '@nestjs/common';
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

  @ApiOperation({ 
    summary: 'Get authorization URL or redirect to Threads auth',
    description: 'Returns auth URL as JSON or redirects directly based on redirect param'
  })
  @ApiQuery({
    name: 'redirect',
    required: false,
    type: Boolean,
    description: 'If true, redirects to Threads auth page'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the authorization URL'
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirects to Threads auth page' 
  })
  @Get('auth')
  @Redirect()
  async handleAuth(@Query('redirect') redirect?: boolean) {
    const url = await this.threadsService.getAuthorizationUrl();
    
    if (redirect) {
      return { 
        url,
        statusCode: 302
      };
    }
    
    return { 
      url: '/threads/auth-result',
      statusCode: 302,
      data: { url }
    };
  }

  @Get('auth-result')
  async showAuthUrl(@Query('url') url: string) {
    return { url };
  }

  @ApiOperation({ summary: 'Exchange code for token' })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code from Threads',
    required: true
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter for security verification',
    required: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the access token',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        userId: { type: 'string' },
        expiresIn: { type: 'number' },
        tokenType: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request or code' })
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string
  ) {
    // Handle auth errors
    if (error) {
      throw new BadRequestException({
        error,
        description: errorDescription
      });
    }

    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    // Verify state if using CSRF protection
    if (state) {
      await this.threadsService.verifyState(state);
    }

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