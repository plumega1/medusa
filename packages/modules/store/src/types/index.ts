import {
  IEventBusModuleService,
  Logger,
  StoreTypes,
} from "@medusajs/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
  EventBus?: IEventBusModuleService
}

// Enhanced UpdateStoreInput to include optional user_id for ownership validation
export type UpdateStoreInput = StoreTypes.UpdateStoreDTO & { 
  id: string
  user_id?: string
}

// New type for creating stores with required user_id
export type CreateStoreInput = StoreTypes.CreateStoreDTO & {
  user_id: string
}

// Enhanced filterable props to include user_id for multi-tenancy filtering
export type FilterableStoreProps = StoreTypes.FilterableStoreProps & {
  user_id?: string
}

// Type for upsert operations that may or may not have user_id depending on create/update
export type UpsertStoreInput = StoreTypes.UpsertStoreDTO & {
  user_id?: string
}

// Multi-tenancy specific service method types
export type StoreByUserIdParams = {
  userId: string
  config?: {
    relations?: string[]
  }
}

export type UpdateStoreByUserIdParams = {
  userId: string
  storeId: string
  data: StoreTypes.UpdateStoreDTO
}

export type DeleteStoreByUserIdParams = {
  userId: string
  storeIds: string[]
}

// Enhanced store DTO to include user_id
export type StoreDTO = StoreTypes.StoreDTO & {
  user_id?: string
}

// Context type for multi-tenant operations
export type MultiTenantContext = {
  user_id?: string
  [key: string]: any
}