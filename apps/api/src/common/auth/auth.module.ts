import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { WorkspaceGuard } from './workspace.guard';

@Module({
  providers: [AuthGuard, WorkspaceGuard],
  exports: [AuthGuard, WorkspaceGuard],
})
export class AuthModule {}
