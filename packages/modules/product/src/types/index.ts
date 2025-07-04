import {
  IEventBusModuleService,
  Logger,
  ProductTypes,
} from "@medusajs/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
  EventBus?: IEventBusModuleService
}

export type UpdateProductInput = ProductTypes.UpdateProductDTO & {
  id: string
}

export type CreateProductInput = ProductTypes.CreateProductDTO & {
  store_id: string
}

export type UpdateProductCollection =
  ProductTypes.UpdateProductCollectionDTO & {
    products?: string[]
  }

export type CreateProductCollection =
  ProductTypes.CreateProductCollectionDTO & {
    products?: string[]
  }

export type UpdateCollectionInput = ProductTypes.UpdateProductCollectionDTO & {
  id: string
}

export type CreateCollectionInput = ProductTypes.CreateProductCollectionDTO & {
}

export type UpdateTypeInput = ProductTypes.UpdateProductTypeDTO & {
  id: string
}

export type CreateTypeInput = ProductTypes.CreateProductTypeDTO & {
}

export type UpdateCategoryInput = ProductTypes.UpdateProductCategoryDTO & {
  id: string
}

export type CreateCategoryInput = ProductTypes.CreateProductCategoryDTO & {
}

export type UpdateTagInput = ProductTypes.UpdateProductTagDTO & {
  id: string
}

export type CreateTagInput = ProductTypes.CreateProductTagDTO & {
}

export type UpdateProductVariantInput = ProductTypes.UpdateProductVariantDTO & {
  id: string
  product_id?: string | null
}

export type CreateProductVariantInput = ProductTypes.CreateProductVariantDTO & {
  product_id?: string
}

export type UpdateProductOptionInput = ProductTypes.UpdateProductOptionDTO & {
  id: string
}

export type CreateProductOptionInput = ProductTypes.CreateProductOptionDTO & {
}

// Store-specific query filters
export type ProductFilters = {
  store_id?: string
  id?: string | string[]
  title?: string
  handle?: string
  status?: string
  collection_id?: string
  type_id?: string
  category_id?: string
  tag_id?: string
  created_at?: {
    gte?: Date
    lte?: Date
  }
  updated_at?: {
    gte?: Date
    lte?: Date
  }
}

// Context type for store-aware operations
export type StoreContext = {
  store_id?: string
  user_id?: string
  [key: string]: any
}