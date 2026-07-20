import { Module } from '@nestjs/common';
import { SavingGoalController } from './saving-goal.controller';
import { SavingGoalService } from './saving-goal.service';
@Module({
  controllers: [SavingGoalController],
  providers: [SavingGoalService],
  exports: [SavingGoalService],
})
export class SavingGoalModule {}
