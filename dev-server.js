const path = require("path")
const express = require("express")
const { isObject } = require("@medusajs/framework/utils")

async function startDevServer() {
  const app = express()
  
  // Set up environment variables
  const env = {
    NODE_ENV: "development",
    JWT_SECRET: process.env.JWT_SECRET || "your-jwt-secret-here",
    COOKIE_SECRET: process.env.COOKIE_SECRET || "your-cookie-secret-here",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/medusa-source-store",
    MEDUSA_ADMIN_ONBOARDING_TYPE: "default",
    MEDUSA_ADMIN_ONBOARDING_NEXTJS: false,
    STORE_CORS: "http://localhost:8000,http://localhost:5173",
    ADMIN_CORS: "http://localhost:7001,http://localhost:5173",
    AUTH_CORS: "http://localhost:8000,http://localhost:5173",
  }

  if (isObject(env)) {
    Object.entries(env).forEach(([k, v]) => (process.env[k] = v))
  }

  console.log("🚀 Starting Medusa development server...")

  try {
    // Ensure we have a valid medusa-config.js
    const configPath = path.resolve(process.cwd(), "medusa-config.js")
    console.log("📝 Looking for config at:", configPath)
    
    try {
      const config = require(configPath)
      console.log("✅ Config loaded successfully")
      
    } catch (configError) {
      console.error("❌ Error loading medusa-config.js:", configError.message)
      throw configError
    }

    // Load the Medusa loaders from local packages
    const loaders = require("./packages/medusa/dist/loaders").default

    console.log("Loading Medusa with directory:", path.resolve(process.cwd()))

    const { container, shutdown } = await loaders({
      directory: path.resolve(process.cwd()),
      expressApp: app,
      isTest: false,
    })

    const PORT = process.env.PORT || 9000

    // Add error handling middleware
    app.use((error, req, res, next) => {
      console.error("Express Error:", error)
      res.status(500).json({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    })

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Medusa backend is running on http://localhost:${PORT}`)
      console.log(`📝 Admin API: http://localhost:${PORT}/admin/`)
      console.log(`🛍️  Store API: http://localhost:${PORT}/store/`)
      console.log(`📚 Documentation: http://localhost:${PORT}/docs/`)
    })

    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
      try {
        if (shutdown) {
          await shutdown()
        }
        server.close(() => {
          console.log('✅ Server closed')
          process.exit(0)
        })
      } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    return { app, server, container, shutdown }
  } catch (error) {
    console.error("❌ Failed to start Medusa server:")
    console.error("Error message:", error.message)
    console.error("Stack trace:", error.stack)
    
    // More specific error handling
    if (error.message.includes('Cannot read properties of undefined')) {
      console.log("\n🔍 Authentication Error Detected!")
      console.log("Possible fixes:")
      console.log("1. Check medusa-config.js has auth module configured")
      console.log("2. Verify @medusajs/medusa/auth-emailpass is installed")
      console.log("3. Run: npm install @medusajs/medusa")
      console.log("4. Check database migrations are up to date")
      console.log("5. Verify JWT_SECRET and COOKIE_SECRET are set")
    }
    
    process.exit(1)
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startDevServer()
}

module.exports = { startDevServer }