import './style.css';
import 'flowbite';
import './views/LoginView';
import './views/HomeView';
import './views/RegisterView';
import './views/ForgotPasswordView';

const app = document.querySelector<HTMLDivElement>('#app')!;

async function router() {
  const path = window.location.pathname;

  app.innerHTML = `
    <div
      class="flex flex-col items-center justify-center h-screen bg-gray-200 dark:bg-slate-900 transition-colors">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 dark:border-indigo-400"></div>
      <h2 class="mt-6 text-xl font-bold text-gray-800 dark:text-white">Aplicación ToDo List</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Conectando con el servidor...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/user/me');
    const isLoggedIn = res.ok;

    if (!isLoggedIn && path !== '/register' && path !== '/forgot-password' && path !== '/login' && path !== '/') {
      window.history.pushState({}, '', '/login?required');
      app.innerHTML = '<login-view></login-view>';
      return;
    }

    if (isLoggedIn && (path === '/login' || path === '/' || path === '/register' || path === '/forgot-password')) {
      window.history.pushState({}, '', '/home');
      app.innerHTML = '<home-view></home-view>';
      return;
    }

    switch (path) {
      case '/login':
        app.innerHTML = '<login-view></login-view>';
        break;
      case '/home':
        app.innerHTML = '<home-view></home-view>';
        break;
      case '/register':
        app.innerHTML = '<register-view></register-view>';
        break;
      case '/forgot-password':
        app.innerHTML = '<forgot-password-view></forgot-password-view>';
        break;
      case '/admin':
        app.innerHTML = '<admin-view></admin-view>';
        break;
      default:
        app.innerHTML = isLoggedIn ? '<home-view></home-view>' : '<login-view></login-view>';
    }
  } catch (error) {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center h-screen bg-gray-200 dark:bg-slate-900 transition-colors">
          <svg class="size-16 text-red-500 mb-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">Error de conexión</h2>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No se pudo conectar con el servidor.</p>
          <button onclick="window.location.reload()" class="mt-6 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Reintentar</button>
      </div>
    `;
  }
}

window.addEventListener('popstate', router);

(window as any).navigate = (path: string) => {
  window.history.pushState({}, '', path);
  router();
};

function initDarkMode() {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  applyTheme(darkModeMediaQuery.matches);

  darkModeMediaQuery.addEventListener('change', (e) => {
    applyTheme(e.matches);
  });
}

router();
initDarkMode();
