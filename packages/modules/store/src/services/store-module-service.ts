import {
  Context,
  DAL,
  InferEntityType,
  InternalModuleDeclaration,
  IStoreModuleService,
  ModulesSdkTypes,
  StoreTypes,
} from "@medusajs/framework/types"
import {
  getDuplicates,
  InjectManager,
  InjectTransactionManager,
  isString,
  MedusaContext,
  MedusaError,
  MedusaService,
  promiseAll,
  removeUndefined,
} from "@medusajs/framework/utils"

import { Store, StoreCurrency } from "@models"
import { UpdateStoreInput } from "@types"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  storeService: ModulesSdkTypes.IMedusaInternalService<any>
}

export default class StoreModuleService
  extends MedusaService<{
    Store: { dto: StoreTypes.StoreDTO }
    StoreCurrency: { dto: StoreTypes.StoreCurrencyDTO }
  }>({ Store, StoreCurrency })
  implements IStoreModuleService
{
  protected baseRepository_: DAL.RepositoryService
  protected readonly storeService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof Store>
  >

  constructor(
    { baseRepository, storeService }: InjectedDependencies,
    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    // @ts-ignore
    super(...arguments)
    this.baseRepository_ = baseRepository
    this.storeService_ = storeService
  }

  // Multi-tenancy helper method to get stores by user
  retrieveStoresByUserId = async (
    userId: string,
    config?: { relations?: string[] },
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO[]> => {
    return await this.listStores(
      { user_id: userId },
      { relations: config?.relations || ["supported_currencies"] },
      sharedContext
    )
  }

  // Override listStores to add user_id filtering capability
  listStores = async (
    filters: StoreTypes.FilterableStoreProps & { user_id?: string } = {},
    config: { relations?: string[] } = {},
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO[]> => {
    const stores = await this.storeService_.list(
      filters,
      { relations: config.relations || [] },
      sharedContext
    )

    return await this.baseRepository_.serialize<StoreTypes.StoreDTO[]>(stores)
  }

  // @ts-expect-error
  async createStores(
    data: (StoreTypes.CreateStoreDTO & { user_id: string })[],
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO[]>
  // @ts-expect-error
  async createStores(
    data: StoreTypes.CreateStoreDTO & { user_id: string },
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO>
  @InjectManager()
  // @ts-expect-error
  async createStores(
    data: (StoreTypes.CreateStoreDTO & { user_id: string }) | (StoreTypes.CreateStoreDTO & { user_id: string })[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<StoreTypes.StoreDTO | StoreTypes.StoreDTO[]> {
    const input = Array.isArray(data) ? data : [data]

    // Validate that user_id is provided for all stores
    for (const store of input) {
      if (!store.user_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "user_id is required for store creation"
        )
      }
    }

    const result = await this.create_(input, sharedContext)

    return await this.baseRepository_.serialize<StoreTypes.StoreDTO[]>(
      Array.isArray(data) ? result : result[0]
    )
  }

  @InjectTransactionManager()
  async create_(
    data: (StoreTypes.CreateStoreDTO & { user_id: string })[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof Store>[]> {
    let normalizedInput = StoreModuleService.normalizeInput(data)
    StoreModuleService.validateCreateRequest(normalizedInput)

    return (
      await this.storeService_.upsertWithReplace(
        normalizedInput,
        { relations: ["supported_currencies"] },
        sharedContext
      )
    ).entities
  }

  async upsertStores(
    data: (StoreTypes.UpsertStoreDTO & { user_id?: string })[],
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO[]>
  async upsertStores(
    data: StoreTypes.UpsertStoreDTO & { user_id?: string },
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO>
  @InjectTransactionManager()
  async upsertStores(
    data: (StoreTypes.UpsertStoreDTO & { user_id?: string }) | (StoreTypes.UpsertStoreDTO & { user_id?: string })[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<StoreTypes.StoreDTO | StoreTypes.StoreDTO[]> {
    const input = Array.isArray(data) ? data : [data]
    const forUpdate = input.filter(
      (store): store is UpdateStoreInput & { user_id?: string } => !!store.id
    )
    const forCreate = input.filter(
      (store): store is StoreTypes.CreateStoreDTO & { user_id: string } => !store.id
    )

    // Validate user_id for new stores
    for (const store of forCreate) {
      if (!store.user_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "user_id is required for store creation"
        )
      }
    }

    const operations: Promise<InferEntityType<typeof Store>[]>[] = []

    if (forCreate.length) {
      operations.push(this.create_(forCreate, sharedContext))
    }
    if (forUpdate.length) {
      operations.push(this.update_(forUpdate, sharedContext))
    }

    const result = (await promiseAll(operations)).flat()
    return await this.baseRepository_.serialize<
      StoreTypes.StoreDTO[] | StoreTypes.StoreDTO
    >(Array.isArray(data) ? result : result[0])
  }

  // @ts-expect-error
  async updateStores(
    id: string,
    data: StoreTypes.UpdateStoreDTO,
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO>
  // @ts-expect-error
  async updateStores(
    selector: StoreTypes.FilterableStoreProps & { user_id?: string },
    data: StoreTypes.UpdateStoreDTO,
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO[]>
  @InjectManager()
  // @ts-expect-error
  async updateStores(
    idOrSelector: string | (StoreTypes.FilterableStoreProps & { user_id?: string }),
    data: StoreTypes.UpdateStoreDTO,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<StoreTypes.StoreDTO | StoreTypes.StoreDTO[]> {
    let normalizedInput: (UpdateStoreInput & { user_id?: string })[] = []
    if (isString(idOrSelector)) {
      normalizedInput = [{ id: idOrSelector, ...data }]
    } else {
      const stores = await this.storeService_.list(
        idOrSelector,
        {},
        sharedContext
      )

      normalizedInput = stores.map((store) => ({
        id: store.id,
        ...data,
      }))
    }

    const updateResult = await this.update_(normalizedInput, sharedContext)

    const stores = await this.baseRepository_.serialize<
      StoreTypes.StoreDTO[] | StoreTypes.StoreDTO
    >(updateResult)

    return isString(idOrSelector) ? stores[0] : stores
  }

  // Multi-tenancy method to update stores with user ownership validation
  async updateStoresByUserId(
    userId: string,
    storeId: string,
    data: StoreTypes.UpdateStoreDTO,
    sharedContext?: Context
  ): Promise<StoreTypes.StoreDTO> {
    // First verify the store belongs to the user
    const stores = await this.retrieveStoresByUserId(userId, {}, sharedContext)
    const store = stores.find(s => s.id === storeId)
    
    if (!store) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with id ${storeId} not found for user ${userId}`
      )
    }

    return await this.updateStores(storeId, data, sharedContext)
  }

  // Multi-tenancy method to delete stores with user ownership validation
  async deleteStoresByUserId(
    userId: string,
    storeIds: string[],
    sharedContext?: Context
  ): Promise<void> {
    // Verify all stores belong to the user
    const userStores = await this.retrieveStoresByUserId(userId, {}, sharedContext)
    const userStoreIds = userStores.map(s => s.id)
    
    const unauthorizedStores = storeIds.filter(id => !userStoreIds.includes(id))
    if (unauthorizedStores.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Unauthorized access to stores: ${unauthorizedStores.join(", ")}`
      )
    }

    await this.deleteStores(storeIds, sharedContext)
  }

  @InjectTransactionManager()
  protected async update_(
    data: (UpdateStoreInput & { user_id?: string })[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof Store>[]> {
    const normalizedInput = StoreModuleService.normalizeInput(data)
    StoreModuleService.validateUpdateRequest(normalizedInput)

    return (
      await this.storeService_.upsertWithReplace(
        normalizedInput,
        { relations: ["supported_currencies"] },
        sharedContext
      )
    ).entities
  }

  private static normalizeInput<T extends StoreTypes.UpdateStoreDTO & { user_id?: string }>(
    stores: T[]
  ): T[] {
    return stores.map((store) =>
      removeUndefined({
        ...store,
        supported_currencies: store.supported_currencies?.map((c) => ({
          ...c,
          currency_code: c.currency_code.toLowerCase(),
        })),
        name: store.name?.trim(),
        user_id: store.user_id?.trim(), // Normalize user_id
      })
    )
  }

  private static validateCreateRequest(
    stores: (StoreTypes.CreateStoreDTO & { user_id?: string })[] | (StoreTypes.UpdateStoreDTO & { user_id?: string })[]
  ) {
    for (const store of stores) {
      // Validate user_id for new stores
      // Check if store has 'id' key safely
      if ("id" in store) {
        // It's an UpdateStoreDTO, id is allowed to be missing here
        continue
      }

      // If 'id' does not exist, it's a CreateStoreDTO → Validate user_id is present
      if (!store.user_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "user_id is required for store creation"
        )
      }

      if (store.supported_currencies?.length) {
        const duplicates = getDuplicates(
          store.supported_currencies?.map((c) => c.currency_code)
        )

        if (duplicates.length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Duplicate currency codes: ${duplicates.join(", ")}`
          )
        }

        let seenDefault = false
        store.supported_currencies?.forEach((c) => {
          if (c.is_default) {
            if (seenDefault) {
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Only one default currency is allowed`
              )
            }
            seenDefault = true
          }
        })

        if (!seenDefault) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `There should be a default currency set for the store`
          )
        }
      }
    }
  }

  private static validateUpdateRequest(stores: (UpdateStoreInput & { user_id?: string })[]) {
    StoreModuleService.validateCreateRequest(stores)
  }
}
