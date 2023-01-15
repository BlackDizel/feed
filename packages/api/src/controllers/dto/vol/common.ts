import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class VolCreateCompanyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    readonly id: number;
}

export class VolEditCreateDto {
    @ApiProperty()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    @IsOptional()
    readonly position: string;

    @ApiProperty()
    @IsOptional()
    readonly isActive: string;

    @ApiProperty()
    @IsOptional()
    readonly isBlocked: string;
}