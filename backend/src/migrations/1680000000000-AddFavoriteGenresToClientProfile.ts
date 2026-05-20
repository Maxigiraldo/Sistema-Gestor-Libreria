import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavoriteGenresToClientProfile1680000000000 implements MigrationInterface {
    name = 'AddFavoriteGenresToClientProfile1680000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_profiles" ADD "favoriteGenres" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_profiles" DROP COLUMN "favoriteGenres"`);
    }
}
