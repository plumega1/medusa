import { ModuleServiceInitializeOptions } from "@medusajs/types"
import { knex } from "@mikro-orm/mysql"

type Options = ModuleServiceInitializeOptions["database"]

/**
 * Create a new knex (mysql) connection which can be reused and shared
 * @param options
 */
export function createMysqlConnection(options: Options) {
  const { pool, schema, clientUrl, driverOptions } = options
  const ssl =
    options.driverOptions?.ssl ??
    options.driverOptions?.connection?.ssl ??
    false

  return knex<any, any>({
    client: "mysql2",
    connection: {
      connectionString: clientUrl,
      database: schema, // MySQL uses database instead of schema
      ssl: ssl as any,
      charset: (driverOptions?.charset as string) ?? "utf8mb4",
      timezone: (driverOptions?.timezone as string) ?? "UTC",
      // Only include timeout if it exists in driverOptions
      ...(typeof driverOptions?.timeout === 'number' ? { timeout: driverOptions.timeout } : {}),
    },
    pool: {
      // https://knexjs.org/guide/#pool
      ...(pool ?? {}),
      min: (pool?.min as number) ?? 1,
      max: (pool?.max as number) ?? 10,
      // Standard knex pool options
      acquireTimeoutMillis: (pool?.acquireTimeoutMillis as number) ?? 30000,
      createTimeoutMillis: (pool?.createTimeoutMillis as number) ?? 30000,
      destroyTimeoutMillis: (pool?.destroyTimeoutMillis as number) ?? 5000,
      idleTimeoutMillis: (pool?.idleTimeoutMillis as number) ?? 30000,
    },
  })
}