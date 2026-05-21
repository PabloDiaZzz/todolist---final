# Plan de Refinamiento del Botón de Filtro de Tareas Prioritarias

Este plan detalla la reestructuración y el diseño visual del botón de filtrado de tareas prioritarias (`#important-filter-btn`) en la barra de filtros de la vista principal (`HomeView`). El objetivo es eliminar el texto dinámico ("Todas" / "Importantes") que deforma y desplaza los selectores adyacentes al activarse, sustituyéndolo por un diseño de botón cuadrado compacto y puramente iconográfico de nivel premium.

---

## 🏗️ Resumen de Objetivos

1. **Eliminar Texto del Botón:** Quitar el elemento `<span>` interno del botón en `HomeView.html`.
2. **Asegurar la Accesibilidad:** Añadir atributos `title="Filtrar por tareas importantes"` y `aria-label="Filtrar por tareas importantes"` para mantener una excelente UX y accesibilidad (lectores de pantalla).
3. **Remover Lógica TypeScript Innecesaria:** Eliminar las líneas en `HomeView.ts` que buscan y modifican `labelSpan.textContent` al alternar el estado del filtro.
4. **Diseño de Botón Cuadrado e Inmóvil:** Actualizar `style.css` para forzar que el botón sea un cuadrado perfecto (`aspect-ratio: 1/1`), coincidiendo exactamente con la altura de los selectores (`38px` / `2.375rem`), y fijando `flex: none` para que nunca se estire ni reduzca de tamaño, permitiendo a los selectores ocupar todo el espacio disponible de forma simétrica.
5. **Verificación Visual:** Capturar una imagen del navegador en estado expandido para comprobar la estabilidad visual.

---

## 🛠️ Proposed Changes

### Componente: Vista Principal (HomeView)

---

#### [MODIFY] [HomeView.html](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/html/HomeView.html)
- Eliminar la etiqueta `<span>Todas</span>` de la línea 169.
- Agregar atributos de accesibilidad `title` y `aria-label` al botón `#important-filter-btn`.

```html
<button type="button" id="important-filter-btn" data-active="false"
    class="bg-element-primary px-4 py-2 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-indigo-700 transition-all cursor-pointer select-none"
    title="Filtrar por tareas importantes"
    aria-label="Filtrar por tareas importantes">
    <svg class="size-4 filter-star-icon transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z"/>
    </svg>
</button>
```

---

#### [MODIFY] [HomeView.ts](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/views/HomeView.ts)
- Eliminar la búsqueda y la asignación de contenido de texto del span (`labelSpan`).
- Mantener únicamente la lógica de cambio de clases del icono estrella (`.filter-star-icon`) y del estado de filtrado en el renderizado.

```typescript
    const importantFilterBtn = root.getElementById('important-filter-btn') as HTMLButtonElement;
    importantFilterBtn?.addEventListener('click', () => {
      const isActive = importantFilterBtn.getAttribute('data-active') === 'true';
      const nextActive = !isActive;
      importantFilterBtn.setAttribute('data-active', String(nextActive));
      
      const starIcon = importantFilterBtn.querySelector('.filter-star-icon');
      
      if (nextActive) {
        if (starIcon) {
          starIcon.classList.add('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
          starIcon.classList.remove('fill-none');
        }
      } else {
        if (starIcon) {
          starIcon.classList.remove('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
          starIcon.classList.add('fill-none');
        }
      }
      
      if ((document as any).startViewTransition) {
        (document as any).startViewTransition(() => this.renderTasks());
      } else {
        this.renderTasks();
      }
    });
```

---

#### [MODIFY] [style.css](file:///c:/Users/pablo/OneDrive%20-%20Consejer%C3%ADa%20de%20Educaci%C3%B3n/Clase/Proyecto/todolist/frontend/src/style.css)
- Añadir estilos específicos para `#important-filter-btn` para convertirlo en un contenedor no deformable y de tamaño fijo (38px x 38px) que aloje el icono centrado.

```css
/* Botón de filtrado por importantes cuadrado y no deformable */
#important-filter-btn {
  flex: 0 0 auto !important;
  width: 2.375rem !important; /* 38px, exactamente el alto de los selectores */
  height: 2.375rem !important; /* 38px */
  padding: 0 !important; /* Centrado absoluto sin márgenes internos */
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}
```

---

## 🎯 Plan de Verificación (QA)

### Pruebas de Compilación y Calidad
- Ejecutar `npx tsc --noEmit` en el frontend para asegurar la ausencia de errores de tipos.
- Ejecutar el formateador/linter si corresponde.

### Verificación Visual en Navegador
1. Iniciar el servidor local (`npm run dev`).
2. Abrir la aplicación, iniciar sesión e ir a la vista principal.
3. Desplegar el menú de filtros haciendo clic en el botón de la esquina inferior derecha.
4. Comprobar que:
   - El botón de importantes es un cuadrado perfecto a la derecha de los 3 selects.
   - Al hacer clic en el botón, la estrella cambia a dorada de forma fluida.
   - **Los selectores no se mueven ni cambian de tamaño en lo más mínimo al alternar el botón.**
   - El layout de los 3 selectores de filtros es perfectamente simétrico y estable.
5. Tomar una captura de pantalla del navegador con el menú de filtros abierto en estado activo e inactivo.

### Auditoría Maestra del Proyecto
- Ejecutar el checklist maestro de calidad:
  `python .agent/scripts/checklist.py .`
