document.addEventListener('DOMContentLoaded', () => {
  // Manejo de pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.replace('border-blue-600','border-transparent')
        b.classList.replace('text-blue-600','text-gray-500')
      })
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'))
      btn.classList.replace('text-gray-500','text-blue-600')
      btn.classList.replace('border-transparent','border-blue-600')
      document.getElementById('content-' + btn.dataset.tab).classList.remove('hidden')
    })
  })
  document.querySelector('.tab-btn[data-tab="pdfs"]').click()

  fetchAndRenderLists()
})

async function fetchAndRenderLists() {
  const types = ['pdfs','images','videos','excel']
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
          ${files.map((file, i) => {
            // Común: botón delete con data-index
            const deleteBtn = `<button data-type="${type}" data-index="${i}" class="text-red-500 hover:underline btn-delete">Eliminar</button>`

            // Formateo por tipo
            if (type === 'pdfs') {
              return `<li class="p-4 bg-white rounded shadow-sm flex justify-between">
                        <span>${file.source}</span>${deleteBtn}
                      </li>`
            }
            if (type === 'images') {
              return `<li class="p-4 bg-white rounded shadow-sm">
                        <div class="flex justify-between">
                          <span>${file.filename}</span>${deleteBtn}
                        </div>
                        <p><strong>Título:</strong> ${file.title}</p>
                        <p><strong>Descripción:</strong> ${file.description}</p>
                        <p><strong>Tags:</strong> ${file.tags.join(', ')}</p>
                      </li>`
            }
            if (type === 'videos') {
              return `<li class="p-4 bg-white rounded shadow-sm">
                        <div class="flex justify-between">
                          <a href="${file.url}" target="_blank">${file.url}</a>
                          ${deleteBtn}
                        </div>
                        <p><strong>Título:</strong> ${file.title}</p>
                        <p><strong>Descripción:</strong> ${file.description}</p>
                        <p><strong>Tags:</strong> ${file.tags.join(', ')}</p>
                      </li>`
            }
            // excel
            return `<li class="p-4 bg-white rounded shadow-sm flex justify-between">
                      <span>${file.filename || file.id}</span>${deleteBtn}
                    </li>`
          }).join('')}
        </ul>
      `
      container.appendChild(section)
    } catch (err) {
      console.error(`Error listando ${type}:`, err)
    }
  }

  // Agregar listeners a los botones de borrado
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type
      const index = btn.dataset.index
      try {
        await fetch(`/api/files/${type}/${index}`, { method: 'DELETE' })
        fetchAndRenderLists()
      } catch (e) {
        console.error('Error borrando:', e)
      }
    })
  })
}
