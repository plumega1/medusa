import { Migration } from '@mikro-orm/migrations'

export class AddStoreIdToInventory20241201000001 extends Migration {
  async up(): Promise<void> {
    // Add store_id column to product table
    this.addSql(`
      ALTER TABLE "inventory_item"
      ADD COLUMN "store_id" varchar(255) NOT NULL DEFAULT 'store_01JYQRW9Y4R1H07N8PQ0VJPW3T';
    `)

    this.addSql(`
      ALTER TABLE "reservation_item"
      ADD COLUMN "store_id" varchar(255) NOT NULL DEFAULT 'store_01JYQRW9Y4R1H07N8PQ0VJPW3T';
    `)
  }

  async down(): Promise<void> {

    // Remove store_id column
    this.addSql(`
      ALTER TABLE "inventory_item" 
      DROP COLUMN IF EXISTS "store_id";
    `)

    this.addSql(`
      ALTER TABLE "reservation_item" 
      DROP COLUMN IF EXISTS "store_id";
    `)
  }
}