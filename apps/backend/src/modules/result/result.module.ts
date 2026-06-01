import { Module } from '@nestjs/common';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { PenaltyModule } from '../penalty/penalty.module';

@Module({
  imports: [PenaltyModule],
  controllers: [ResultController],
  providers: [ResultService],
})
export class ResultModule {}
