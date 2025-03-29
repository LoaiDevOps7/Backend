import { Catch, WsExceptionFilter, ArgumentsHost } from '@nestjs/common';

@Catch()
export class AllWsExceptionsFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient();
    let error: Error;

    if (exception instanceof Error) {
      error = exception;
    } else if (typeof exception === 'string') {
      error = new Error(exception);
    } else {
      try {
        error = new Error(JSON.stringify(exception));
      } catch {
        error = new Error('Unknown error');
      }
    }

    // تسجيل الاستثناء للتتبع (اختياري)
    console.error('Caught WS exception:', error);

    // إرسال رسالة الخطأ للعميل
    client.emit('error', { message: error.message });
  }
}
