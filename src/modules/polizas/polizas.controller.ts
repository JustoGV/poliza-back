import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { PolizasService } from './polizas.service'
import { ActualizarPolizaDto } from './dto/actualizar-poliza.dto'
import { CrearPolizaDto } from './dto/crear-poliza.dto'
import { ListarPolizasQueryDto } from './dto/listar-polizas-query.dto'
import { PolizaDto, PolizaListaDto } from './dto/poliza.dto'

@ApiTags('Polizas')
@Controller('polizas')
export class PolizasController {
  constructor(private readonly service: PolizasService) {}

  @Post()
  @ZodResponse({ status: 201, description: 'Poliza creada', type: PolizaDto })
  crear(@Body() dto: CrearPolizaDto) {
    return this.service.crear(dto)
  }

  @Get()
  @ZodResponse({ status: 200, description: 'Listado paginado', type: PolizaListaDto })
  listar(@Query() query: ListarPolizasQueryDto) {
    return this.service.listar(query)
  }

  @Get(':id')
  @ZodResponse({ status: 200, description: 'Detalle de la poliza', type: PolizaDto })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id)
  }

  @Patch(':id')
  @ZodResponse({ status: 200, description: 'Poliza actualizada', type: PolizaDto })
  actualizar(@Param('id') id: string, @Body() dto: ActualizarPolizaDto) {
    return this.service.actualizar(id, dto)
  }

  @Delete(':id')
  @HttpCode(200)
  @ZodResponse({ status: 200, description: 'Baja lógica — estado pasa a NO_VIGENTE', type: PolizaDto })
  darDeBaja(@Param('id') id: string) {
    return this.service.darDeBaja(id)
  }
}
