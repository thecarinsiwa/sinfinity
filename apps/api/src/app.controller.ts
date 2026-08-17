import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { PingResponseDto } from './ping-response.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('ping')
  @ApiOperation({
    summary: 'Liveness ping',
    description:
      'Public check that the API process is up. Does not query MySQL.',
  })
  @ApiOkResponse({ type: PingResponseDto })
  ping(): PingResponseDto {
    return this.appService.ping();
  }
}
