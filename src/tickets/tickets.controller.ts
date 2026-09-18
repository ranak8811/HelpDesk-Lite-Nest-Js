import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
// import { Ticket } from './ticket.interface.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { FilterTicketsQueryDto } from './dto/filter-tickets-query.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

@Controller('tickets')
export class TicketsController {
  // wrong way
  // private readonly ticketsService = new TicketsService();

  // correct way
  constructor(private readonly ticketsService: TicketsService) {}

  // @Get()
  // findAll(
  //   @Query('status') status?: Ticket['status'],
  //   @Query('priority') priority?: Ticket['priority'],
  // ) {
  //   return this.ticketsService.findAll(status, priority);
  // }

  @Get()
  findAll(@Query() filters: FilterTicketsQueryDto) {
    return this.ticketsService.findAll(filters.status, filters.priority);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':id/close')
  closeTicket(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.closeTicket(id);
  }
}
