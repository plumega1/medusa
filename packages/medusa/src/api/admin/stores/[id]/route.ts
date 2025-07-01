import { updateStoresWorkflow } from "@medusajs/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminGetStoreParamsType, AdminUpdateStoreType } from "../validators"
import { refetchStore, validateStoreOwnership } from "../helpers"
import { HttpTypes } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetStoreParamsType>,
  res: MedusaResponse<HttpTypes.AdminStoreResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const userId = req.auth_context?.actor_id ?? req.user?.userId

  if (!userId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "User authentication required"
    )
  }

  // Add user_id filter to ensure user can only access their own stores
  const variables = { 
    id: req.params.id,
    user_id: userId 
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "store",
    variables: {
      filters: variables,
    },
    fields: req.queryConfig.fields,
  })

  const stores = await remoteQuery(queryObject)
  
  if (!stores || stores.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Store with id "${req.params.id}" not found or access denied`
    )
  }

  res.status(200).json({ store: stores[0] })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateStoreType>,
  res: MedusaResponse<HttpTypes.AdminStoreResponse>
) => {
  const userId = req.auth_context?.actor_id ?? req.user?.userId

  if (!userId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "User authentication required"
    )
  }

  // Validate store ownership before updating
  await validateStoreOwnership(req.params.id, userId, req.scope)

  const { result } = await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { 
        id: req.params.id,
        user_id: userId // Ensure update is scoped to user's stores
      },
      update: req.validatedBody,
    },
  })

  const store = await refetchStore(
    result[0].id,
    req.scope,
    req.queryConfig.fields,
    userId // Pass userId to refetch
  )

  res.status(200).json({ store })
}
