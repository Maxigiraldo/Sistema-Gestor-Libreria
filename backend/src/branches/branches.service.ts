import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly repo: Repository<Branch>,
  ) {}

  create(dto: CreateBranchDto): Promise<Branch> {
    const branch = this.repo.create(dto);
    return this.repo.save(branch);
  }

  findAll(): Promise<Branch[]> {
    return this.repo.find({ where: { active: true }, order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Branch> {
    const branch = await this.repo.findOne({ where: { id } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async update(id: number, dto: Partial<CreateBranchDto>): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, dto);
    return this.repo.save(branch);
  }

  async remove(id: number): Promise<void> {
    const branch = await this.findOne(id);
    branch.active = false;
    await this.repo.save(branch);
  }

  async findNearest(lat: number, lng: number): Promise<Branch & { distanceKm: number }> {
    const branches = await this.findAll();
    if (branches.length === 0) throw new NotFoundException('No hay sucursales disponibles');

    const withDistance = branches.map((b) => ({
      ...b,
      distanceKm: this.haversineKm(lat, lng, Number(b.latitude), Number(b.longitude)),
    }));

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return withDistance[0];
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
