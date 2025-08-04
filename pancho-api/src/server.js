// src/server.js

import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'

// Carga variables de entorno desde .env
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())

// Rutas
import panchoRouter from './routes/pancho.js'
import reindexRouter from './routes/reindex.js'

app.use('/api/pancho', panchoRouter)
app.use('/api/reindex', reindexRouter)

// Arrancar servidor
app.listen(port, () => {
  console.log(`🚀 Pancho API corriendo en http://localhost:${port}`)
})
