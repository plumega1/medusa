import {
  deleteProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"
import { remapKeysForProduct, remapProductResponse } from "../helpers"
import { MedusaError } from "@medusajs/framework/utils"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const storeId = req.auth_context?.store_id

  const selectFields = remapKeysForProduct(req.queryConfig.fields ?? [])

  const product = await refetchEntity(
    "product",
    { id: req.params.id, store_id: storeId },
    req.scope,
    selectFields
  )

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found in this store")
  }

  res.status(200).json({ product: remapProductResponse(product) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdateProduct & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const { additional_data, ...update } = req.validatedBody
  const storeId = req.auth_context?.store_id

  const existingProduct = await refetchEntity(
    "product",
    { id: req.params.id, store_id: storeId },
    req.scope,
    ["id"]
  )

  if (!existingProduct) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${req.params.id}" not found in this store`
    )
  }

  const { result } = await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id, store_id: storeId },
      update,
      additional_data,
    },
  })

  const product = await refetchEntity(
    "product",
    { id: result[0].id, store_id: storeId },
    req.scope,
    remapKeysForProduct(req.queryConfig.fields ?? [])
  )

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${req.params.id}" not found after update`
    )
  }

  res.status(200).json({ product: remapProductResponse(product) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductDeleteResponse>
) => {
  const id = req.params.id
  const storeId = req.auth_context?.store_id

  const existingProduct = await refetchEntity(
    "product",
    { id, store_id: storeId },
    req.scope,
    ["id"]
  )

  if (!existingProduct) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${id}" not found in this store`
    )
  }

  await deleteProductsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "product",
    deleted: true,
  })
}
