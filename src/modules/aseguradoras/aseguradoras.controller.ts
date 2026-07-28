import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { AseguradorasService } from './aseguradoras.service'
import { ActualizarAseguradoraDto } from './dto/actualizar-aseguradora.dto'
import { AseguradoraDto, AseguradoraListaDto } from './dto/aseguradora.dto'
import { CrearAseguradoraDto } from './dto/crear-aseguradora.dto'
import { ListarAseguradorasQueryDto } from './dto/listar-aseguradoras-query.dto'

@ApiTags('Aseguradoras')
@Controller('aseguradoras')
export class AseguradorasController {
  constructor(private readonly service: AseguradorasService) {}

  @Post()
  @ZodResponse({ status: 201, description: 'Aseguradora creada', type: AseguradoraDto })
  crear(@Body() dto: CrearAseguradoraDto) {
    return this.service.crear(dto)
  }

  @Get()
  @ZodResponse({ status: 200, description: 'Listado paginado', type: AseguradoraListaDto })
  listar(@Query() query: ListarAseguradorasQueryDto) {
    return this.service.listar(query)
  }

  @Get(':id')
  @ZodResponse({ status: 200, description: 'Detalle de la aseguradora', type: AseguradoraDto })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id)
  }

  @Patch(':id')
  @ZodResponse({ status: 200, description: 'Aseguradora actualizada', type: AseguradoraDto })
  actualizar(@Param('id') id: string, @Body() dto: ActualizarAseguradoraDto) {
    return this.service.actualizar(id, dto)
  }

  @Delete(':id')
  @HttpCode(200)
  @ZodResponse({ status: 200, description: 'Baja lógica — activo pasa a false', type: AseguradoraDto })
  darDeBaja(@Param('id') id: string) {
    return this.service.darDeBaja(id)
  }
}
