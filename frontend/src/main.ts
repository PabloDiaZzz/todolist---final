import './style.css';
import 'flowbite';
import './views/LoginView';
import './views/HomeView';
import './views/RegisterView';
import './views/ForgotPasswordView';

const app = document.querySelector<HTMLDivElement>('#app')!;

async function router() {
  const path = window.location.pathname;

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
