import { batchLinkProductsToCategoryWorkflow } from "@medusajs/core-flows"
import {
  AdminProductCategoryResponse,
  LinkMethodRequest,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<AdminProductCategoryResponse>
) => {
  const { id } = req.params
  const store_id = req.auth_context.store_id

  await batchLinkProductsToCategoryWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  const category = await refetchEntity(
    "product_category",
    {id, store_id},
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ product_category: category })
}
