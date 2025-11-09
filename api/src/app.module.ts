import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PiModule } from './pi/pi.module';

@Module({
  imports: [PiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
