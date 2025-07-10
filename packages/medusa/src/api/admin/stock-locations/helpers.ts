import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const refetchStockLocation = async (
  stockLocationId: string,
  storeId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  console.log("Refetching stock location", storeId)
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "stock_location",
    variables: {
      filters: { id: stockLocationId, store_id: storeId },
    },
    fields: fields,
  })

  const stockLocations = await remoteQuery(queryObject)
  return stockLocations[0]
}
