import { createProductCategoriesWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities,
} from "@medusajs/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductCategoryListParams>,
  res: MedusaResponse<HttpTypes.AdminProductCategoryListResponse>
) => {
  const { rows: product_categories, metadata } = await refetchEntities(
    "product_category",
    {store_id: req.auth_context.store_id, ...req.filterableFields },
    req.scope,
    req.queryConfig.fields,
    req.queryConfig.pagination
  )

  res.json({
    product_categories,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateProductCategory>,
  res: MedusaResponse<HttpTypes.AdminProductCategoryResponse>
) => {
  const store_id = req.auth_context.store_id
  const { result } = await createProductCategoriesWorkflow(req.scope).run({
    input: { product_categories: [{store_id: store_id, ...req.validatedBody}] },
  })

  const [category] = await refetchEntities(
    "product_category",
    { id: result[0].id, store_id: store_id, ...req.filterableFields },
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ product_category: category })
}
