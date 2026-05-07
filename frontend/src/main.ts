import './style.css';
import 'flowbite';
import './views/LoginView';
import './views/HomeView';
import './views/RegisterView';
import './views/ForgotPasswordView';
import './views/AdminView';
import './views/UserInfoView';
import { authService } from './services/AuthService';

const app = document.querySelector<HTMLDivElement>('#app')!;

let isFirstLoad = true;

async function router() {
  const path = window.location.pathname;

  if (isFirstLoad) {
    app.innerHTML = `
      <div id="theme-wrapper" class="relative flex justify-center items-center h-dvh overflow-hidden font-sans text-slate-900 dark:text-white antialiased">
          <img src="/wall-login.webp" class="top-0 left-0 -z-10 absolute w-full h-dvh object-cover" alt="">
          <div class="top-0 left-0 -z-10 absolute backdrop-blur-sm dark:backdrop-brightness-50 dark:backdrop-contrast-150 w-full h-dvh"></div>
          
          <!-- Un discreto spinner en el centro para que el usuario sepa que está cargando -->
          <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 dark:border-indigo-400"></div>
      </div>
    `;
  }

  try {
    const isLoggedIn = await authService.checkSession();

    isFirstLoad = false;

    const publicPaths = ['/login', '/register', '/forgot-password', '/'];
    const adminPaths = ['/admin', '/userinfo'];

    if (!isLoggedIn && !publicPaths.includes(path)) {
      window.history.pushState({}, '', '/login?required');
      app.innerHTML = '<login-view></login-view>';
      return;
    }

    if (isLoggedIn && publicPaths.includes(path)) {
      window.history.pushState({}, '', '/home');
      app.innerHTML = '<home-view></home-view>';
      return;
    }

    if (adminPaths.includes(path) && !authService.isAdmin()) {
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
      case '/userinfo':
        const stateData = window.history.state;

        if (stateData && stateData.user) {
          app.innerHTML = '';
          const userInfoElement = document.createElement('user-info-view') as any;
          userInfoElement.data = stateData;
          app.appendChild(userInfoElement);
        } else {
          window.navigate('/admin');
        }
        break;
      default:
        app.innerHTML = isLoggedIn ? '<home-view></home-view>' : '<login-view></login-view>';
    }
  } catch (error) {
    app.innerHTML = `
      <div id="theme-wrapper" class="relative flex justify-center items-center h-dvh overflow-hidden font-sans text-slate-900 dark:text-white antialiased">
          <img src="/wall-login.webp" class="top-0 left-0 -z-10 absolute w-full h-dvh object-cover" alt="">
          <div class="top-0 left-0 -z-10 absolute backdrop-blur-sm dark:backdrop-brightness-50 dark:backdrop-contrast-150 w-full h-dvh"></div>
          
          <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4">
              <svg class="size-16 text-amber-500 mb-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <h2 class="text-xl font-bold text-gray-800 dark:text-white">Servidor en pausa</h2>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Render está despertando el servidor. Esto puede tardar unos 50 segundos.</p>
              <button onclick="window.location.reload()" class="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer w-full">Reintentar</button>
          </div>
      </div>
    `;
  }
}

window.addEventListener('popstate', router);

window.navigate = (path: string, state: any = {}) => {
  window.history.pushState(state, '', path);
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
