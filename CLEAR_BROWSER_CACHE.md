# 🧹 Limpiar Cache del Navegador

## El Problema
Estás viendo 38 trades con $425 P&L en el frontend, pero la base de datos está vacía.
Esto significa que el navegador tiene datos cacheados del localStorage o del estado de Zustand.

## Solución: Limpiar LocalStorage

### Opción 1: Desde el Navegador (Recomendado)

1. Abre las **DevTools** del navegador (F12)
2. Ve a la pestaña **Application** (Chrome/Brave) o **Storage** (Firefox)
3. En el menú izquierdo, encuentra **Local Storage**
4. Click en `http://localhost:5175` (o el puerto que uses)
5. Click derecho → **Clear** o presiona el botón de borrar
6. Recarga la página (Ctrl+R o Cmd+R)

### Opción 2: Desde la Consola del Navegador

1. Abre la **Consola** (F12 → Console)
2. Ejecuta este comando:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

### Opción 3: Hard Refresh

1. Presiona **Ctrl+Shift+R** (Windows/Linux) o **Cmd+Shift+R** (Mac)
2. Esto recarga la página ignorando el cache

## Verificación

Después de limpiar el cache:

1. Las stats cards deberían mostrar **0 trades**
2. La tabla debería mostrar **"No data available"**
3. El Total Net P&L debería ser **$0.00**

## Próximo Paso

Una vez confirmado que el frontend está limpio, puedes:

1. Importar tu archivo CSV de NT8 usando:
   ```bash
   ./import-nt8-file.sh /ruta/a/tu/archivo.csv 4.04
   ```

2. O desde la interfaz web:
   - Ir a Import → Upload File → Preview → Execute
