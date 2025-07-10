import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { createStockLocationsWorkflow } from "@medusajs/core-flows"
import { refetchStockLocation } from "./helpers"
import { HttpTypes } from "@medusajs/framework/types"

// Create stock location
export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateStockLocation>,
  res: MedusaResponse<HttpTypes.AdminStockLocationResponse>
) => {
  const store_id = req.auth_context.store_id
  const { result } = await createStockLocationsWorkflow(req.scope).run({
    input: { locations: [{store_id: store_id, ...req.validatedBody}]},
  })

  const stockLocation = await refetchStockLocation(
    result[0].id,
    store_id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ stock_location: stockLocation })
}

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminStockLocationListParams>,
  res: MedusaResponse<HttpTypes.AdminStockLocationListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const store_id = req.auth_context.store_id

  const { rows: stock_locations, metadata } = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "stock_locations",
      variables: {
        filters: {store_id: store_id, ...req.filterableFields},
        ...req.queryConfig.pagination,
      },
      fields: req.queryConfig.fields,
    })
  )

  res.status(200).json({
    stock_locations,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
