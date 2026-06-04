'use strict';

const StorageService = {
  keys: {
    devices: 'eiq_devices',
    notifications: 'eiq_notifications',
    accounts: 'eiq_accounts',
    prefs: 'eiq_prefs',
    budget: 'eiq_budget',
    goals: 'eiq_goals',
    achievements: 'eiq_achievements',
    integrations: 'eiq_integrations',
    automationRules: 'eiq_automationRules',
    gamification: 'eiq_gamification',
    currentUser: 'eiq_current_user',
    rememberUsername: 'eiq_remember_username',
    lastLogin: 'eiq_last_login',
  },

  canUseLocalStorage() {
    try {
      const testKey = '__eiq_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('EnergyIQ: localStorage unavailable', error);
      return false;
    }
  },

  save(key, value) {
    if (!this.canUseLocalStorage()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('EnergyIQ: Failed to save', key, error);
    }
  },

  load(key, fallback = null) {
    if (!this.canUseLocalStorage()) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('EnergyIQ: Failed to load', key, error);
      return fallback;
    }
  },

  remove(key) {
    if (!this.canUseLocalStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('EnergyIQ: Failed to remove', key, error);
    }
  },

  saveState(state) {
    this.save(this.keys.devices, state.devices);
    this.save(this.keys.notifications, state.notifications);
    this.save(this.keys.accounts, state.accounts);
    this.save(this.keys.prefs, state.prefs);
    this.save(this.keys.budget, state.budget);
    this.save(this.keys.goals, state.goals);
    this.save(this.keys.achievements, state.achievements);
    this.save(this.keys.integrations, state.integrations);
    this.save(this.keys.automationRules, state.automationRules);
    this.save(this.keys.gamification, state.gamification);
    if (state.currentUser) {
      this.save(this.keys.currentUser, state.currentUser);
    } else {
      this.remove(this.keys.currentUser);
    }
  },

  loadState(state) {
    const devices = this.load(this.keys.devices);
    const notifications = this.load(this.keys.notifications);
    const accounts = this.load(this.keys.accounts);
    const prefs = this.load(this.keys.prefs);
    const currentUser = this.load(this.keys.currentUser);
    const budget = this.load(this.keys.budget);
    const goals = this.load(this.keys.goals);
    const achievements = this.load(this.keys.achievements);
    const integrations = this.load(this.keys.integrations);
    const automationRules = this.load(this.keys.automationRules);
    const gamification = this.load(this.keys.gamification);

    if (devices) state.devices = devices;
    if (notifications) state.notifications = notifications;
    if (accounts) state.accounts = accounts;
    if (prefs) state.prefs = { ...state.prefs, ...prefs };
    if (currentUser) state.currentUser = currentUser;
    if (budget) state.budget = { ...state.budget, ...budget };
    if (goals) state.goals = { ...state.goals, ...goals };
    if (achievements) state.achievements = { ...state.achievements, ...achievements };
    if (integrations) state.integrations = { ...state.integrations, ...integrations };
    if (automationRules) state.automationRules = automationRules;
    if (gamification) state.gamification = { ...state.gamification, ...gamification };
  },
};
