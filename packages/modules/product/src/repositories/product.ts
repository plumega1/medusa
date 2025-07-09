import { Product, ProductOption } from "@models"

import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import {
  arrayDifference,
  buildQuery,
  DALUtils,
  MedusaError,
  isPresent,
  mergeMetadata,
} from "@medusajs/framework/utils"
import { SqlEntityManager, wrap } from "@mikro-orm/postgresql"

export class ProductRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  Product
) {
  constructor(...args: any[]) {
    // @ts-ignore
    super(...arguments)
  }

  /**
   * Override the base find method to add store_id filtering
   */
  async find(
    findOptions: DAL.FindOptions<typeof Product> = { where: {} },
    context: Context = {}
  ): Promise<InferEntityType<typeof Product>[]> {
    // Add store_id filtering if present in context
    if (context.store_id && !findOptions.where?.store_id) {
      findOptions.where = {
        ...findOptions.where,
        store_id: context.store_id,
      }
    }

    await this.mutateNotInCategoriesConstraints(findOptions, context)
    
    return super.find(findOptions, context)
  }

  /**
   * Override the base findAndCount method to add store_id filtering
   */
  async findAndCount(
    findOptions: DAL.FindOptions<typeof Product> = { where: {} },
    context: Context = {}
  ): Promise<[InferEntityType<typeof Product>[], number]> {
    // Add store_id filtering if present in context
    if (context.store_id && !findOptions.where?.store_id) {
      findOptions.where = {
        ...findOptions.where,
        store_id: context.store_id,
      }
    }

    await this.mutateNotInCategoriesConstraints(findOptions, context)
    
    return super.findAndCount(findOptions, context)
  }

  /**
   * Override create to automatically add store_id
   */
  async create(
  data: any[],
  context: Context = {}
  ): Promise<InferEntityType<typeof Product>[]> {
    // Add store_id to each item if present in context and not already in data
    if (context.store_id) {
      data = data.map(item => ({
        ...item,
        store_id: item.store_id || context.store_id
      }))
    }

    return super.create(data, context)
  }

  /**
   * Override upsert to automatically add store_id
   */
  async upsert(
    data: any[],
    context: Context = {}
  ): Promise<InferEntityType<typeof Product>[]> {
    // Add store_id to each item if present in context
    if (context.store_id) {
      data = data.map(item => ({
        ...item,
        store_id: item.store_id || context.store_id
      }))
    }

    return super.upsert(data, context)
  }

  /**
   * Identify the relations to load for the given update.
   * @param update
   * @returns
   */
  static #getProductDeepUpdateRelationsToLoad(
    productsToUpdate: any[]
  ): string[] {
    const relationsToLoad = new Set<string>()
    productsToUpdate.forEach((productToUpdate) => {
      if (productToUpdate.options) {
        relationsToLoad.add("options")
        relationsToLoad.add("options.values")
      }
      if (productToUpdate.variants) {
        relationsToLoad.add("options")
        relationsToLoad.add("options.values")
        relationsToLoad.add("variants")
        relationsToLoad.add("variants.options")
        relationsToLoad.add("variants.options.option")
      }
      if (productToUpdate.tags) relationsToLoad.add("tags")
      if (productToUpdate.categories) relationsToLoad.add("categories")
      if (productToUpdate.images) relationsToLoad.add("images")
      if (productToUpdate.collection) relationsToLoad.add("collection")
      if (productToUpdate.type) relationsToLoad.add("type")
    })
    return Array.from(relationsToLoad)
  }

  // We should probably fix the column types in the database to avoid this
  // It would also match the types in ProductVariant, which are already numbers
  static #correctUpdateDTOTypes(productToUpdate: {
    weight?: string | number
    length?: string | number
    height?: string | number
    width?: string | number
  }) {
    productToUpdate.weight = productToUpdate.weight?.toString()
    productToUpdate.length = productToUpdate.length?.toString()
    productToUpdate.height = productToUpdate.height?.toString()
    productToUpdate.width = productToUpdate.width?.toString()
  }

  async deepUpdate(
    productsToUpdate: ({ id: string } & any)[],
    validateVariantOptions: (
      variants: any[],
      options: InferEntityType<typeof ProductOption>[]
    ) => void,
    context: Context = {}
  ): Promise<InferEntityType<typeof Product>[]> {
    const productIdsToUpdate: string[] = []
    productsToUpdate.forEach((productToUpdate) => {
      ProductRepository.#correctUpdateDTOTypes(productToUpdate)
      productIdsToUpdate.push(productToUpdate.id)
    })

    const relationsToLoad =
      ProductRepository.#getProductDeepUpdateRelationsToLoad(productsToUpdate)

    const findOptions = buildQuery(
      { 
        id: productIdsToUpdate,
        // Add store_id filtering for updates
        ...(context.store_id && { store_id: context.store_id })
      },
      {
        relations: relationsToLoad,
        take: productsToUpdate.length,
      }
    )

    const products = await this.find(findOptions, context)
    const productsMap = new Map(products.map((p) => [p.id, p]))

    const productIds = Array.from(productsMap.keys())
    const productsNotFound = arrayDifference(productIdsToUpdate, productIds)

    if (productsNotFound.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Unable to update the products with ids: ${productsNotFound.join(", ")}`
      )
    }

    for (const productToUpdate of productsToUpdate) {
      const product = productsMap.get(productToUpdate.id)!
      const wrappedProduct = wrap(product)

      // Assign the options first, so they'll be available for the variants loop below
      if (productToUpdate.options) {
        wrappedProduct.assign({ options: productToUpdate.options })
        delete productToUpdate.options // already assigned above, so no longer necessary
      }

      if (productToUpdate.variants) {
        validateVariantOptions(productToUpdate.variants, product.options)

        productToUpdate.variants.forEach((variant: any) => {
          if (variant.options) {
            variant.options = Object.entries(variant.options).map(
              ([key, value]) => {
                const productOption = product.options.find(
                  (option) => option.title === key
                )!
                const productOptionValue = productOption.values?.find(
                  (optionValue) => optionValue.value === value
                )!
                return productOptionValue.id
              }
            )
          }
        })
      }

      if (productToUpdate.tags) {
        productToUpdate.tags = productToUpdate.tags.map(
          (t: { id: string }) => t.id
        )
      }
      if (productToUpdate.categories) {
        productToUpdate.categories = productToUpdate.categories.map(
          (c: { id: string }) => c.id
        )
      }
      if (productToUpdate.images) {
        productToUpdate.images = productToUpdate.images.map(
          (image: any, index: number) => ({
            ...image,
            rank: index,
          })
        )
      }

      if (isPresent(productToUpdate.metadata)) {
        productToUpdate.metadata = mergeMetadata(product.metadata ?? {}, productToUpdate.metadata)
      }

      wrappedProduct.assign(productToUpdate)
    }

    // Doing this to ensure updates are returned in the same order they were provided,
    // since some core flows rely on this.
    // This is a high level of coupling though.
    return productsToUpdate.map(
      (productToUpdate) => productsMap.get(productToUpdate.id)!
    )
  }

  /**
   * In order to be able to have a strict not in categories, and prevent a product
   * to be return in the case it also belongs to other categories, we need to
   * first find all products that are in the categories, and then exclude them
   */
  protected async mutateNotInCategoriesConstraints(
    findOptions: DAL.FindOptions<typeof Product> = {
      where: {},
    },
    context: Context = {}
  ): Promise<void> {
    const manager = this.getActiveManager<SqlEntityManager>(context)

    if (
      "categories" in findOptions.where &&
      findOptions.where.categories?.id?.["$nin"]
    ) {
      const whereClause: any = {
        categories: {
          id: { $in: findOptions.where.categories.id["$nin"] },
        },
      }

      // Add store_id filtering for category constraint mutation
      if (context.store_id) {
        whereClause.store_id = context.store_id
      }

      const productsInCategories = await manager.find(
        this.entity,
        whereClause,
        {
          fields: ["id"],
        }
      )

      const productIds = productsInCategories.map((product) => product.id)

      if (productIds.length) {
        findOptions.where.id = { $nin: productIds }
        delete findOptions.where.categories?.id

        if (Object.keys(findOptions.where.categories).length === 0) {
          delete findOptions.where.categories
        }
      }
    }
  }
}
