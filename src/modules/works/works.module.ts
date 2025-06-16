import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksService } from './works.service';
import { WorksController } from './works.controller';
import { PublicWorksController } from './public-works.controller';
import { Work } from '../../entities/Work';
import { User } from '../../entities/User';
import { Analytics } from '../../entities/Analytics';

@Module({
  imports: [TypeOrmModule.forFeature([Work, User, Analytics])],
  controllers: [WorksController, PublicWorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule {}