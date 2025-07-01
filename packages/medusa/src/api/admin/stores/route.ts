import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { createStoresWorkflow } from "@medusajs/core-flows"
import { AdminCreateStoreType } from "./validators"
import { refetchStore } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminStoreListParams>,
  res: MedusaResponse<HttpTypes.AdminStoreListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const userId = req.auth_context?.actor_id ?? req.user?.userId

  if (!userId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "User authentication required"
    )
  }

  // Ensure user can only see their own stores
  const filters = {
    ...req.filterableFields,
    user_id: userId
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "store",
    variables: {
      filters,
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: stores, metadata } = await remoteQuery(queryObject)
  res.json({
    stores,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateStoreType>,
  res: MedusaResponse<HttpTypes.AdminStoreResponse>
) => {
  const userId = req.auth_context?.actor_id ?? req.user?.userId
  if (!userId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "User authentication required"
    )
  }

  // Ensure user_id is set for store creation
  const storeData = {
    ...req.validatedBody,
    user_id: userId,
    // Convert null values to undefined to match expected types
    metadata: req.validatedBody.metadata ?? undefined,
    default_sales_channel_id: req.validatedBody.default_sales_channel_id ?? undefined,
    default_region_id: req.validatedBody.default_region_id ?? undefined,
    default_location_id: req.validatedBody.default_location_id ?? undefined
  }

  const { result } = await createStoresWorkflow(req.scope).run({
    input: { stores: [storeData] },
  })

  const store = await refetchStore(
    result[0].id,
    req.scope,
    req.queryConfig.fields,
    userId
  )

  res.status(201).json({ store })
}