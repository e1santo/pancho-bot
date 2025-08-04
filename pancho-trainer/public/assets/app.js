// public/assets/app.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Alternar pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.replace('border-blue-600', 'border-transparent')
        b.classList.replace('text-blue-600', 'text-gray-500')
      })
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'))
      btn.classList.replace('text-gray-500', 'text-blue-600')
      btn.classList.replace('border-transparent', 'border-blue-600')
      document.getElementById('content-' + btn.dataset.tab).classList.remove('hidden')
    })
  })
  document.querySelector('.tab-btn[data-tab="pdfs"]').click()

  // 2) Cargar lista de archivos con metadata
  fetchAndRenderLists()
})

// Fetch y render de lista
async function fetchAndRenderLists() {
  const types = ['pdfs', 'images', 'videos', 'excel']
  const container = document.getElementById('lists')
  container.innerHTML = ''

  for (const type of types) {
    try {
      const res = await fetch(`/api/files/${type}`)
      const { files } = await res.json()
      const section = document.createElement('div')
      section.innerHTML = `
        <h3 class="text-lg font-semibold capitalize mb-2">${type}</h3>
        <ul class="space-y-4">
          ${files.map(item => renderFileItem(type, item)).join('')}
        </ul>
      `
      container.appendChild(section)
    } catch (err) {
      console.error(`Error listando ${type}:`, err)
    }
  }

  attachDeleteHandlers()
}

// Render de cada ítem con metadata
function renderFileItem(type, item) {
  // determinar display de identificador
  const name = type === 'videos' ? item.url : (item.filename || item.source || '')
  // tags como lista
  const tags = Array.isArray(item.tags) ? item.tags.join(', ') : ''

  return `
    <li class="p-4 border rounded bg-white">
      <div class="flex justify-between items-center mb-2">
        <strong>${name}</strong>
        <button data-type="${type}" data-file="${name}" class="text-red-500 hover:underline btn-delete">
          Eliminar
        </button>
      </div>
      ${item.title ? `<div class="text-sm"><strong>Título:</strong> ${item.title}</div>` : ''}
      ${item.description ? `<div class="text-sm"><strong>Descripción:</strong> ${item.description}</div>` : ''}
      ${tags ? `<div class="text-sm"><strong>Tags:</strong> ${tags}</div>` : ''}
    </li>
  `
}

// Adjuntar eventos de borrado
function attachDeleteHandlers() {
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type
      const file = btn.dataset.file
      if (!confirm(`¿Borrar "${file}" de ${type}?`)) return
      try {
        await fetch(`/api/files/${type}/${encodeURIComponent(file)}`, { method: 'DELETE' })
        fetchAndRenderLists()
      } catch (err) {
        console.error('Error borrando archivo:', err)
      }
    })
  })
}
