# Richard Three.js Editor

Editor de escenas 3D construido sobre el [Three.js Editor](https://threejs.org/editor/), extendido con nuevas funcionalidades para la creación de UI Canvas y previsualización en tiempo real.

## 🌐 Demo en vivo

[https://richard-cell.github.io/RichardThreeEditor/](https://richard-cell.github.io/RichardThreeEditor/)
## 🎥 Demo

[Ver video en Google Drive](https://drive.google.com/file/d/1qDMgdHUXSfCF-m6xFYlpHQAgDiFSa7nz/view?usp=sharing)
---

## 🛠️ Tecnologías

| Tecnología | Rol |
|---|---|
| [Three.js r183](https://threejs.org/) | Motor de renderizado 3D, grafo de escena, cargador de objetos |
| JavaScript (ES Modules) | Lenguaje principal, sin framework |
| HTML5 Canvas API | Generación de texturas para elementos UI (texto, imágenes) |
| Node.js | Servidor de desarrollo local |

---

## ✨ Feature: Canvas *(custom)*

Un nuevo sistema de **UI Canvas 2D** integrado en el editor 3D, que permite diseñar overlays de interfaz directamente dentro del editor.

**¿Qué puedes hacer?**
1. **Añadir elementos UI** — componentes Image y Button disponibles desde la toolbar
2. **Vista independiente del Canvas** — viewport 2D ortográfico dedicado, separado de la escena 3D
3. **Seleccionar, mover y escalar elementos** — controles de transformación completos con handles de escala en esquinas; los elementos respetan los límites del canvas
4. **Cargar imágenes locales** — selecciona un elemento Image y carga cualquier imagen desde tu computadora via panel `Scene → UI`
5. **Scripts en botones** — escribe JavaScript personalizado en cualquier elemento Button via panel `Scene → UI`; el script se ejecuta al presionarlo durante el modo Play

**Arquitectura:**
- Casi toda la implementación vive en `editor/js/canvas/`
- Se utilizó el **patrón Factory** (`UICanvasFactory.js`) para la creación de los elementos UI, centralizando la lógica de instanciación de Image y Button en un único punto

**¿Cómo funciona en runtime?**
- Durante el Play, los elementos UI se renderizan como un **overlay screen-space** encima de la escena 3D, por lo que siempre aparecen encima sin importar la profundidad 3D

---

## 🚀 Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Luego abre [http://localhost:8080](http://localhost:8080) — el editor carga automáticamente.

---

## 📄 Licencia

Basado en [Three.js](https://github.com/mrdoob/three.js) — Licencia MIT.
