import { MedusaContainer } from "@medusajs/medusa"
import { MikroORM } from "@mikro-orm/core"
import { asValue } from "awilix"
import { NextFunction, Request, Response } from "express"
import { v4 } from "uuid"

export default async ({ app, container }: { app: any; container: MedusaContainer }) => {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    req.scope = container.createScope() as MedusaContainer
    req.requestId = (req.headers["x-request-id"] as string) ?? v4()
    const tenantId = req.headers["x-store-id"] as string ?? "default_tenant"

    try {
      if (!tenantId) {
        throw new Error("Missing tenant_id in token")
      }

      const schema = `tenant_${tenantId}`

      // Get ORM instance from container
      const orm = container.resolve("orm") as MikroORM
      const em = orm.em.fork()

      // Set search_path to tenant's schema
      await em.getConnection().execute(`SET search_path TO ${schema}, public`)

      // Inject tenant-scoped EM into request scope as "manager"
      req.scope.register({
        manager: asValue(em),
      })

      // Optional: for debug/logging
      ;(req as any).tenantSchema = schema
    } catch (err) {
      console.error("[tenant-middleware] Failed to inject tenant EM", err)
      return res.status(400).json({ error: "Invalid or missing tenant" })
    }

    return next()
  })
}