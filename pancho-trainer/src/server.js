// pancho-trainer/src/server.js
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import basicAuth from 'express-basic-auth'
import uploadRouter from './routes/upload.js'
import listRouter   from './routes/list.js'
import metaRouter   from './routes/metadata.js'

/** Reconstruir __dirname en ES Modules */
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

// 1) Autenticación básica
app.use(basicAuth({
  users: { 'admin': 'tuPasswordSeguro' },
  challenge: true,
  realm: 'PanchoTrainer'
}))

// 2) Parseo de formularios y JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// 3) Servir archivos estáticos de public/
app.use(express.static(join(__dirname, '../public')))

// 4) Montar routers en sus paths
app.use('/api/upload', uploadRouter)
app.use('/api/files',  listRouter)
app.use('/api/meta',   metaRouter)

// 5) Arrancar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Trainer protegido corriendo en http://localhost:${PORT}`)
})
