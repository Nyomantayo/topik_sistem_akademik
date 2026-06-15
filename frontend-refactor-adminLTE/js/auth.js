(function () {
  const TOKEN_KEY = 'krs_token';
  const USER_KEY  = 'krs_user';

  const ROLE_LABEL = { admin: 'Administrator', mahasiswa: 'Mahasiswa', dosen: 'Dosen', guest: 'Tamu' };

  window.Auth = {
    getToken: () => localStorage.getItem(TOKEN_KEY),

    getUser: () => {
      try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
    },

    setSession: (token, user) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    clear: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
    isGuest:  () => Auth.getUser()?.role === 'guest',
    isAdmin:  () => Auth.getUser()?.role === 'admin',

    requireAuth: (allowGuest = false) => {
      if (!Auth.isAuthenticated()) { window.location.href = 'login.html'; return false; }
      if (!allowGuest && Auth.isGuest()) { window.location.href = 'mahasiswa.html'; return false; }
      return true;
    },

    requireNoAuth: () => {
      if (!Auth.isAuthenticated()) return true;
      window.location.href = Auth.isGuest() ? 'mahasiswa.html' : 'dashboard.html';
      return false;
    },

    logout: () => {
      Auth.clear();
      window.location.href = 'login.html';
    },

    initLayout: () => {
      const user = Auth.getUser();
      if (!user) return;

      document.querySelectorAll('.user-display-name').forEach(el => el.textContent = user.name);
      document.querySelectorAll('.user-display-role').forEach(el => el.textContent = ROLE_LABEL[user.role] || user.role);
      document.querySelectorAll('.user-avatar-initials').forEach(el => el.textContent = (user.name?.[0] || '?').toUpperCase());

      if (user.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      }
      if (user.role === 'guest') {
        document.querySelectorAll('.no-guest').forEach(el => el.style.display = 'none');
      }

      const page = window.location.pathname.split('/').pop() || 'dashboard.html';
      document.querySelectorAll('.nav-sidebar .nav-link[data-page]').forEach(link => {
        if (link.getAttribute('data-page') === page) link.classList.add('active');
      });
    },
  };
})();
