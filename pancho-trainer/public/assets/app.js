// public/assets/app.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Alternar pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.replace('border-blue-600','border-transparent')
        b.classList.replace('text-blue-600','text-gray-500')
      })
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'))
      btn.classList.replace('text-gray-500','text-blue-600')
      btn.classList.replace('border-transparent','border-blue-600')
      document.getElementById('content-'+btn.dataset.tab).classList.remove('hidden')
    })
  })
  document.querySelector('.tab-btn[data-tab="pdfs"]').click()

  // 2) Cargar lista de archivos
  fetchAndRenderLists()
})

// Listar y borrar
async function fetchAndRenderLists() {
  const types = ['pdfs','images','excel']
  const container = document.getElementById('lists')
  container.innerHTML = ''

  for (const type of types) {
    try {
      const res = await fetch(`/api/files/${type}`)
      const { files } = await res.json()
      const sect = document.createElement('div')
      sect.innerHTML = `
        <h3 class="text-lg font-semibold capitalize mb-2">${type}</h3>
        <ul class="list-disc list-inside space-y-1">
          ${files.map(f=>`
            <li class="flex justify-between items-center">
              <span>${f}</span>
              <button data-type="${type}" data-file="${f}" class="text-red-500 hover:underline btn-delete">Eliminar</button>
            </li>
          `).join('')}
        </ul>
      `
      container.appendChild(sect)
    } catch (err) {
      console.error(`Error listando ${type}:`, err)
    }
  }

  // Borrar
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type, file = btn.dataset.file
      if (!confirm(`¿Borrar "${file}" de ${type}?`)) return
      try {
        await fetch(`/api/files/${type}/${file}`, { method:'DELETE' })
        fetchAndRenderLists()
      } catch (e) {
        console.error('Error borrando:', e)
      }
    })
  })
}
