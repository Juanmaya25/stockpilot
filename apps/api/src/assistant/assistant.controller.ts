import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { AssistantService } from './assistant.service';
import { AskDto } from './dto/ask.dto';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('ask')
  @ApiOperation({
    summary: 'Ask the AI assistant a question about your business data',
  })
  ask(@CurrentUser() user: AuthUser, @Body() dto: AskDto) {
    return this.assistant.ask(user.businessId, dto.question);
  }
}
