import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
  authenticate,
} from "@medusajs/framework"
import * as QueryConfig from "./query-config"
import {
  AdminGetStoreParams,
  AdminGetStoresParams,
  AdminUpdateStore,
  AdminCreateStore
} from "./validators"

export const adminStoreRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/stores",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformQuery(
        AdminGetStoresParams,
        QueryConfig.listTransformQueryConfig
      ),
      // Add user_id filter middleware
      (req, res, next) => {
        const userId = req.auth_context?.actor_id ?? req.user?.id
        if (userId) {
          req.filterableFields = {
            ...req.filterableFields,
            user_id: userId
          }
        }
        next()
      }
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/stores/:id",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformQuery(
        AdminGetStoreParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/stores/:id",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(AdminUpdateStore),
      validateAndTransformQuery(
        AdminGetStoreParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/stores",
    middlewares: [
      authenticate("user", ["session", "bearer"]),
      validateAndTransformBody(AdminCreateStore),
      validateAndTransformQuery(
        AdminGetStoreParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
      // Automatically set user_id when creating a store
      (req, res, next) => {
        const userId = req.auth_context?.actor_id ?? req.user?.id
        if (userId) {
          req.validatedBody.user_id = userId
        }
        next()
      }
    ],
  },
]