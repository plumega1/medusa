import { Migration } from '@mikro-orm/migrations';

export class Migration20250120110821 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "stock_location" 
      ADD COLUMN "store_id" varchar(255) NOT NULL DEFAULT 'store_01JYQRW9Y4R1H07N8PQ0VJPW3T';
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "stock_location"
      DROP COLUMN IF EXISTS "store_id";
    `)
  }

}
