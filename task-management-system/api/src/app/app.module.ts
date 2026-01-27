import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from '../seed/seed.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { TaskEntity } from '../entities/task.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { UserController } from '../user/user.controller';

// If you already have AuthModule, keep it.
// If you don’t yet, remove this import + usage.
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || './data.db',
      entities: [
        OrganizationEntity,
        UserEntity,
        TaskEntity,
        AuditLogEntity,
      ],
      synchronize: true,
    }),

    // Repositories available for controllers/services inside AppModule scope
    TypeOrmModule.forFeature([
      OrganizationEntity,
      UserEntity,
      TaskEntity,
      AuditLogEntity,
    ]),

    // Keep AuthModule here (normal runtime module)
    AuthModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, SeedService],
})
export class AppModule { }