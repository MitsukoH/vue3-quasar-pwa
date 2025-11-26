import { defineStore, acceptHMRUpdate } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    userName: localStorage.getItem('userName') || '嘎嘎',
  }),

  actions: {
    setUserName(name: string) {
      this.userName = name;
      localStorage.setItem('userName', name);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
