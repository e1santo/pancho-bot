// src/services/excelService.js
// src/services/excelService.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import xlsx from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Directorio donde pancho-trainer guarda los excels/csv
const EXCEL_DIR = path.resolve(__dirname, '../../../pancho-trainer/uploads/excel')
// Manifest a generar
const PRODUCTS_MANIFEST = path.resolve(__dirname, '../manifests/products.json')

export async function excelService() {
  console.log('📦 excelService: leyendo desde', EXCEL_DIR)
  const manifest = []
  try {
    const files = await fs.readdir(EXCEL_DIR)
    console.log('📦 excelService encontró:', files)

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      if (!['.xlsx', '.xls', '.csv'].includes(ext)) continue

      const workbook = xlsx.read(await fs.readFile(path.join(EXCEL_DIR, file)), { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' })

      for (const row of rows) {
        const product = {
          id:    String(row['Product ID'] ?? '').trim(),
          name:  String(row['Nombre'] ?? '').trim(),
          price: String(row['Precio (imp. incl.)'] ?? row['Precio (imp. excl.)'] ?? '').trim(),
          url:   String(row['Imagen'] ?? '').trim(),
          // incluir el resto si quieres
          referencia: String(row['Referencia'] ?? '').trim(),
          categoria:  String(row['Categoría'] ?? row['CategorÃ­a'] ?? '').trim()
        }
        if (product.id && product.name) {
          manifest.push(product)
        }
      }
    }

    await fs.writeFile(PRODUCTS_MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`✅ excelService: generado ${manifest.length} productos en products.json`)
  } catch (err) {
    console.error('❌ excelService error:', err)
    throw err
  }
}
