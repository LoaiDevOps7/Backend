// import { Injectable, Logger } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { lastValueFrom } from 'rxjs';

// @Injectable()
// export class MLService {
//   private readonly logger = new Logger(MLService.name);
//   constructor(private readonly httpService: HttpService) {}

//   /**
//    * تقوم هذه الدالة بإرسال المحتوى إلى نظام ML خارجي لتحليل المحتوى.
//    * تُرجع true إذا كان المحتوى غير لائق.
//    */
//   async analyzeContent(content: string): Promise<boolean> {
//     try {
//       const response = await lastValueFrom(
//         this.httpService.post('http://ml-api/analyze', { content }),
//       );
//       // نفترض أن response.data.flagged تشير إلى أن المحتوى غير لائق
//       return response.data.flagged;
//     } catch (error) {
//       this.logger.error('Error in ML analysis', error);
//       // في حالة حدوث خطأ، يمكنك اختيار السماح بالمحتوى أو رفضه حسب استراتيجيتك
//       return false;
//     }
//   }
// }
