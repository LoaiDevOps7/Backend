import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientRolesException extends HttpException {
  constructor(requiredRoles: string[]) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Required roles: ${requiredRoles.join(', ')}`,
        error: 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
