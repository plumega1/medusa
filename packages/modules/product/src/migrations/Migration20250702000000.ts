import { Migration } from '@mikro-orm/migrations'

export class AddStoreIdToProduct20241201000000 extends Migration {
  async up(): Promise<void> {
    // Add store_id column to product table
    this.addSql(`
      ALTER TABLE "product" 
      ADD COLUMN "store_id" varchar(255) NOT NULL DEFAULT 'store_01JYQRW9Y4R1H07N8PQ0VJPW3T';
    `)

    this.addSql(`
      ALTER TABLE "product_category" 
      ADD COLUMN "store_id" varchar(255) NOT NULL DEFAULT 'store_01JYQRW9Y4R1H07N8PQ0VJPW3T';
    `)

    this.addSql(`
      ALTER TABLE "product_collection" 
      ADD COLUMN "store_id" varchar(255) NOT NULL DEFAULT 'store_01JYQRW9Y4R1H07N8PQ0VJPW3T';
    `)

    // Create index for store_id
    this.addSql(`
      CREATE INDEX "IDX_product_store_id" 
      ON "product" ("store_id") 
      WHERE "deleted_at" IS NULL;
    `)

    // Update the unique constraint for handle to include store_id
    // First drop the existing unique constraint
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_product_handle_unique";
    `)

    // Create new unique constraint with store_id
    this.addSql(`
      CREATE UNIQUE INDEX "IDX_product_handle_store_unique" 
      ON "product" ("handle", "store_id") 
      WHERE "deleted_at" IS NULL;
    `)

    // Add foreign key constraint if you have a stores table
    this.addSql(`
      ALTER TABLE "product" 
      ADD CONSTRAINT "FK_product_store_id" 
      FOREIGN KEY ("store_id") 
      REFERENCES "store" ("id") 
      ON UPDATE CASCADE 
      ON DELETE RESTRICT;
    `)
  }

  async down(): Promise<void> {
    // Remove foreign key constraint if it exists
    /*
    this.addSql(`
      ALTER TABLE "product" 
      DROP CONSTRAINT IF EXISTS "FK_product_store_id";
    `)
    */

    // Drop the store-specific unique index
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_product_handle_store_unique";
    `)

    // Recreate the original handle unique constraint
    this.addSql(`
      CREATE UNIQUE INDEX "IDX_product_handle_unique" 
      ON "product" ("handle") 
      WHERE "deleted_at" IS NULL;
    `)

    // Drop store_id index
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_product_store_id";
    `)

    // Remove store_id column
    this.addSql(`
      ALTER TABLE "product" 
      DROP COLUMN IF EXISTS "store_id";
    `)

    this.addSql(`
      ALTER TABLE "product_category" 
      DROP COLUMN IF EXISTS "store_id";
    `)
  }
}