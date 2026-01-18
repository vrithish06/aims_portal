import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: (userData) => {
    set({
      user: userData,
      isAuthenticated: true
    });
    localStorage.setItem('user', JSON.stringify(userData));
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false
    });
    localStorage.removeItem('user');
  },

  initializeAuth: () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      set({
        user: userData,
        isAuthenticated: true
      });
    }
  }
}));

export default useAuthStore;
