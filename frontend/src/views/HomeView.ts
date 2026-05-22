import html from './html/HomeView.html?raw'
import styles from '../style.css?inline'
import type { Category, TaskRequestDTO, TaskResponseDTO } from '../types/api-types'
import '../components/TaskItem'
import '../components/StatusInfo'
import '../components/AppHeader'
import { Datepicker } from 'flowbite'
import type { TaskItem } from '../components/TaskItem'
import { syncThemeWithObserver } from '../utils/theme'
import { prefetchCache, updateCachedData } from '../utils/store'
import { isEqual } from 'lodash'
import { authService } from '../services/AuthService'

declare module 'flowbite' {
  interface DatepickerOptions {
    container?: HTMLElement | string
  }
}

function sanitizeTask(task: TaskResponseDTO & { isSyncing?: boolean }) {
  if (!task) return task;
  const { lastEdit, isSyncing, ...rest } = task;
  return {
    ...rest,
    categories: rest.categories?.map(({ id, title }) => ({ id, title })).sort((a, b) => (a.id ?? 0) - (b.id ?? 0)) ?? [],
    tags: rest.tags?.map(({ name }) => ({ name })).sort((a, b) => (a.name || '').localeCompare(b.name || '')) ?? []
  };
}

function areTaskListsEqual(a: TaskResponseDTO[], b: TaskResponseDTO[]): boolean {
  if (a.length !== b.length) return false;
  return isEqual(a.map(sanitizeTask), b.map(sanitizeTask));
}

export class HomeView extends HTMLElement {
  private tasks: TaskResponseDTO[] = [];
  private cats: Category[] = [];
  private themeObserver: MutationObserver | null = null;
  private _globalClickListener: ((e: MouseEvent) => void) | null = null;

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(styles)
    this.shadowRoot!.adoptedStyleSheets = [sheet]

    this.shadowRoot!.innerHTML = html

    const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper')

    this.themeObserver = syncThemeWithObserver(themeWrapper);

    this.setupEvents()
  }

  disconnectedCallback() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
    if (this._globalClickListener) {
      document.removeEventListener('click', this._globalClickListener);
    }
  }
  private async setupEvents() {
    const root = this.shadowRoot!

    const taskFormHeader = root.getElementById('task-form-header')! as HTMLDivElement
    const taskFormCollapseContainer = root.getElementById('task-form-collapse-container')! as HTMLDivElement
    const toggleBtnIcon = root.getElementById('toggle-task-form-icon')! as HTMLElement
    const addTaskIcon = root.getElementById('add-task-icon')! as HTMLElement
    const formSection = taskFormHeader.closest('section')! as HTMLElement

    const updateCollapseState = (collapsed: boolean, animate = true) => {
      if (!animate) {
        taskFormCollapseContainer.style.transition = 'none';
        formSection.style.transition = 'none';
        taskFormHeader.style.transition = 'none';
        addTaskIcon.style.transition = 'none';
      } else {
        taskFormCollapseContainer.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
        formSection.style.transition = 'padding 0.3s ease-in-out';
        taskFormHeader.style.transition = 'margin-bottom 0.3s ease-in-out';
        addTaskIcon.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out, width 0.3s ease-in-out, margin-right 0.3s ease-in-out';
      }

      if (collapsed) {
        taskFormCollapseContainer.style.overflow = 'hidden';
        taskFormCollapseContainer.style.maxHeight = '0px';
        taskFormCollapseContainer.style.opacity = '0';
        taskFormCollapseContainer.style.pointerEvents = 'none';

        toggleBtnIcon.style.transform = 'rotate(-180deg)';

        addTaskIcon.style.opacity = '1';
        addTaskIcon.style.transform = 'scale(1)';
        addTaskIcon.style.width = '24px';
        addTaskIcon.style.marginRight = '8px';

        taskFormHeader.classList.remove('mb-4');
        taskFormHeader.classList.add('mb-0');

        formSection.classList.remove('p-6');
        formSection.classList.add('p-4');
      } else {
        taskFormCollapseContainer.style.overflow = 'hidden';
        taskFormCollapseContainer.style.maxHeight = `${taskFormCollapseContainer.scrollHeight}px`;
        taskFormCollapseContainer.style.opacity = '1';
        taskFormCollapseContainer.style.pointerEvents = 'auto';

        toggleBtnIcon.style.transform = 'rotate(0deg)';

        addTaskIcon.style.opacity = '0';
        addTaskIcon.style.transform = 'scale(0)';
        addTaskIcon.style.width = '0px';
        addTaskIcon.style.marginRight = '0px';

        taskFormHeader.classList.remove('mb-0');
        taskFormHeader.classList.add('mb-4');

        formSection.classList.remove('p-4');
        formSection.classList.add('p-6');

        if (animate) {
          const onTransitionEnd = (e: TransitionEvent) => {
            if (e.propertyName === 'max-height' && !isCollapsed) {
              taskFormCollapseContainer.style.overflow = 'visible';
              taskFormCollapseContainer.style.maxHeight = 'none';
              taskFormCollapseContainer.removeEventListener('transitionend', onTransitionEnd);
            }
          };
          taskFormCollapseContainer.addEventListener('transitionend', onTransitionEnd);
        } else {
          taskFormCollapseContainer.style.overflow = 'visible';
          taskFormCollapseContainer.style.maxHeight = 'none';
        }
      }

      if (!animate) {
        taskFormCollapseContainer.offsetHeight;
        taskFormCollapseContainer.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out';
        formSection.style.transition = 'padding 0.3s ease-in-out';
        taskFormHeader.style.transition = 'margin-bottom 0.3s ease-in-out';
        addTaskIcon.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out, width 0.3s ease-in-out, margin-right 0.3s ease-in-out';
      }
    };

    let isCollapsed = localStorage.getItem('task-form-collapsed') === 'true';
    updateCollapseState(isCollapsed, false);

    taskFormHeader.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        taskFormCollapseContainer.style.maxHeight = `${taskFormCollapseContainer.scrollHeight}px`;
        taskFormCollapseContainer.offsetHeight;
      }
      updateCollapseState(isCollapsed, true);
      localStorage.setItem('task-form-collapsed', String(isCollapsed));
    });

    const closeInfoTask = root.getElementById(
      'close-task-info'
    ) as HTMLButtonElement

    const catDropdownContainer = root.getElementById('category-dropdown-container')! as HTMLDivElement;
    const dateInput = root.getElementById('date-input') as HTMLInputElement
    const timeInput = root.getElementById('time-input') as HTMLInputElement


    const createImportantBtn = root.getElementById('create-important-btn') as HTMLButtonElement
    const createImportantHidden = root.getElementById('create-important-hidden') as HTMLInputElement
    createImportantBtn?.addEventListener('click', () => {
      const isImportant = createImportantHidden.value === 'true'
      const nextImportant = !isImportant
      createImportantHidden.value = String(nextImportant)
      const starIcon = createImportantBtn.querySelector('.star-icon')
      if (starIcon) {
        starIcon.classList.remove('animate-star-pop', 'animate-star-shrink')
        void (starIcon as HTMLElement).offsetWidth

        if (nextImportant) {
          starIcon.classList.add('animate-star-pop', 'text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]')
          starIcon.classList.remove('text-gray-400', 'dark:text-slate-500', 'fill-none')
        } else {
          starIcon.classList.add('animate-star-shrink')
          starIcon.classList.remove('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]')
          starIcon.classList.add('text-gray-400', 'dark:text-slate-500', 'fill-none')
        }
      }
    })


    root.addEventListener('task-priority-changed', () => {
      if ((document as any).startViewTransition) {
        (document as any).startViewTransition(() => this.renderTasks());
      } else {
        this.renderTasks();
      }
    });

    const dp = new Datepicker(dateInput, {
      autohide: true,
      format: 'dd/mm/yyyy',
      orientation: 'bottom',
      language: 'es',
      minDate: Date.now().toString(),
      buttons: true,
      autoSelectToday: 1,
      container: root.getElementById('theme-wrapper') as HTMLElement
    })

    root.addEventListener('task-info', ((e: CustomEvent<TaskResponseDTO>) => {
      this.showInfoTask(e.detail)
    }) as EventListener)

    root.addEventListener('task-edit', ((e: CustomEvent<{ taskElement: TaskItem, task: TaskResponseDTO }>) => {
      this.showEditTask(e.detail.taskElement, e.detail.task)
    }) as EventListener)

    closeInfoTask.addEventListener('click', () =>
      (root.getElementById('task-info') as HTMLDialogElement).close()
    )

    root.addEventListener('task-updated', () => this.loadTasks())

    const taskOptions = root.getElementById('task-options')!
    taskOptions.addEventListener('click', () => {
      taskOptions.setAttribute('data-active', 'true')
    })

    const filterSelects = taskOptions.querySelectorAll('select');
    filterSelects.forEach(select => {
      select.addEventListener('change', () => this.renderTasks());
    });

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

    root.addEventListener('click', e => {
      const target = e.target as Node
      if (
        target !== taskOptions &&
        !taskOptions.contains(target) &&
        taskOptions.dataset.active === 'true'
      ) {
        taskOptions.setAttribute('data-active', 'false')
      }
    })

    this._globalClickListener = (e: MouseEvent) => {
      const path = e.composedPath()
      const pickerEl = document.querySelector('.datepicker')
      if (!path.includes(dateInput) && pickerEl && !path.includes(pickerEl)) {
        dp.hide()
      }
    }
    document.addEventListener('click', this._globalClickListener)

    root.addEventListener('click', e => {
      const allCategoryMenus = root.querySelectorAll('.category-dropdown-menu:not(.hidden)');
      allCategoryMenus.forEach(menu => {
        const container = menu.parentElement!;
        const btn = container.querySelector('.category-dropdown-btn')!;
        const icon = btn.querySelector('svg')!;

        if (!btn.contains(e.target as Node) && !menu.contains(e.target as Node)) {
          menu.classList.add('hidden');
          if (icon) icon.classList.remove('rotate-180');
        }
      });
    })

    const taskForm = root.getElementById('task-form') as HTMLFormElement
    taskForm?.addEventListener('submit', async e => {
      e.preventDefault()
      const tasksContainer = root.getElementById('tasks-container') as HTMLDivElement
      const formData: FormData = new FormData(taskForm)
      const dateStr = formData.get('date') as string
      const timeStr = formData.get('time') as string

      let finalDeadline: string | undefined = undefined

      if (dateStr && timeStr) {
        const [day, month, year] = dateStr.split('/')
        finalDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(
          2,
          '0'
        )}T${timeStr}:00`
      }

      const checkedBoxes = catDropdownContainer.querySelectorAll('.category-list input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
      const categoryIds = Array.from(checkedBoxes).map(cb => Number(cb.value));

      const taskRequest: TaskRequestDTO = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        categoryIds: categoryIds,
        tagsInput: formData.get('tagsInput') as string,
        deadline: finalDeadline,
        important: createImportantHidden.value === 'true'
      }

      const fakeId = Date.now();
      const localTask = {
        id: fakeId,
        title: taskRequest.title,
        description: taskRequest.description,
        deadline: taskRequest.deadline,
        completed: false,
        categories: this.cats.filter(c => taskRequest.categoryIds?.includes(c.id!)),
        tags: taskRequest.tagsInput ? taskRequest.tagsInput.split(',').map(name => ({ name: name.trim() })) : [],
        createdAt: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
        important: taskRequest.important,
        isSyncing: true
      } as TaskResponseDTO & { isSyncing?: boolean };

      this.tasks = updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks => {
        return [...oldTasks, localTask];
      });
      this.renderTasks();
      taskForm.reset();
      this.loadCatsDropdown('category-dropdown-container', []);
      timeInput.value = '00:00';
      createImportantHidden.value = 'false';
      const createStarIcon = createImportantBtn?.querySelector('.star-icon');
      if (createStarIcon) {
        createStarIcon.classList.remove('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
        createStarIcon.classList.add('text-gray-400', 'dark:text-slate-500', 'fill-none');
      }

      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: authService.getAuthHeaders(),
          body: JSON.stringify(taskRequest)
        });

        if (!response.ok) throw new Error('Error en el servidor');

        const realTask: TaskResponseDTO = await response.json();
        const taskIndex = this.tasks.findIndex(t => t.id === fakeId);

        if (taskIndex !== -1) {
          this.tasks[taskIndex] = realTask;

          prefetchCache.set('/api/tasks', this.tasks);

          const taskElements = tasksContainer.querySelectorAll('task-item') as NodeListOf<any>;
          taskElements.forEach(el => {
            if (el.task?.id === fakeId) {
              el.task = realTask;
              el.syncing = false;
            }
          });
        }

      } catch (err) {
        console.error('Error al guardar la tarea en el servidor:', err);
        this.tasks = updateCachedData<TaskResponseDTO>('/api/tasks', old => old.filter(t => t.id !== fakeId));
        const taskElements = tasksContainer.querySelectorAll('task-item') as NodeListOf<any>;
        taskElements.forEach(el => {
          if (el.task?.id === fakeId) {
            el.remove();
          }
        });
        alert("Error de conexión: No se pudo guardar la tarea.");
      }
    })
    this.loadCats();
    this.loadTasks();
  }

  private async loadCats() {
    if (prefetchCache.has('/api/cats')) {
      this.cats = prefetchCache.get('/api/cats');
      this.loadCatsDropdown('category-dropdown-container');

      this.updateCategoryFilter();
    }

    try {
      const response = await fetch('/api/cats', { headers: authService.getAuthHeaders() });
      if (!response.ok) throw new Error('Error al obtener categorías');

      const freshCats: Category[] = (await response.json()).sort((a: Category, b: Category) => a.title!.localeCompare(b.title!));

      if (!isEqual(this.cats, freshCats)) {
        this.cats = freshCats;
        prefetchCache.set('/api/cats', freshCats);
        this.loadCatsDropdown('category-dropdown-container');
        this.updateCategoryFilter();
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }

  private async loadTasks() {
    if (prefetchCache.has('/api/tasks')) {
      this.tasks = prefetchCache.get('/api/tasks');
      this.renderTasks();
    }

    try {
      const response = await fetch('/api/tasks', { headers: authService.getAuthHeaders() });
      if (!response.ok) throw new Error('Error al obtener tareas');

      const freshTasks: TaskResponseDTO[] = await response.json();
      freshTasks.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

      if (!areTaskListsEqual(this.tasks, freshTasks)) {
        this.tasks = freshTasks;
        prefetchCache.set('/api/tasks', freshTasks);
        this.renderTasks();
      } else {
        this.tasks = freshTasks;
        prefetchCache.set('/api/tasks', freshTasks);
      }

    } catch (err) {
      console.error('Error cargando tareas:', err);
    }
  }

  private renderTasks() {
    const container = this.shadowRoot!.getElementById('tasks-container');
    if (!container) return;

    container.innerHTML = '';

    const noTasks = this.shadowRoot!.getElementById('no-tasks');
    const taskOptions = this.shadowRoot!.getElementById('task-options');

    const tasksToRender = this.getProcessedTasks();

    if (tasksToRender.length === 0) {
      noTasks?.classList.replace('hidden', 'flex');
    } else {
      noTasks?.classList.replace('flex', 'hidden');
    }

    if (taskOptions) {
      if (this.tasks.length < 2) {
        taskOptions.classList.add('opacity-0', 'pointer-events-none');
        taskOptions.classList.remove('opacity-100');
      } else {
        taskOptions.classList.remove('opacity-0', 'pointer-events-none');
        taskOptions.classList.add('opacity-100');
      }
    }

    tasksToRender.forEach((taskData: TaskResponseDTO & { isSyncing?: boolean }) => {
      const taskElement = document.createElement('task-item') as TaskItem;

      taskElement.task = taskData;
      if (taskData.isSyncing) {
        taskElement.syncing = true;
      }

      container.appendChild(taskElement);
    });
  }

  private async showInfoTask(task: TaskResponseDTO) {
    const taskElement = document.createElement('task-item') as TaskItem;
    taskElement.task = task
    const dialog = this.shadowRoot!.getElementById(
      'task-info'
    ) as HTMLDialogElement
    const title = this.shadowRoot!.getElementById(
      'task-info-title'
    ) as HTMLHeadingElement
    const desc = this.shadowRoot!.getElementById(
      'task-info-desc'
    ) as HTMLParagraphElement
    const deadline = this.shadowRoot!.getElementById(
      'task-info-deadline'
    ) as HTMLParagraphElement
    const categories = this.shadowRoot!.getElementById(
      'task-info-categories'
    ) as HTMLDivElement
    const tags = this.shadowRoot!.getElementById(
      'task-info-tags'
    ) as HTMLDivElement
    const completed = this.shadowRoot!.getElementById(
      'task-info-status'
    ) as HTMLElement
    const createdAt = this.shadowRoot!.getElementById(
      'task-info-created-at'
    ) as HTMLParagraphElement
    const updatedAt = this.shadowRoot!.getElementById(
      'task-info-updated-at'
    ) as HTMLParagraphElement
    const dateConfig: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }

    Array.from([createdAt, updatedAt, deadline]).forEach(el => {
      el.parentElement!.onclick = async () => {
        const textToCopy = el.textContent?.trim()

        if (
          !textToCopy ||
          textToCopy === 'No establecida' ||
          textToCopy === '¡Copiado!'
        )
          return

        try {
          await navigator.clipboard.writeText(textToCopy)
          const originalText = el.textContent
          const originalLabel =
            el.parentElement!.style.getPropertyValue('--label')
          el.textContent = '¡Copiado!'
          el.parentElement!.style.setProperty('--label', "'¡Copiado!'")

          setTimeout(() => {
            el.textContent = originalText

            if (originalLabel) {
              el.parentElement!.style.setProperty('--label', originalLabel)
            } else {
              el.parentElement!.style.removeProperty('--label')
            }
          }, 500)
        } catch (err) {
          console.error('Error al copiar al portapapeles: ', err)
        }
      }
    })

    title.textContent = task.title ?? ''
    desc.textContent = task.description ?? ''
    deadline.textContent = task.deadline
      ? new Date(task.deadline).toLocaleString('es-ES', dateConfig)
      : 'No establecida'
    categories.innerHTML =
      taskElement.querySelector('.category-container')?.innerHTML ?? ''
    tags.innerHTML =
      taskElement.querySelector('.tags-container')?.innerHTML ?? ''
    let statusType = 'pendiente';
    if (task.completed) {
      statusType = 'completada'
    } else if (task.deadline && Date.now() > new Date(task.deadline).getTime()) {
      statusType = 'vencida'
    }
    completed.setAttribute('type', statusType)
    createdAt.textContent = task.createdAt
      ? new Date(task.createdAt).toLocaleString('es-ES', dateConfig)
      : ''
    updatedAt.textContent = task.lastEdit
      ? new Date(task.lastEdit).toLocaleString('es-ES', dateConfig)
      : ''

    const importantBadge = this.shadowRoot!.getElementById('task-info-important-badge')
    if (importantBadge) {
      if (task.important) {
        importantBadge.classList.remove('hidden')
        importantBadge.classList.add('flex')
      } else {
        importantBadge.classList.remove('flex')
        importantBadge.classList.add('hidden')
      }
    }

    dialog.showModal()
  }

  private showEditTask(_taskElement: TaskItem, task: TaskResponseDTO) {
    const dialog = this.shadowRoot!.getElementById('task-edit') as HTMLDialogElement
    const modalBox = this.shadowRoot!.getElementById('edit-modal-box') as HTMLElement;
    const form = this.shadowRoot!.getElementById('edit-form') as HTMLFormElement;
    const title = this.shadowRoot!.getElementById('edit-title') as HTMLInputElement
    const desc = this.shadowRoot!.getElementById('edit-desc') as HTMLTextAreaElement
    const dateDeadline = this.shadowRoot!.getElementById('date-deadline-edit') as HTMLInputElement
    const timeDeadline = this.shadowRoot!.getElementById('time-deadline-edit') as HTMLInputElement
    const tags = this.shadowRoot!.getElementById('edit-tags') as HTMLInputElement
    const cancel = this.shadowRoot!.getElementById('cancel-edit-task') as HTMLButtonElement

    const editImportantBtn = this.shadowRoot!.getElementById('edit-important-btn') as HTMLButtonElement
    const editImportantHidden = this.shadowRoot!.getElementById('edit-important-hidden') as HTMLInputElement
    const editStarIcon = editImportantBtn?.querySelector('.star-icon')
    const dateConfig: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
    const dp = new Datepicker(dateDeadline, {
      autohide: true,
      format: 'dd/mm/yyyy',
      orientation: 'top',
      language: 'es',
      minDate: Date.now().toString(),
      buttons: true,
      autoSelectToday: 1,
      container: modalBox
    })

    title.value = task.title ?? ''
    desc.value = task.description ?? ''
    if (task.deadline) {
      const d = new Date(task.deadline);
      dateDeadline.value = d.toLocaleDateString('es-ES', dateConfig);
      dp.setDate(d);
      timeDeadline.value = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      dateDeadline.value = '';
      timeDeadline.value = '00:00';
    }
    this.loadCatsDropdown('category-edit-dropdown-container', task.categories ?? []);
    tags.value = task.tags?.map(t => t.name).join(', ') || '';

    const initialImportant = !!task.important;
    editImportantHidden.value = String(initialImportant);
    if (editStarIcon) {
      if (initialImportant) {
        editStarIcon.classList.add('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
        editStarIcon.classList.remove('text-gray-400', 'dark:text-slate-500', 'fill-none');
      } else {
        editStarIcon.classList.remove('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
        editStarIcon.classList.add('text-gray-400', 'dark:text-slate-500', 'fill-none');
      }
    }

    editImportantBtn.onclick = () => {
      const isImportant = editImportantHidden.value === 'true';
      const nextImportant = !isImportant;
      editImportantHidden.value = String(nextImportant);
      if (editStarIcon) {
        editStarIcon.classList.remove('animate-star-pop', 'animate-star-shrink');
        void (editStarIcon as HTMLElement).offsetWidth;

        if (nextImportant) {
          editStarIcon.classList.add('animate-star-pop', 'text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
          editStarIcon.classList.remove('text-gray-400', 'dark:text-slate-500', 'fill-none');
        } else {
          editStarIcon.classList.add('animate-star-shrink');
          editStarIcon.classList.remove('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
          editStarIcon.classList.add('text-gray-400', 'dark:text-slate-500', 'fill-none');
        }
      }
    };

    cancel.onclick = () => {
      dp.destroy()
      dialog.close()
      document.body.classList.remove('overflow-hidden');
    }
    modalBox.onclick = (e) => {
      if (dateDeadline.contains(e.target as Node)) return;
      dp.hide()
    }
    dialog.onclick = (e) => {
      if (e.target === dialog) {
        dp.destroy()
        dialog.close()
        document.body.classList.remove('overflow-hidden');
      }
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      let finalDeadline: string | undefined = undefined;

      if (dateDeadline.value && timeDeadline.value) {
        const [day, month, year] = dateDeadline.value.split('/');
        finalDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeDeadline.value}:00`;
      }
      const checkedBoxes = modalBox.querySelectorAll('.category-list input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
      const categoryIds = Array.from(checkedBoxes).map(cb => Number(cb.value));
      const taskSubmit: TaskRequestDTO = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        deadline: finalDeadline,
        categoryIds: categoryIds,
        tagsInput: formData.get('tagsInput') as string,
        important: editImportantHidden.value === 'true'
      };
      const originalTask = { ...task };

      const localTask: TaskResponseDTO = {
        ...task,
        title: taskSubmit.title,
        description: taskSubmit.description,
        deadline: taskSubmit.deadline,
        categories: this.cats.filter(c => taskSubmit.categoryIds?.includes(c.id!)),
        tags: taskSubmit.tagsInput ? taskSubmit.tagsInput.split(',').map(name => ({ name: name.trim() })) : [],
        important: taskSubmit.important,
        lastEdit: new Date().toISOString()
      };

      this.tasks = updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
        oldTasks.map(t => t.id === task.id ? localTask : t)
      );

      _taskElement.task = localTask;

      if ((document as any).startViewTransition) {
        (document as any).startViewTransition(() => this.renderTasks());
      } else {
        this.renderTasks();
      }

      dp.destroy();
      dialog.close();
      document.body.classList.remove('overflow-hidden');

      try {
        const response = await fetch('/api/tasks/' + task.id, {
          method: 'PUT',
          headers: authService.getAuthHeaders(),
          body: JSON.stringify(taskSubmit)
        });

        if (!response.ok) throw new Error('Error al editar la tarea');

        const realTask: TaskResponseDTO = await response.json();

        this.tasks = updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
          oldTasks.map(t => t.id === task.id ? realTask : t)
        );
        _taskElement.task = realTask;

        if ((document as any).startViewTransition) {
          (document as any).startViewTransition(() => this.renderTasks());
        } else {
          this.renderTasks();
        }

      } catch (err) {
        console.error('Error al editar la tarea:', err);

        this.tasks = updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
          oldTasks.map(t => t.id === task.id ? originalTask : t)
        );
        _taskElement.task = originalTask;

        if ((document as any).startViewTransition) {
          (document as any).startViewTransition(() => this.renderTasks());
        } else {
          this.renderTasks();
        }

        alert("Error de conexión: No se pudieron guardar los cambios.");
      }
    }
    dialog.show();
    document.body.classList.add('overflow-hidden');
  }

  private loadCatsDropdown(id: string, selectedCategories: Category[] = []) {
    const root = this.shadowRoot!
    const container = root.getElementById(id)! as HTMLDivElement
    const dropdownBtn = container.querySelector('.category-dropdown-btn') as HTMLButtonElement
    const dropdownMenu = container.querySelector('.category-dropdown-menu') as HTMLDivElement
    const dropdownLabel = container.querySelector('.category-dropdown-label') as HTMLSpanElement
    const searchInput = container.querySelector('.category-search') as HTMLInputElement
    const categoryList = container.querySelector('.category-list')! as HTMLDivElement
    const dropdownIcon = dropdownBtn.querySelector('svg')! as SVGElement

    const renderCategoryList = (searchTerm = '') => {
      categoryList.innerHTML = ''
      const filtered = this.cats.filter(c =>
        (c.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )

      filtered.forEach(cat => {
        if (cat.id === undefined) return
        const isSelected = selectedCategories.some(sc => sc.id === cat.id)

        const div = document.createElement('div')
        div.className = `flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg transition-colors ${isSelected
          ? 'bg-blue-50 dark:bg-indigo-900/30'
          : 'hover:bg-gray-100 dark:hover:bg-slate-700'
          }`

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.value = String(cat.id);
        checkbox.className =
          'w-4 h-4 text-blue-500 dark:text-indigo-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-indigo-600 cursor-pointer'
        checkbox.checked = isSelected

        const span = document.createElement('span')
        span.className = 'text-sm font-medium text-gray-700 dark:text-gray-200'
        span.textContent = cat.title ?? ''

        div.appendChild(checkbox)
        div.appendChild(span)

        div.onclick = e => {
          e.stopPropagation()
          if (e.target !== checkbox) checkbox.checked = !checkbox.checked

          if (checkbox.checked) {
            selectedCategories.push(cat)
          } else {
            selectedCategories = selectedCategories.filter(
              sc => sc.id !== cat.id
            )
          }
          updateUI()
        }

        categoryList.appendChild(div)
      })
    }

    dropdownBtn.onclick = (e) => {
      e.preventDefault();
      dropdownMenu.classList.toggle('hidden')
      dropdownIcon.classList.toggle('rotate-180')
      if (!dropdownMenu.classList.contains('hidden')) searchInput.focus()
    }

    searchInput.oninput = (e) => {
      renderCategoryList((e.target as HTMLInputElement).value)
    }

    const updateUI = () => {
      dropdownLabel.textContent = `Categorías: ${selectedCategories.length}`

      renderList(searchInput.value)
    }

    const renderList = renderCategoryList
    renderList();
    updateUI();
  }

  private updateCategoryFilter() {
    const root = this.shadowRoot!;

    const optionsContainer = root.getElementById('category-options-container') as HTMLDivElement;
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "- Categoria -";
    defaultOption.className = "bg-white text-gray-900 dark:bg-slate-800 dark:text-white";
    optionsContainer.appendChild(defaultOption);

    this.cats.forEach(cat => {
      const option = document.createElement('option');
      option.value = String(cat.id);
      option.textContent = cat.title ?? '';
      option.className = "bg-white text-gray-900 dark:bg-slate-800 dark:text-white";

      optionsContainer.appendChild(option);
    });
  }

  private getProcessedTasks(): TaskResponseDTO[] {
    const root = this.shadowRoot!;
    const taskOptions = root.getElementById('task-options');
    if (!taskOptions) return this.tasks;

    const selects = taskOptions.querySelectorAll('select');
    const categoryFilter = selects[0].value;
    const statusFilter = selects[1].value;
    const sortFilter = selects[2].value;

    let processed = [...this.tasks];

    if (statusFilter !== '') {
      const isComplete = statusFilter === 'true';
      processed = processed.filter(t => !!t.completed === isComplete);
    }

    if (categoryFilter !== '') {
      const catId = Number(categoryFilter);
      processed = processed.filter(t => t.categories?.some(c => c.id === catId));
    }

    const importantFilterBtn = root.getElementById('important-filter-btn') as HTMLButtonElement;
    if (importantFilterBtn && importantFilterBtn.getAttribute('data-active') === 'true') {
      processed = processed.filter(t => !!t.important);
    }

    processed.sort((a, b) => {

      if (sortFilter === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortFilter === 'description') {
        return (a.description || '').localeCompare(b.description || '');
      }
      if (sortFilter === 'category') {
        const catA = a.categories?.[0]?.title || 'z';
        const catB = b.categories?.[0]?.title || 'z';
        return catA.localeCompare(catB);
      }
      if (sortFilter === 'complete') {
        return (a.completed === b.completed) ? 0 : (a.completed ? 1 : -1);
      }
      if (sortFilter === 'priority') {
        const aImp = a.important ? 1 : 0;
        const bImp = b.important ? 1 : 0;
        return bImp - aImp;
      }
      if (sortFilter === 'deadline') {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : 0;
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1;
        if (timeB === 0) return -1;
        return timeA - timeB;
      }
      if (sortFilter === 'created') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // Las más nuevas primero
      }
      if (sortFilter === 'lastEdit') {
        const timeA = a.lastEdit ? new Date(a.lastEdit).getTime() : 0;
        const timeB = b.lastEdit ? new Date(b.lastEdit).getTime() : 0;
        return timeB - timeA;
      }

      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      const aImp = a.important ? 1 : 0;
      const bImp = b.important ? 1 : 0;
      if (aImp !== bImp) {
        return bImp - aImp;
      }

      return (b.id ?? 0) - (a.id ?? 0);
    });

    return processed;
  }
}
customElements.define('home-view', HomeView)
