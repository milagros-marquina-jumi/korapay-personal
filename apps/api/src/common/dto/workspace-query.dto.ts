import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WorkspaceQueryDto {
  @ApiProperty({ description: 'ID del workspace activo' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}
