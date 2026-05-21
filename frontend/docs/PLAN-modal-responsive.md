# PLAN-modal-responsive.md - Plan de Modales Responsivos y Ajuste de Altura de Pantalla (dvh a svh)

Este plan describe las acciones técnicas para corregir los desbordamientos horizontales de los diálogos/modales (especialmente `#task-info`) en pantallas estrechas (móviles) y aplicar la sustitución de tamaños dinámicos de viewport de `dvh` a `svh` para evitar inestabilidades de maquetación causadas por la barra de navegación en navegadores móviles.

También incorpora optimizaciones de maquetación para pantallas ultra-estrechas (360px) en el panel de filtros y corrige la transparencia intermitente en el dropdown de categorías.

---

## 🎯 Objetivos

1. **Ajuste de Modales Responsivos:** Asegurar que todos los elementos `<dialog>` (especialmente el de `#task-info`) se adapten con fluidez a pantallas pequeñas (hasta 320px de ancho) sin desbordarse lateralmente ni romper el centrado premium en resoluciones mayores (pantallas de escritorio).
2. **Soporte de Wrap de Texto en Descripciones:** Prevenir desbordamientos originados por textos continuos largos (como URLs o palabras sin espacios) dentro de la etiqueta `<pre>` del modal de información de tareas.
3. **Conversión de Viewport (dvh a svh):** Sustituir todos los usos de unidades de viewport dinámico (`dvh` o `h-dvh`) por unidades de viewport estático/pequeño (`svh` o `h-svh`) a lo largo del codebase para estabilizar la interfaz en navegadores móviles.
4. **Optimización del Panel de Filtros (360px):** Asegurar que el panel flotante `#task-options` sea completamente visible y funcional en dispositivos con pantallas a partir de 360px de ancho, reduciendo paddings internos y usando grid/flex fluidos.
5. **Solución a Transparencia en Dropdowns:** Corregir el fondo transparente en los dropdowns nativos estilizados con `appearance: base-select` (`&::picker(select)`) garantizando un color sólido y opaco acorde al tema (claro/oscuro).

---

## 🔍 Análisis de Problemas Técnicos

### 1. El Desbordamiento de `#task-info`
* **Causa:** El diálogo `<dialog id="task-info">` tiene la clase fija `min-w-md` en `HomeView.html`, `AdminView.html` y `UserInfoView.html`.
* **Impacto:** En Tailwind, `min-w-md` obliga al modal a tener un ancho mínimo de `28rem` (448px). Si un smartphone de pantalla estrecha tiene un ancho de viewport menor (ej: iPhone SE a 375px), el diálogo se corta horizontalmente, provocando desbordamiento de pantalla.
* **Solución:** Reemplazar `min-w-md` por un ancho flexible en cascada, como `w-[90%] max-w-md sm:w-full`. Esto permite que el modal tome un ancho máximo seguro del 90% en móviles y se adapte como un cuadro de `28rem` (448px) de ancho en escritorio de forma impecable y centrada.

### 2. El comportamiento de la etiqueta `<pre id="task-info-desc">`
* **Causa:** El elemento `<pre>` que contiene la descripción del task usa la clase `max-w-125` (500px).
* **Impacto:** Si la descripción contiene una URL larga o texto continuo sin espacios, puede empujar el ancho horizontal de la caja superando los límites fluidos.
* **Solución:** Consolidar con clases de envoltura seguras e indestructibles: `w-full max-w-full whitespace-pre-wrap break-words overflow-x-auto`. Esto asegura que el texto se rompa por palabras cuando sea necesario y habilita un scroll x de emergencia para líneas excepcionalmente indomables, manteniendo el modal en su sitio.

### 3. Modificadores de Altura de Pantalla (`dvh` -> `svh`)
* **Causa:** Varias páginas (Login, Register, Forgot Password, Admin sections) usan `h-dvh` o `max-h-[calc(100dvh-...)]`.
* **Impacto:** En dispositivos móviles reales, a medida que el usuario hace scroll, la barra de direcciones del navegador aparece o desaparece, recalculando constantemente el valor de `dvh` de forma asíncrona. Esto produce un desagradable efecto de "parpadeo" o re-escala de los layouts del login y los contenedores de administración.
* **Solución:** Migrar a `svh` (Small Viewport Height), que toma de base el viewport con la barra de direcciones desplegada, ofreciendo una altura garantizada e inmune a las mutaciones de scroll.

### 4. Soporte para pantallas de 360px en Panel de Filtros
* **Causa:** En móviles, `#task-options[data-active="true"]` tiene padding y flex que pueden resultar ajustados en pantallas de 360px o inferiores.
* **Solución:** Ajustar el CSS en `style.css` y las clases de Tailwind en `HomeView.html` para reducir los paddings internos a `px-2 py-1.25` en pantallas ultra pequeñas y aplicar un tamaño de texto refinado de `text-[12px]` escalable a `xs:text-[13px] sm:text-sm` para garantizar holgura completa.

### 5. Dropdown de Categorías Transparente
* **Causa:** En [style.css](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/style.css), el selector del pseudo-elemento de control nativo `&::picker(select)` tiene asignada la propiedad `bg-transparent`.
* **Solución:** Cambiar `@apply rounded-xl p-0 border border-gray-200 dark:border-slate-700 shadow-lg bg-transparent overflow-hidden;` a `@apply rounded-xl p-0 border border-gray-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 overflow-hidden;`. Esto garantiza de manera nativa e indestructible que el fondo sea sólido y opaco en ambos temas visuales.

---

## 🛠️ Propuesta de Cambios y Plan de Acción

### Componente 1: Modales y Diálogos
Ajustar los modales `#task-info` en las tres vistas principales para que sean 100% responsivos y no provoquen desbordamiento.

#### [MODIFY] [HomeView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/HomeView.html)
* Ajustar `<dialog id="task-info">`: cambiar clase `min-w-md` por `w-[90%] max-w-md sm:w-full`.
* Ajustar `<pre id="task-info-desc">`: asegurar las clases `w-full max-w-full whitespace-pre-wrap break-words overflow-x-auto`.
* Optimizar selectores dentro del panel de filtros `#task-options`:
  * Reducir clases de padding y fuente: cambiar `px-2.5 sm:px-5 text-[13px] sm:text-sm` a `px-2 xs:px-3 sm:px-5 text-[12px] xs:text-[13px] sm:text-sm`.

#### [MODIFY] [AdminView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/AdminView.html)
* Realizar los mismos ajustes en `<dialog id="task-info">` y `<pre id="task-info-desc">`.
* Sustituir las alturas máximas de secciones de `100dvh` a `100svh`:
  * `#users-section`: `max-h-[calc(100dvh-7.5rem)]` -> `max-h-[calc(100svh-7.5rem)]`
  * `#categories-section`: `max-h-[calc(100dvh-9.5rem)]` -> `max-h-[calc(100svh-9.5rem)]`
  * `#tasks-section`: `max-h-[calc(100dvh-7.5rem)]` -> `max-h-[calc(100svh-7.5rem)]`

#### [MODIFY] [UserInfoView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/UserInfoView.html)
* Realizar los mismos ajustes en `<dialog id="task-info">` y `<pre id="task-info-desc">` del modal de información.

---

### Componente 2: Estilos CSS y Solución a Dropdown Transparente

#### [MODIFY] [style.css](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/style.css)
* Cambiar el fondo en `.base-select &::picker(select)` de `bg-transparent` a `bg-white dark:bg-slate-800` (Línea 138).
* Ajustar padding del panel `#task-options` activo en móvil:
  * Cambiar padding en `@media (max-width: 640px)` de `0.625rem 0.75rem` a `0.5rem 0.5rem` para dar el máximo espacio útil lateral a pantallas de 360px.
  * Cambiar el gap en `.filters-content` de `0.5rem` a `0.375rem` en móviles.

---

### Componente 3: Migración de Unidades de Viewport (`dvh` -> `svh`)
Reemplazar sistemáticamente todas las referencias a `dvh` por `svh` en las plantillas y el código TypeScript.

#### [MODIFY] [ForgotPasswordView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/ForgotPasswordView.html)
* Cambiar todas las clases `h-dvh` por `h-svh` en la imagen de fondo y el contenedor.

#### [MODIFY] [LoginView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/LoginView.html)
* Cambiar las referencias a `h-dvh` por `h-svh`.

#### [MODIFY] [RegisterView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/RegisterView.html)
* Cambiar `h-dvh` por `h-svh` en el div contenedor e imagen.

#### [MODIFY] [main.ts](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/main.ts)
* Sustituir las cadenas HTML dinámicas de Login y Registro que inyectan wrappers con clases `h-dvh` por `h-svh`.

#### [MODIFY] [ForgotPasswordView.ts](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/ForgotPasswordView.ts)
* Modificar la inyección de la clase `h-dvh` en la plantilla de vista de recuperación de contraseña a `h-svh`.

---

## 🧪 Plan de Verificación

### Pruebas Visuales Manuales
1. **Responsividad de Modales en Móviles:**
   * Utilizar las DevTools del navegador para emular resoluciones de pantalla estrechas (320px y 375px) y abrir el diálogo de información de tarea.
   * Verificar que el modal se muestre centrado con un margen lateral consistente (gracias a `w-[90%]`) y que no se corte por el borde derecho.
2. **Prueba de Wrap de Texto:**
   * Crear o modificar una tarea añadiéndole una URL súper larga sin espacios en la descripción.
   * Abrir el modal `#task-info` y validar que el texto se parta correctamente en múltiples renglones (`break-words`) sin estirar la caja.
3. **Prueba de Altura de Viewport en Móviles:**
   * Cargar el Login y Registro en el simulador móvil y comprobar la estabilidad visual con unidades `svh`.
4. **Verificación de Filtros a 360px:**
   * Emular una pantalla de 360px exactos y activar el panel flotante de filtros.
   * Comprobar que no hay enconamiento de los inputs ni desbordamiento lateral, y que todo el panel se ve 100% centrado y legible.
5. **Verificación de Opacidad en Dropdowns de Selección:**
   * Desplegar los filtros de categoría, completado y ordenación.
   * Certificar que los fondos son completamente opacos e inmunes a verse transparentes, tanto en tema claro como oscuro.

### Pruebas de Compilación y Calidad
1. **Compilación de TypeScript:** Ejecutar `npx tsc --noEmit`.
2. **Build de producción:** Ejecutar `npm run build` para asegurar la salida limpia del bundler.
