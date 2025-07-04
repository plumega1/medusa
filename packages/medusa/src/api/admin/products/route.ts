import { createProductsWorkflow } from "@medusajs/core-flows"
import { featureFlagRouter } from "@medusajs/framework"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities,
  refetchEntity,
} from "@medusajs/framework/http"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, isPresent } from "@medusajs/framework/utils"
import IndexEngineFeatureFlag from "../../../loaders/feature-flags/index-engine"
import { remapKeysForProduct, remapProductResponse } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductListParams>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) => {
  const storeId = req.auth_context?.store_id

  // 🔒 Inject store_id into filterable fields for security
  req.filterableFields = {
    ...req.filterableFields,
    store_id: storeId,
  }

  if (featureFlagRouter.isFeatureEnabled(IndexEngineFeatureFlag.key)) {
    if (
      Object.keys(req.filterableFields).length === 0 ||
      isPresent(req.filterableFields.tags) ||
      isPresent(req.filterableFields.categories)
    ) {
      return await getProducts(req, res)
    }

    return await getProductsWithIndexEngine(req, res)
  }

  return await getProducts(req, res)
}

async function getProducts(
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductListParams>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) {
  const selectFields = remapKeysForProduct(req.queryConfig.fields ?? [])

  const { rows: products, metadata } = await refetchEntities(
    "product",
    req.filterableFields,
    req.scope,
    selectFields,
    req.queryConfig.pagination,
    req.queryConfig.withDeleted
  )

  res.json({
    products: products.map(remapProductResponse),
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

async function getProductsWithIndexEngine(
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductListParams>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const filters: Record<string, any> = req.filterableFields

  if (isPresent(filters.sales_channel_id)) {
    const salesChannelIds = filters.sales_channel_id

    filters["sales_channels"] ??= {}
    filters["sales_channels"]["id"] = salesChannelIds

    delete filters.sales_channel_id
  }

  const { data: products, metadata } = await query.index({
    entity: "product",
    fields: req.queryConfig.fields ?? [],
    filters: filters,
    pagination: req.queryConfig.pagination,
    withDeleted: req.queryConfig.withDeleted,
  })

  res.json({
    products: products.map(remapProductResponse),
    count: metadata!.estimate_count,
    estimate_count: metadata!.estimate_count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminCreateProduct & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const storeId = req.auth_context?.store_id
  const { additional_data, ...productBody } = req.validatedBody

  // 🔒 Inject store_id while creating the product
  const productToCreate = { ...productBody, store_id: storeId }

  const { result } = await createProductsWorkflow(req.scope).run({
    input: { products: [productToCreate], additional_data },
  })

  const product = await refetchEntity(
    "product",
    result[0].id,
    req.scope,
    remapKeysForProduct(req.queryConfig.fields ?? [])
  )

  res.status(200).json({ product: remapProductResponse(product) })
}
