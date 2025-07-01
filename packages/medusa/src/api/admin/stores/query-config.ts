export const defaultAdminStoreFields = [
  "id",
  "name",
  "*supported_currencies",
  "*supported_currencies.currency",
  "default_sales_channel_id",
  "default_region_id",
  "default_location_id",
  "user_id", // Add user_id field
  "metadata",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminStoreFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}

// Additional config for user-specific queries
export const userStoreQueryConfig = {
  defaults: defaultAdminStoreFields,
  allowedFields: [
    "id",
    "name",
    "supported_currencies",
    "default_sales_channel_id",
    "default_region_id", 
    "default_location_id",
    "user_id",
    "metadata",
    "created_at",
    "updated_at",
  ],
  isList: true,
}