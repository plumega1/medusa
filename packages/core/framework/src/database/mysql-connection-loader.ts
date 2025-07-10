import {
  ContainerRegistrationKeys,
  ModulesSdkUtils,
  retryExecution,
  stringifyCircular,
} from "@medusajs/utils"
import { asValue } from "awilix"
import { configManager } from "../config"
import { container } from "../container"
import { logger } from "../logger"

/**
 * Initialize a knex connection that can then be shared to any resources if needed
 */
export async function mysqlConnectionLoader(): Promise<
  ReturnType<typeof ModulesSdkUtils.createMysqlConnection>
> {
  if (container.hasRegistration(ContainerRegistrationKeys.MYSQL_CONNECTION)) {
    return container.resolve(
      ContainerRegistrationKeys.MYSQL_CONNECTION
    ) as unknown as ReturnType<typeof ModulesSdkUtils.createMysqlConnection>
  }

  const configModule = configManager.config

  // Share a knex connection to be consumed by the shared modules
  const connectionString = configModule.projectConfig.databaseUrl
  const driverOptions: any = {
    ...(configModule.projectConfig.databaseDriverOptions || {}),
  }
  // MySQL uses database instead of schema - default to main database name
  const database = configModule.projectConfig.databaseSchema || configModule.projectConfig.databaseName || "medusa"
  const idleTimeoutMillis = driverOptions.pool?.idleTimeoutMillis ?? undefined // prevent null to be passed
  const poolMin = driverOptions.pool?.min ?? 2
  const poolMax = driverOptions.pool?.max
  const reapIntervalMillis = driverOptions.pool?.reapIntervalMillis ?? undefined
  const createRetryIntervalMillis =
    driverOptions.pool?.createRetryIntervalMillis ?? undefined

  delete driverOptions.pool

  const mysqlConnection = ModulesSdkUtils.createMysqlConnection({
    clientUrl: connectionString,
    schema: database, // Using database name as schema parameter
    driverOptions,
    pool: {
      min: poolMin,
      max: poolMax,
      idleTimeoutMillis,
      reapIntervalMillis,
      createRetryIntervalMillis,
    },
  })

  const maxRetries = process.env.__MEDUSA_DB_CONNECTION_MAX_RETRIES
    ? parseInt(process.env.__MEDUSA_DB_CONNECTION_MAX_RETRIES)
    : 5

  const retryDelay = process.env.__MEDUSA_DB_CONNECTION_RETRY_DELAY
    ? parseInt(process.env.__MEDUSA_DB_CONNECTION_RETRY_DELAY)
    : 1000

  await retryExecution(
    async () => {
      await mysqlConnection.raw("SELECT 1")
    },
    {
      maxRetries,
      retryDelay,
      onRetry: (error) => {
        logger.warn(
          `MySQL connection failed to connect to the database. Retrying...\n${stringifyCircular(
            error
          )}`
        )
      },
    }
  )

  container.register(
    ContainerRegistrationKeys.MYSQL_CONNECTION,
    asValue(mysqlConnection)
  )

  return mysqlConnection
}