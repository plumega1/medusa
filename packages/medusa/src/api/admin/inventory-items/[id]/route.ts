import { MedusaError } from "@medusajs/framework/utils"
import { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  deleteInventoryItemWorkflow,
  updateInventoryItemsWorkflow,
} from "@medusajs/core-flows"
import {
  AdminGetInventoryItemParamsType,
  AdminUpdateInventoryItemType,
} from "../validators"
import { refetchInventoryItem } from "../helpers"
import { HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetInventoryItemParamsType>,
  res: MedusaResponse<HttpTypes.AdminInventoryItemResponse>
) => {
  const store_id = req.auth_context.store_id
  const { id } = req.params
  const inventoryItem = await refetchInventoryItem(
    id,
    store_id,
    req.scope,
    req.queryConfig.fields
  )
  if (!inventoryItem) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${id} was not found`
    )
  }

  res.status(200).json({
    inventory_item: inventoryItem,
  })
}

// Update inventory item
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateInventoryItemType>,
  res: MedusaResponse<HttpTypes.AdminInventoryItemResponse>
) => {
  const { id } = req.params
  const store_id = req.auth_context.store_id

  await updateInventoryItemsWorkflow(req.scope).run({
    input: {
      updates: [{ id, ...req.validatedBody }],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    store_id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    inventory_item: inventoryItem,
  })
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.AdminInventoryItemDeleteResponse>
) => {
  const id = req.params.id
  const deleteInventoryItems = deleteInventoryItemWorkflow(req.scope)

  await deleteInventoryItems.run({
    input: [id],
  })

  res.status(200).json({
    id,
    object: "inventory_item",
    deleted: true,
  })
}
