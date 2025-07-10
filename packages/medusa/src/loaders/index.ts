import { container, MedusaAppLoader } from "@medusajs/framework"
import { MikroORM } from "@mikro-orm/core"
import { configLoader } from "@medusajs/framework/config"
import { pgConnectionLoader } from "@medusajs/framework/database"
import { featureFlagsLoader } from "@medusajs/framework/feature-flags"
import { expressLoader } from "@medusajs/framework/http"
import { JobLoader } from "@medusajs/framework/jobs"
import { LinkLoader } from "@medusajs/framework/links"
import { logger } from "@medusajs/framework/logger"
import { SubscriberLoader } from "@medusajs/framework/subscribers"
import {
  ConfigModule,
  LoadedModule,
  MedusaContainer,
  PluginDetails,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getResolvedPlugins,
  GraphQLSchema,
  mergePluginModules,
  promiseAll,
  validateModuleName,
} from "@medusajs/framework/utils"
import { WorkflowLoader } from "@medusajs/framework/workflows"
import { asValue } from "awilix"
import { Express, NextFunction, Request, Response } from "express"
import { join } from "path"
import requestIp from "request-ip"
import { v4 } from "uuid"
import adminLoader from "./admin"
import apiLoader from "./api"

type Options = {
  directory: string
  expressApp: Express
}

const isWorkerMode = (configModule) => {
  return configModule.projectConfig.workerMode === "worker"
}

const shouldLoadBackgroundProcessors = (configModule) => {
  return (
    configModule.projectConfig.workerMode === "worker" ||
    configModule.projectConfig.workerMode === "shared"
  )
}

async function subscribersLoader(plugins: PluginDetails[]) {
  const pluginSubscribersSourcePaths = [
    /**
     * Load subscribers from the medusa/medusa package. Remove once the medusa core is converted to a plugin
     */
    join(__dirname, "../subscribers"),
  ].concat(plugins.map((plugin) => join(plugin.resolve, "subscribers")))

  const subscriberLoader = new SubscriberLoader(pluginSubscribersSourcePaths)
  await subscriberLoader.load()
}

async function jobsLoader(plugins: PluginDetails[]) {
  const pluginJobSourcePaths = [
    /**
     * Load jobs from the medusa/medusa package. Remove once the medusa core is converted to a plugin
     */
    join(__dirname, "../jobs"),
  ].concat(plugins.map((plugin) => join(plugin.resolve, "jobs")))

  const jobLoader = new JobLoader(pluginJobSourcePaths)
  await jobLoader.load()
}

async function loadEntrypoints(
  plugins: PluginDetails[],
  container: MedusaContainer,
  expressApp: Express,
  rootDirectory: string
) {
  const configModule: ConfigModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  if (shouldLoadBackgroundProcessors(configModule)) {
    await subscribersLoader(plugins)
    await jobsLoader(plugins)
  }

  if (isWorkerMode(configModule)) {
    return async () => {}
  }

  /**
   * The scope and the ip address must be fetched before we execute any other
   * middleware
   */
expressApp.use(async (req: Request, res: Response, next: NextFunction) => {
  req.scope = container.createScope() as MedusaContainer
  req.requestId = (req.headers["x-request-id"] as string) ?? v4()
  const tenantId = req.headers["x-store-id"] as string ?? "default_tenant"

  try {
    if (!tenantId) {
      throw new Error("Missing tenant_id in token")
    }

    const schema = `tenant_${tenantId}`

    // Check if ORM is available, if not skip tenant setup for now
    if (!container.hasRegistration("orm")) {
      console.warn("[tenant-middleware] ORM not yet available, skipping tenant setup")
      return next()
    }

    const orm = container.resolve("orm") as MikroORM
    const em = orm.em.fork()

    await em.getConnection().execute(`SET search_path TO ${schema}, public`)

    req.scope.register({
      manager: asValue(em),
    })

    ;(req as any).tenantSchema = schema
  } catch (err) {
    console.error("[tenant-middleware] Failed to inject tenant EM", err)
    return res.status(400).json({ error: "Invalid or missing tenant" })
  }

  return next()
})

  // Add additional information to context of request
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const ipAddress = requestIp.getClientIp(req) as string
    ;(req as any).request_context = {
      ip_address: ipAddress,
    }
    next()
  })

  const { shutdown } = await expressLoader({
    app: expressApp,
  })

  await adminLoader({ app: expressApp, configModule, rootDirectory, plugins })
  await apiLoader({
    container,
    plugins,
    app: expressApp,
  })

  return shutdown
}

export async function initializeContainer(
  rootDirectory: string
): Promise<MedusaContainer> {
  await configLoader(rootDirectory, "medusa-config")
  await featureFlagsLoader(join(__dirname, "feature-flags"))

  container.register({
    [ContainerRegistrationKeys.LOGGER]: asValue(logger),
    [ContainerRegistrationKeys.REMOTE_QUERY]: asValue(null),
  })

  await pgConnectionLoader()
  return container
}

export default async ({
  directory: rootDirectory,
  expressApp,
}: Options): Promise<{
  container: MedusaContainer
  app: Express
  modules: Record<string, LoadedModule | LoadedModule[]>
  shutdown: () => Promise<void>
  gqlSchema?: GraphQLSchema
}> => {
  const container = await initializeContainer(rootDirectory)
  const configModule = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  const plugins = await getResolvedPlugins(rootDirectory, configModule, true)
  mergePluginModules(configModule, plugins)

  Object.keys(configModule.modules ?? {}).forEach((key) => {
    validateModuleName(key)
  })

  const linksSourcePaths = plugins.map((plugin) =>
    join(plugin.resolve, "links")
  )
  await new LinkLoader(linksSourcePaths).load()

  const {
    onApplicationStart,
    onApplicationShutdown,
    onApplicationPrepareShutdown,
    modules,
    gqlSchema,
  } = await new MedusaAppLoader().load()

  const workflowsSourcePaths = plugins.map((p) => join(p.resolve, "workflows"))
  const workflowLoader = new WorkflowLoader(workflowsSourcePaths)
  await workflowLoader.load()

  const entrypointsShutdown = await loadEntrypoints(
    plugins,
    container,
    expressApp,
    rootDirectory
  )

  const { createDefaultsWorkflow } = await import("@medusajs/core-flows")
  await createDefaultsWorkflow(container).run()
  await onApplicationStart()

  const shutdown = async () => {
    const pgConnection = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    )

    await onApplicationPrepareShutdown()
    await onApplicationShutdown()

    await promiseAll([
      container.dispose(),
      // @ts-expect-error "Do we want to call `client.destroy` "
      pgConnection?.context?.destroy(),
      entrypointsShutdown(),
    ])
  }

  return {
    container,
    app: expressApp,
    shutdown,
    modules,
    gqlSchema,
  }
}
