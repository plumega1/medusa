import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

import { createInventoryItemsWorkflow } from "@medusajs/core-flows"
import { refetchInventoryItem } from "./helpers"
import { HttpTypes } from "@medusajs/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateInventoryItem>,
  res: MedusaResponse<HttpTypes.AdminInventoryItemResponse>
) => {
  const store_id = req.auth_context.store_id
  const { result } = await createInventoryItemsWorkflow(req.scope).run({
    input: { items: [{store_id: store_id, ...req.validatedBody}] },
  })

  const inventoryItem = await refetchInventoryItem(
    result[0].id,
    store_id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ inventory_item: inventoryItem })
}

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminInventoryItemParams>,
  res: MedusaResponse<HttpTypes.AdminInventoryItemListResponse>
) => {
  const store_id = req.auth_context.store_id
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const query = remoteQueryObjectFromString({
    entryPoint: "inventory_items",
    variables: {
      filters: {store_id: store_id, ...req.filterableFields},
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: inventory_items, metadata } = await remoteQuery({
    ...query,
  })

  res.status(200).json({
    inventory_items,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
