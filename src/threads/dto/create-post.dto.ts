import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'The text content of the post',
    example: 'Check out this amazing chess game!'
  })
  text: string;

  @ApiPropertyOptional({
    description: 'Array of media URLs to attach to the post',
    example: ['https://example.com/image.png']
  })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Alt text descriptions for media attachments',
    example: ['A brilliant chess move by Magnus Carlsen']
  })
  altTexts?: string[];

  @ApiPropertyOptional({
    description: 'URL to attach as a link',
    example: 'https://chess.com/game/123'
  })
  linkAttachment?: string;
} 