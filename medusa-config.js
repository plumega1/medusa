const { loadEnv, defineConfig } = require('@medusajs/framework/utils')
const { Modules, ContainerRegistrationKeys } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:5173",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:5173",
      authCors: process.env.AUTH_CORS || "http://localhost:8000,http://localhost:5173",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: process.env.MEDUSA_WORKER_MODE || "shared",
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER, ContainerRegistrationKeys.QUERY],
      options: {
        providers: [
          // other providers...
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
            options: {
              // options...
            },
          },
        ],
      },
    },
    // Add other modules as needed
  ],
})