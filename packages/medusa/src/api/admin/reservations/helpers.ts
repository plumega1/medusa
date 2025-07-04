import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const refetchReservation = async (
  reservationId: string,
  storeId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "reservation",
    variables: {
      filters: { id: reservationId, store_id: storeId },
    },
    fields: fields,
  })

  const reservations = await remoteQuery(queryObject)
  return reservations[0]
}
