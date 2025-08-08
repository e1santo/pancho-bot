// src/server.js

import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
// Carga variables de entorno desde .env
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// 1) Middleware CORS: habilita peticiones desde tu frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://www.maselectrourquiza.com']
    : ['http://localhost:5173', 'https://www.maselectrourquiza.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}))

// 2) Body parser para JSON
app.use(express.json())

// 3) Rutas de tu API
import panchoRouter from './routes/pancho.js'
import reindexRouter from './routes/reindex.js'

app.use('/api/pancho', panchoRouter)
app.use('/api/reindex', reindexRouter)

// 4) (Opcional) Servir tu frontend estático en producción
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(process.cwd(), 'public')
  const indexFile  = path.join(publicPath, 'index.html')

  if (fs.existsSync(indexFile)) {
    app.use(express.static(publicPath))
    app.get('*', (req, res) => {
      res.sendFile(indexFile)
    })
  } else {
    console.warn('⚠️  No encontré public/index.html — no sirvo estático.')
  }
}


// 5) Arrancar servidor
app.listen(port, () => {
  console.log(`🚀 Pancho API corriendo en http://localhost:${port}`)
})

