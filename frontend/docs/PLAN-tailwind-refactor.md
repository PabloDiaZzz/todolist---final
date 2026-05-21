# PLAN-tailwind-refactor.md - Plan de Refactorización de CSS a Clases de Tailwind

Este plan describe el proceso para migrar los estilos personalizados definidos en [style.css](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/style.css) directamente a clases de utilidad de Tailwind CSS en los archivos HTML correspondientes. Esto simplificará el archivo CSS y alineará la estructura visual del proyecto con las mejores prácticas de Tailwind.

---

## 🎯 Objetivo
Reducir al mínimo el contenido de `style.css` moviendo los estilos inline y selectores específicos (como `#task-options`, `@media (max-width: 640px)`, etc.) a las plantillas HTML utilizando clases adaptables y responsivas de Tailwind CSS.

---

## 🔍 Análisis de `style.css`

Actualmente, el archivo [style.css](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/style.css) contiene los siguientes bloques:

### 1. Estilos Globales (Deben Conservarse en CSS)
* Configuración de la barra de desplazamiento global (`html` y `body`), incluyendo el tirador fino, los colores de contraste y `scrollbar-gutter: stable`.
* Estilos para rellenar campos con autocompletado (`-webkit-autofill`).
* Habilitación de transiciones de vista fluidas (`@view-transition`).

### 2. Clases del Sistema de Diseño (Propuestas para mantener como `@utility` o simplificar)
* `.input-underline`
* `.bg-brand`, `.bg-element-primary`, `.bg-back-primary`, `.bg-back-secondary`
* `.text-color`, `.text-color-hover`, `.text-color-secondary`
* `.base-select` (Configuración avanzada del selector de formulario `<select>` nativo)
* `.info-field-*` (Comportamiento de interactividad tooltip interactivo/hover en campos de información)

### 3. Panel de Filtros (`#task-options`)
* Posee transiciones complejas de `width`, `height`, `padding`, `bottom` y `transform`, junto con un retardo escalonado de carga en cascada (`transition-delay: 0.22s`, etc.) para los inputs internos.
* *Nota:* Este panel tiene transiciones fluidas de expansión y colapso que dependen de valores específicos (`3.75rem` de alto, etc.) que se logran de forma óptima en CSS debido a las curvas bezier, pero podemos optimizar y mover el layout estático a Tailwind.

### 4. Media Queries de Mobile (`@media (max-width: 640px)`)
* Controlan la maquetación de las tarjetas de tareas en móviles (`task-item .task-wrapper`) y la disposición vertical de aside en `/settings`.
* **Esto es 100% migráble a Tailwind inline** utilizando modificadores como `max-sm:`, `sm:` o `md:`, eliminando por completo la necesidad de sobreescrituras en CSS con `!important`.

---

## 🛠️ Propuesta de Cambios y Plan de Acción

### Fase 1: Migración de las Media Queries y Maquetación de Tarjetas
* **Archivos a modificar:**
  * [TaskItem.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/components/html/TaskItem.html)
  * [TaskInfo.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/components/html/TaskInfo.html)
* **Acción:**
  * Trasladar los estilos responsivos definidos en `@media (max-width: 640px)` para `task-item .task-wrapper` directamente al HTML usando clases responsivas (`flex flex-col sm:flex-row`, etc.).
  * Mover el formateo del panel inferior de acciones en móviles (`border-t border-gray-100 dark:border-slate-700/50`) directamente a la maquetación de la tarjeta.
  * Eliminar estas secciones del final del archivo `style.css`.

### Fase 2: Refactorización de `#important-filter-btn` y selectores del Panel de Opciones
* **Archivos a modificar:**
  * [HomeView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/HomeView.html) (Contenedor de filtros)
* **Acción:**
  * Sustituir las especificaciones rígidas de `#important-filter-btn` y selectores de filtros por clases de utilidad de Tailwind en el HTML (ejemplo: `h-[38px] w-[38px] shrink-0 p-0 flex items-center justify-center` en lugar de las reglas rígidas de CSS).
  * Mantener únicamente la estructura de animación de expansión/colapso en `style.css` para no perder la suavidad de las transiciones personalizadas del panel.

### Fase 3: Limpieza y Consolidación de `style.css`
* **Archivos a modificar:**
  * [style.css](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/style.css)
* **Acción:**
  * Purgar todos los bloques que han sido migrados a clases inline en los HTML.
  * Reorganizar las utilidades `@layer utilities` o `@utility` restantes para asegurar el máximo orden y claridad del sistema de diseño.

---

## 🧪 Plan de Verificación

### Pruebas Visuales Automatizadas y Manuales
1. **Verificación en Escritorio y Móvil (500px):**
   * Comprobar la visualización exacta de las tarjetas de tareas en `/home` y `/userinfo` tanto en pantalla completa como en simulador móvil a 500px.
   * Asegurar que no hay diferencias ni saltos visuales al alternar el botón de favoritos (estrella) o al desplegar el menú de filtros.
2. **Interactividad del Panel de Filtros:**
   * Validar que la transición de expansión/colapso del panel de opciones sigue siendo premium y fluida.
3. **Consistencia de TypeScript y Compilación:**
   * Ejecutar `npx tsc --noEmit` para certificar que ningún cambio interfiere con los identificadores o selectores dinámicos del código TypeScript.
