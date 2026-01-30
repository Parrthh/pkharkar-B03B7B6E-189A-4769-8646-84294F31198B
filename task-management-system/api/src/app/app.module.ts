import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from '../seed/seed.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { TaskEntity } from '../entities/task.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuthModule } from '../auth/auth.module';
import { UserController } from '../user/user.controller';
import { TasksModule } from '../tasks/tasks.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || 'api/data.db',
      entities: [OrganizationEntity, UserEntity, TaskEntity, AuditLogEntity],
      synchronize: true,
    }),


    TypeOrmModule.forFeature([OrganizationEntity, UserEntity, TaskEntity, AuditLogEntity]),

    AuthModule,
    TasksModule,
    SeedModule,
    AuditLogModule
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule { }