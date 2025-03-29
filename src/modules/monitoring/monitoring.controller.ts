import { Controller, Get } from '@nestjs/common';

@Controller('monitoring')
export class MonitoringController {
  // نقطة النهاية للتحقق من حالة النظام
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date() };
  }

  // مثال على نقطة النهاية لسجلات النظام
  @Get('logs')
  getLogs() {
    return { logs: 'Detailed logs would be here' };
  }
}
