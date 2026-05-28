import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'API readiness status' })
  health() {
    return {
      message: 'CasaX API is healthy',
      data: {
        service: 'api.casax.ng',
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
