import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
  MedusaError,
} from "@medusajs/framework/utils"

export const refetchStore = async (
  storeId: string,
  scope: MedusaContainer,
  fields: string[],
  userId?: string
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  
  const filters: any = { id: storeId }
  if (userId) {
    filters.user_id = userId
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "store",
    variables: {
      filters,
    },
    fields: fields,
  })

  const stores = await remoteQuery(queryObject)
  return stores[0]
}

export const validateStoreOwnership = async (
  storeId: string,
  userId: string,
  scope: MedusaContainer
): Promise<void> => {
  const store = await refetchStore(storeId, scope, ["id", "user_id"], userId)
  
  if (!store) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Store with id "${storeId}" not found or access denied`
    )
  }
}

export const refetchUserStores = async (
  userId: string,
  scope: MedusaContainer,
  fields: string[],
  filters: Record<string, any> = {}
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "store",
    variables: {
      filters: {
        ...filters,
        user_id: userId
      },
    },
    fields: fields,
  })

  const stores = await remoteQuery(queryObject)
  return stores
}