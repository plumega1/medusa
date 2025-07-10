import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/core-flows"
import { HttpTypes, LinkMethodRequest } from "@medusajs/framework/types"
import { refetchStockLocation } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.AdminStockLocationResponse>
) => {
  const store_id = req.auth_context.store_id
  const { id } = req.params
  const { add, remove } = req.validatedBody

  const workflow = linkSalesChannelsToStockLocationWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const stockLocation = await refetchStockLocation(
    req.params.id,
    store_id,
    req.scope,
    req.queryConfig.fields
  )
  res.status(200).json({ stock_location: stockLocation })
}
