import {
  getOrderDetailWorkflow,
  updateOrderWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminOrder, HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AdminGetOrdersOrderParamsType,
  AdminUpdateOrderType,
} from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOrdersOrderParamsType>,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const store_id = req.auth_context.store_id
  const workflow = getOrderDetailWorkflow(req.scope)
  console.log("Code is here 1.1", store_id)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id,
      store_id: store_id,
      filters: {store_id: store_id},
      version: req.validatedQuery.version as number,
    },
  })

  res.status(200).json({ order: result as HttpTypes.AdminOrder })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateOrderType>,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const store_id = req.auth_context.store_id

  await updateOrderWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      user_id: req.auth_context.actor_id,
      id: req.params.id,
    },
  })

  const result = await query.graph({
    entity: "order",
    filters: { id: req.params.id, store_id: store_id },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ order: result.data[0] as AdminOrder })
}
