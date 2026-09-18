import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { Ticket } from './ticket.interface.js';

@Controller('tickets')
export class TicketsController {
  // wrong way
  // private readonly ticketsService = new TicketsService();

  // correct way
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(
    @Query('status') status?: Ticket['status'],
    @Query('priority') priority?: Ticket['priority'],
  ) {
    return this.ticketsService.findAll(status, priority);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  create(@Body() payload: any) {
    return this.ticketsService.create(payload);
  }
}
