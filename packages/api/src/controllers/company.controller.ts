import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
    Crud,
    CrudController,
    CrudRequest,
    Override,
    ParsedBody,
    ParsedRequest,
} from '@nestjsx/crud';
// import { plainToClass } from 'class-transformer';
import { ACGuard, UseRoles } from 'nest-access-control';

import { CompanyEntity } from '~/entities/company.entity';
import { CompanyService } from '~/services/company.service';
import { JwtAuthGuard } from '~/guards/jwt-auth.guard';

import { CompanyCreateDto } from './dto/compamy/company-create.dto';
import { CompanyGetManyDto } from './dto/compamy/company-getMany.dto';
import { CompanyUpdateDto } from './dto/compamy/company-update.dto';
import { CompanyDto } from './dto/compamy/company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Crud({
    model: {
        type: CompanyEntity,
    },
    dto: {
        create: CompanyCreateDto,
        update: CompanyUpdateDto,
    },
    params: {
        id: {
            field: 'id',
            type: 'uuid',
            primary: true,
        },
    },
    query: {
        alwaysPaginate: true,
        sort: [
            {
                field: 'id',
                order: 'DESC',
            },
        ],
    },
    serialize: {
        getMany: CompanyGetManyDto,
        create: CompanyDto,
        update: CompanyDto,
        get: CompanyDto,
    },
    routes: {
        exclude: ['createManyBase', 'replaceOneBase'],
    },
})
@UseGuards(JwtAuthGuard, ACGuard)
@Controller('companies')
export class CompanyController implements CrudController<CompanyEntity> {
    constructor(public service: CompanyService) {}

    get base(): CrudController<CompanyEntity> {
        return this;
    }

    @Override()
    @UseRoles({
        resource: 'companies',
        action: 'create',
    })
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: CompanyCreateDto,
    ) {
        return this.base.createOneBase(req, <CompanyEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'companies',
        action: 'update',
    })
    updateOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: CompanyUpdateDto,
    ) {
        return this.base.updateOneBase(req, <CompanyEntity>dto);
    }

    @Override()
    @UseRoles({
        resource: 'companies',
        action: 'delete',
    })
    deleteOne(req: CrudRequest) {
        return this.base.deleteOneBase(req);
    }
}