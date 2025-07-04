import {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityDTO,
  AuthIdentityProviderService,
  EmailPassAuthProviderOptions,
  Logger,
  Query,
} from "@medusajs/framework/types"
import {
  AbstractAuthModuleProvider,
  isString,
  MedusaError,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import Scrypt from "scrypt-kdf"

type InjectedDependencies = {
  logger: Logger
  [ContainerRegistrationKeys.QUERY]: Query
}

interface LocalServiceConfig extends EmailPassAuthProviderOptions {}

export class EmailPassAuthService extends AbstractAuthModuleProvider {
  static identifier = "emailpass"
  static DISPLAY_NAME = "Email/Password Authentication"

  protected config_: LocalServiceConfig
  protected logger_: Logger
  protected query_: Query

  constructor(
    { logger, [ContainerRegistrationKeys.QUERY]: query }: InjectedDependencies,
    options: EmailPassAuthProviderOptions
  ) {
    // @ts-ignore
    super(...arguments)
    this.config_ = options
    this.logger_ = logger
    this.query_ = query
  }

  protected async hashPassword(password: string) {
    const hashConfig = this.config_.hashConfig ?? { logN: 15, r: 8, p: 1 }
    const passwordHash = await Scrypt.kdf(password, hashConfig)
    return passwordHash.toString("base64")
  }

  async update(
    data: { password: string; entity_id: string },
    authIdentityService: AuthIdentityProviderService
  ) {
    const { password, entity_id } = data ?? {}

    if (!entity_id) {
      return {
        success: false,
        error: `Cannot update ${this.provider} provider identity without entity_id`,
      }
    }

    if (!password || !isString(password)) {
      return { success: true }
    }

    let authIdentity

    try {
      const passwordHash = await this.hashPassword(password)

      authIdentity = await authIdentityService.update(entity_id, {
        provider_metadata: {
          password: passwordHash,
        },
      })
    } catch (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      authIdentity,
    }
  }

  protected async createAuthIdentity({ email, password, authIdentityService }) {
    const passwordHash = await this.hashPassword(password)

    const createdAuthIdentity = await authIdentityService.create({
      entity_id: email,
      provider_metadata: {
        password: passwordHash,
      },
    })

    const copy = JSON.parse(JSON.stringify(createdAuthIdentity))
    const providerIdentity = copy.provider_identities?.find(
      (pi) => pi.provider === this.provider
    )!
    delete providerIdentity.provider_metadata?.password

    return copy
  }

  private async getStoresByUserId(userId: string) {
    try {
      if (!this.query_) {
        this.logger_.warn("Query service not available for store lookup")
        return []
      }

      // Query stores related to the user
      const storesResponse = await this.query_.graph({
        entity: "store",
        fields: ["id", "name"],
        filters: { user_id: userId },
      })

      // Medusa's query.graph returns an object: { data: [], metadata?: ... }
      return storesResponse?.data || []
    } catch (error) {
      this.logger_.error("Error fetching stores by user ID:", error)
      return []
    }
  }

  async authenticate(
    userData: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { email, password } = userData.body ?? {}

    if (!password || !isString(password)) {
      return {
        success: false,
        error: "Password should be a string",
      }
    }

    if (!email || !isString(email)) {
      return {
        success: false,
        error: "Email should be a string",
      }
    }

    let authIdentity: AuthIdentityDTO | undefined

    try {
      authIdentity = await authIdentityService.retrieve({
        entity_id: email,
      })
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      return { success: false, error: error.message }
    }

    const providerIdentity = authIdentity.provider_identities?.find(
      (pi) => pi.provider === this.provider
    )!
    const passwordHash = providerIdentity.provider_metadata?.password

    if (isString(passwordHash)) {
      const buf = Buffer.from(passwordHash as string, "base64")
      const success = await Scrypt.verify(buf, password)

      if (success) {
        const copy = JSON.parse(JSON.stringify(authIdentity))
        const providerIdentity = copy.provider_identities?.find(
          (pi) => pi.provider === this.provider
        )!
        delete providerIdentity.provider_metadata?.password

        // 🚀 Fetch store_id using query service
        try {
          const userId = authIdentity?.app_metadata?.user_id as string
          const stores = await this.getStoresByUserId(userId)
          // Add store_id to auth metadata if store exists
          if (stores.length > 0) {
            copy.app_metadata = {
              ...copy.app_metadata,
              store_id: stores[0].id, // Using first store
            }
          }
        } catch (error) {
          this.logger_.error("Error adding store_id to auth metadata:", error)
          // Continue with authentication even if store lookup fails
        }

        return {
          success,
          authIdentity: copy,
        }
      }
    }

    return {
      success: false,
      error: "Invalid email or password",
    }
  }

  async register(
    userData: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { email, password } = userData.body ?? {}

    if (!password || !isString(password)) {
      return {
        success: false,
        error: "Password should be a string",
      }
    }

    if (!email || !isString(email)) {
      return {
        success: false,
        error: "Email should be a string",
      }
    }

    try {
      await authIdentityService.retrieve({
        entity_id: email,
      })

      return {
        success: false,
        error: "Identity with email already exists",
      }
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await this.createAuthIdentity({
          email,
          password,
          authIdentityService,
        })

        return {
          success: true,
          authIdentity: createdAuthIdentity,
        }
      }

      return { success: false, error: error.message }
    }
  }
}
