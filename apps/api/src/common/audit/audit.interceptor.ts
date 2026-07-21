import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '@/modules/audit/audit.service';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    if (!MUTATION_METHODS.has(method)) {
      return next.handle();
    }

    const profileId: string | undefined = request.user?.sub;
    const workspaceId: string | undefined =
      request.workspaceId ?? request.body?.workspaceId ?? request.query?.workspaceId;
    const controller = context.getClass().name.replace('Controller', '');
    const ip: string | undefined = request.ip;
    const userAgent: string | undefined = request.headers?.['user-agent'];

    return next.handle().pipe(
      tap((result) => {
        if (!profileId) return;
        const entityId =
          (result && typeof result === 'object' && 'id' in result ? (result as { id: string }).id : '') ?? '';
        void this.auditService
          .log({
            workspaceId,
            profileId,
            action: method,
            entity: controller,
            entityId: String(entityId),
            changes: method === 'DELETE' ? undefined : (request.body ?? undefined),
            ip,
            userAgent,
          })
          .catch(() => undefined);
      }),
    );
  }
}
