import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { DyeingProgramsService } from './dyeing-programs.service';
import {
  CreateDyeingProgramSchema,
  type CreateDyeingProgramDto,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('dyeing-programs')
export class DyeingProgramsController {
  constructor(private readonly dyeingProgramsService: DyeingProgramsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateDyeingProgramSchema))
    dto: CreateDyeingProgramDto,
  ) {
    return this.dyeingProgramsService.create(dto);
  }

  @Get()
  findAll() {
    return this.dyeingProgramsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dyeingProgramsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dyeingProgramsService.remove(id);
  }
}
