import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System Health')
@Controller('api')
export class AppController {
  @ApiOperation({ summary: 'Health Check', description: 'Kiểm tra trạng thái hoạt động của Backend.' })
  @Get('health')
  getHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'BrainLift Backend API',
    };
  }
}
