import { create } from 'zustand';

export const useStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    return { theme: nextTheme };
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  
  // Offline status tracking
  isOffline: !navigator.onLine,
  setOffline: (status) => set({ isOffline: status }),

  // Notification alerts state
  activeAlert: null, // { message, type: 'success' | 'error' | 'info' }
  showAlert: (message, type = 'info') => {
    set({ activeAlert: { message, type } });
    setTimeout(() => {
      set({ activeAlert: null });
    }, 4000);
  },
  clearAlert: () => set({ activeAlert: null })
}));
