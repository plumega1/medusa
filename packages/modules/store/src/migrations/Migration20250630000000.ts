import { Migration } from '@mikro-orm/migrations';

export class Migration20240630000000 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "store" add column "user_id" varchar(255) null;');
    this.addSql('create index "IDX_store_user_id" on "store" ("user_id");');
  }

  async down(): Promise<void> {
    this.addSql('drop index "IDX_store_user_id";');
    this.addSql('alter table "store" drop column "user_id";');
  }

}