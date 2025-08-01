# Pancho Bot - Full Documentation

## 1. Visión general
Mono-repo que contiene:
- **pancho-api**: backend API que sirve endpoints.
- **pancho-chatbot**: lógica conversacional (chatbot).

Ambos corren en un VPS bajo el usuario `matias` y son administrados con PM2. Versionado en GitHub en el repo `pancho-bot`.

## 2. Estructura de carpetas (VPS)
- `/home/matias/panchobot/` - clon del mono-repo desde GitHub.
  - `pancho-api/` - código, dependencias, .env local (no versionado), etc.
  - `pancho-chatbot/` - chatbot logic.
  - `ecosystem.config.js` - configuración PM2 para ambos servicios.
  - `deploy.sh` - script para actualizar y recargar.
- Backups originales:
  - `/home/matias/pancho-api-current-*.tar.gz`
  - `/home/matias/pancho-chatbot-current-*.tar.gz`
- Copias antiguas (respaldos):
  - `/home/matias/pancho-api.old/`
  - `/home/matias/pancho-chatbot.old/`

## 3. Acceso y seguridad SSH
- Usuario principal: `matias` (tiene sudo).
- Login directo de root por SSH está deshabilitado.
- Llave SSH para GitHub y VPS en: `/home/matias/.ssh/id_ed25519` y `.pub`.
- Para autenticarse con GitHub se usa SSH: remote `git@github.com:e1santo/pancho-bot.git`.

## 4. Flujo de trabajo local
1. Descomprimir backup:
   ```bash
   tar -xzf pancho-api-current-*.tar.gz
   tar -xzf pancho-chatbot-current-*.tar.gz
   ```
2. Abrir en VS Code:
   ```powershell
   cd panchobot
   code .
   ```
3. Crear `.env` a partir de ejemplo:
   ```bash
   cp pancho-api/.env.example pancho-api/.env
   cp pancho-chatbot/.env.example pancho-chatbot/.env
   # Editar con claves reales
   ```
4. Usar Git:
   ```bash
   git add .
   git commit -m "mensaje"
   git push
   ```

## 5. Git / GitHub
- Repo remoto: `https://github.com/e1santo/pancho-bot.git` (SSH: `git@github.com:e1santo/pancho-bot.git`)
- Identity configurada:
  ```bash
  git config --global user.name "Matias Cusimano"
  git config --global user.email "mati.cusimano@gmail.com"
  ```
- Ignorar:
  - `.env` y `node_modules` en raíz via `.gitignore`
- Ejemplo de `.gitignore`:
  ```
  node_modules/
  **/node_modules/
  .env
  *.log
  ```

## 6. Movimiento del proyecto desde root a matias (pasos clave)
```bash
sudo cp -a /root/pancho-api /home/matias/
sudo cp -a /root/pancho-chatbot /home/matias/
sudo chown -R matias:matias /home/matias/pancho-api
sudo chown -R matias:matias /home/matias/pancho-chatbot
```

## 7. Backups
- Creación de backups originales:
  ```bash
  sudo tar -czf /home/matias/pancho-api-backup-YYYY-MM-DD_HHMM.tar.gz -C /root pancho-api pancho-chatbot
  tar -czf ~/pancho-api-current-$(date +%F_%H%M).tar.gz -C /home/matias pancho-api
  tar -czf ~/pancho-chatbot-current-$(date +%F_%H%M).tar.gz -C /home/matias pancho-chatbot
  ```
- Transferir a máquina local:
  ```powershell
  scp matias@69.62.104.154:'~/pancho-api-current-*.tar.gz' .
  scp matias@69.62.104.154:'~/pancho-chatbot-current-*.tar.gz' .
  ```

## 8. Instalación y ejecución
En VPS, por subproyecto:
```bash
cd ~/panchobot/pancho-api
npm ci
cd ../pancho-chatbot
npm ci
```
Definir variables secretas en `.env` manualmente (no se suben). 

## 9. PM2 y despliegue
### ecosistema (`ecosystem.config.js`):
```js
module.exports = {
  apps: [
    {
      name: 'pancho-api',
      script: 'index.js',
      cwd: './pancho-api',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'pancho-chatbot',
      script: 'index.js',
      cwd: './pancho-chatbot',
      env: { NODE_ENV: 'production' }
    }
  ]
};
```

### Arrancar / persistir
```bash
pm2 start ecosystem.config.js --update-env
pm2 save
```

### Script de deploy (`deploy.sh`)
```bash
#!/bin/bash
cd ~/panchobot
git pull origin main
cd pancho-api
npm ci
cd ../pancho-chatbot
npm ci
pm2 reload ecosystem.config.js --update-env
```
Asegurarse de hacerlo ejecutable:
```bash
chmod +x ~/panchobot/deploy.sh
```

### Arranque automático PM2 (ya configurado)
Se configuró con `pm2 startup` para user `matias`.

## 10. Recuperación / limpieza
- Para actualizar desde GitHub:
  ```bash
  ~/panchobot/deploy.sh
  ```
- Para ver estado:
  ```bash
  pm2 ls
  ```

## 11. Notas adicionales
- Root login por SSH deshabilitado; usá `sudo -i` desde matias cuando necesites root.  
- `.env` nunca en el repo; usar `.env.example` como plantilla.  
- Si necesitás rehacer el autor del último commit:
  ```bash
  git config --global user.name "Matias Cusimano"
  git config --global user.email "mati.cusimano@gmail.com"
  git commit --amend --reset-author --no-edit
  git push --force-with-lease
  ```

