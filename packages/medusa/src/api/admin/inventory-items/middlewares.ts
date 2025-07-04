import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT } from "../../../utils/middlewares"
import * as QueryConfig from "./query-config"
import {
  AdminBatchInventoryItemLevels,
  AdminBatchInventoryItemLocationsLevel,
  AdminCreateInventoryItem,
  AdminCreateInventoryLocationLevel,
  AdminGetInventoryItemParams,
  AdminGetInventoryItemsParams,
  AdminGetInventoryLocationLevelParams,
  AdminGetInventoryLocationLevelsParams,
  AdminUpdateInventoryItem,
  AdminUpdateInventoryLocationLevel,
} from "./validators"

const applyStoreFilter = () => {
  return (req, res, next) => {
    const storeId = req.auth_context?.store_id
    if (storeId) {
      if (!req.filterableFields) {
        req.filterableFields = {}
      }
      req.filterableFields.store_id = storeId
    }
    next()
  }
}

export const adminInventoryRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/inventory-items",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformQuery(
        AdminGetInventoryItemsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/inventory-items/:id",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformQuery(
        AdminGetInventoryItemParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformBody(AdminCreateInventoryItem),
      validateAndTransformQuery(
        AdminGetInventoryItemParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [applyStoreFilter(),validateAndTransformBody(AdminBatchInventoryItemLevels)],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items/location-levels/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [applyStoreFilter(), validateAndTransformBody(AdminBatchInventoryItemLevels)],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items/:id",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformBody(AdminUpdateInventoryItem),
      validateAndTransformQuery(
        AdminGetInventoryItemParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/inventory-items/:id/location-levels",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformQuery(
        AdminGetInventoryLocationLevelsParams,
        QueryConfig.listLocationLevelsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items/:id/location-levels",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformBody(AdminCreateInventoryLocationLevel),
      validateAndTransformQuery(
        AdminGetInventoryItemParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items/:id/location-levels/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [
      applyStoreFilter(),
      validateAndTransformBody(AdminBatchInventoryItemLocationsLevel),
      validateAndTransformQuery(
        AdminGetInventoryLocationLevelParams,
        QueryConfig.retrieveLocationLevelsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/inventory-items/:id/location-levels/:location_id",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformQuery(
        AdminGetInventoryItemParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/inventory-items/:id/location-levels/:location_id",
    middlewares: [
      applyStoreFilter(),
      validateAndTransformBody(AdminUpdateInventoryLocationLevel),
      validateAndTransformQuery(
        AdminGetInventoryItemParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
]
