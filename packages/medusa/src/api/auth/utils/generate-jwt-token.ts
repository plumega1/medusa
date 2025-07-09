import {
  AuthIdentityDTO,
  ProjectConfigOptions,
} from "@medusajs/framework/types"
import { generateJwtToken } from "@medusajs/framework/utils"
import { type Secret } from "jsonwebtoken"

export function generateJwtTokenForAuthIdentity(
  {
    authIdentity,
    actorType,
  }: { authIdentity: AuthIdentityDTO; actorType: string },
  {
    secret,
    expiresIn,
    options,
  }: {
    secret: Secret
    expiresIn: string | undefined
    options?: ProjectConfigOptions["http"]["jwtOptions"]
  }
) {
  const expiresIn_ = expiresIn ?? options?.expiresIn
  const entityIdKey = `${actorType}_id`
  const entityId = authIdentity?.app_metadata?.[entityIdKey] as
    | string
    | undefined

  return generateJwtToken(
  {
    actor_id: entityId ?? "",
    actor_type: actorType,
    auth_identity_id: authIdentity?.id ?? "",
    store_id: authIdentity?.app_metadata?.store_id ?? "", // ✅ Add this
    app_metadata: {
      [entityIdKey]: entityId,
      store_id: authIdentity?.app_metadata?.store_id ?? "", // Optional: keep for redundancy
    },
  },
  {
    secret,
    expiresIn: expiresIn_,
    jwtOptions: options,
  }
)

}
