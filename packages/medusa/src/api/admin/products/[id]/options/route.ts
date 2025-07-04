import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntities,
  refetchEntity,
} from "@medusajs/framework/http"

import { createProductOptionsWorkflow } from "@medusajs/core-flows"
import { remapKeysForProduct, remapProductResponse } from "../../helpers"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductOptionParams>,
  res: MedusaResponse<HttpTypes.AdminProductOptionListResponse>
) => {
  const productId = req.params.id
  const storeId = req.auth_context?.store_id

  const product = await refetchEntity(
    "product",
    { id: productId, store_id: storeId },
    req.scope,
    ["id"]
  )

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Product not found in this store"
    )
  }

  const { rows: product_options, metadata } = await refetchEntities(
    "product_option",
    { ...req.filterableFields, product_id: productId },
    req.scope,
    req.queryConfig.fields ?? [],
    req.queryConfig.pagination
  )

  if (!product_options || product_options.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No product options found for this product"
    )
  }

  res.json({
    product_options,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminCreateProductOption & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const productId = req.params.id
  const storeId = req.auth_context?.store_id
  const { additional_data, ...rest } = req.validatedBody

  const product = await refetchEntity(
    "product",
    { id: productId, store_id: storeId },
    req.scope,
    ["id"]
  )

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Product not found in this store"
    )
  }

  await createProductOptionsWorkflow(req.scope).run({
    input: {
      product_options: [
        {
          ...rest,
          product_id: productId,
        },
      ],
      additional_data,
    },
  })

  const updatedProduct = await refetchEntity(
    "product",
    { id: productId, store_id: storeId },
    req.scope,
    remapKeysForProduct(req.queryConfig.fields ?? [])
  )

  if (!updatedProduct) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Product not found after creating product option"
    )
  }

  res.status(200).json({ product: remapProductResponse(updatedProduct) })
}
