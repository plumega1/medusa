import { z } from "zod"
import { createFindParams, createSelectParams } from "../../utils/validators"
import { applyAndAndOrOperators } from "../../utils/common-validators"

export type AdminGetStoreParamsType = z.infer<typeof AdminGetStoreParams>
export const AdminGetStoreParams = createSelectParams()

export const AdminGetStoresParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.union([z.string(), z.array(z.string())]).optional(),
  user_id: z.union([z.string(), z.array(z.string())]).optional(), // Add user_id filter
})

export type AdminGetStoresParamsType = z.infer<typeof AdminGetStoresParams>
export const AdminGetStoresParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(AdminGetStoresParamsFields)
  .merge(applyAndAndOrOperators(AdminGetStoresParamsFields))

export type AdminUpdateStoreType = z.infer<typeof AdminUpdateStore>
export const AdminUpdateStore = z.object({
  name: z.string().optional(),
  supported_currencies: z
    .array(
      z.object({
        currency_code: z.string(),
        is_default: z.boolean().optional(),
        is_tax_inclusive: z.boolean().optional(),
      })
    )
    .optional(),
  default_sales_channel_id: z.string().nullish(),
  default_region_id: z.string().nullish(),
  default_location_id: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
  // Note: user_id is not included here as it should not be updatable via API
})

export type AdminCreateStoreType = z.infer<typeof AdminCreateStore>
export const AdminCreateStore = z.object({
  name: z.string().min(1, "Store name is required"),
  supported_currencies: z
    .array(
      z.object({
        currency_code: z.string(),
        is_default: z.boolean().optional(),
        is_tax_inclusive: z.boolean().optional(),
      })
    )
    .min(1, "At least one supported currency is required"),
  default_sales_channel_id: z.string().nullish(),
  default_region_id: z.string().nullish(),
  default_location_id: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
  // user_id will be automatically set in middleware, not from request body
})

// Validation schema for store ownership
export const StoreOwnershipParams = z.object({
  storeId: z.string(),
  userId: z.string(),
})