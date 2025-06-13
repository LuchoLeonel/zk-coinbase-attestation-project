import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZkService } from './zk/zk.service';
import { ZkController } from './zk/zk.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      synchronize: true,
    }),
  ],
  controllers: [AppController, ZkController],
  providers: [AppService, ZkService],
})
export class AppModule {}
