import {
  Controller,
  Get,
  Post,
  Patch, // FIX RC3: was Put — frontend hook sends PATCH, not PUT
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import { MillsService } from './mills.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateMillSchema,
  UpdateMillSchema,
  type CreateMillDto,
  type UpdateMillDto,
} from '@textile-flow/shared';

@Controller('mills')
export class MillsController {
  constructor(private readonly millsService: MillsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateMillSchema))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMillDto) {
    return this.millsService.create(dto);
  }

  @Get()
  findAll() {
    return this.millsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.millsService.findOne(id);
  }

  // FIX RC3: Changed @Put to @Patch
  // The frontend useMasterData hook calls api.patch(`/${entity}/${id}`, data)
  // but this controller only had @Put — HTTP 404 / method not allowed on every edit.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateMillSchema)) dto: UpdateMillDto,
  ) {
    return this.millsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.millsService.remove(id);
  }
}
