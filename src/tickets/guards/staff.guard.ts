import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const staffKey = request.headers['x-staff-key'];

    if (staffKey !== 'helpdesk-staff-secret') {
      throw new ForbiddenException('Staff access required');
    }

    return true;
  }
}
