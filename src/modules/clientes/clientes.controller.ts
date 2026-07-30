import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { ClientesService } from './clientes.service'
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto'
import { ClienteDto, ClienteListaDto } from './dto/cliente.dto'
import { CrearClienteDto } from './dto/crear-cliente.dto'
import { ListarClientesQueryDto } from './dto/listar-clientes-query.dto'

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  @ZodResponse({ status: 201, description: 'Cliente creado', type: ClienteDto })
  crear(@Body() dto: CrearClienteDto) {
    return this.service.crear(dto)
  }

  @Get()
  @ZodResponse({ status: 200, description: 'Listado paginado', type: ClienteListaDto })
  listar(@Query() query: ListarClientesQueryDto) {
    return this.service.listar(query)
  }

  @Get(':id')
  @ZodResponse({ status: 200, description: 'Detalle del cliente', type: ClienteDto })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id)
  }

  @Patch(':id')
  @ZodResponse({ status: 200, description: 'Cliente actualizado', type: ClienteDto })
  actualizar(@Param('id') id: string, @Body() dto: ActualizarClienteDto) {
    return this.service.actualizar(id, dto)
  }

  @Delete(':id')
  @HttpCode(200)
  @ZodResponse({ status: 200, description: 'Baja lógica — activo pasa a false', type: ClienteDto })
  darDeBaja(@Param('id') id: string) {
    return this.service.darDeBaja(id)
  }
}
