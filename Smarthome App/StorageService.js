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

  hasItem(key) {
    if (!this.canUseLocalStorage()) return false;
    return window.localStorage.getItem(key) !== null;
  },

  userKey(key, username) {
    return `${key}_${username}`;
  },

  hasUserState(username) {
    if (!username) return false;
    return [
      this.userKey(this.keys.devices, username),
      this.userKey(this.keys.notifications, username),
      this.userKey(this.keys.prefs, username),
      this.userKey(this.keys.budget, username),
      this.userKey(this.keys.goals, username),
      this.userKey(this.keys.achievements, username),
      this.userKey(this.keys.integrations, username),
      this.userKey(this.keys.automationRules, username),
      this.userKey(this.keys.gamification, username),
    ].some(key => this.hasItem(key));
  },

  migrateLegacyStateToUser(username) {
    if (!username) return false;
    if (this.hasUserState(username)) {
      console.debug('StorageService: user-specific state already exists for', username);
      return false;
    }

    const devices = this.load(this.keys.devices);
    const notifications = this.load(this.keys.notifications);
    const prefs = this.load(this.keys.prefs);
    const budget = this.load(this.keys.budget);
    const goals = this.load(this.keys.goals);
    const achievements = this.load(this.keys.achievements);
    const integrations = this.load(this.keys.integrations);
    const automationRules = this.load(this.keys.automationRules);
    const gamification = this.load(this.keys.gamification);

    const legacyItems = {
      devices: !!devices,
      notifications: !!notifications,
      prefs: !!prefs,
      budget: !!budget,
      goals: !!goals,
      achievements: !!achievements,
      integrations: !!integrations,
      automationRules: !!automationRules,
      gamification: !!gamification,
    };

    if (!Object.values(legacyItems).some(Boolean)) {
      console.debug('StorageService: no legacy storage found to migrate for', username);
      return false;
    }

    console.debug('StorageService: migrating legacy storage for', username, legacyItems);

    let migrated = false;
    if (devices) {
      this.save(this.userKey(this.keys.devices, username), devices);
      migrated = true;
    }
    if (notifications) {
      this.save(this.userKey(this.keys.notifications, username), notifications);
      migrated = true;
    }
    if (prefs) {
      this.save(this.userKey(this.keys.prefs, username), prefs);
      migrated = true;
    }
    if (budget) {
      this.save(this.userKey(this.keys.budget, username), budget);
      migrated = true;
    }
    if (goals) {
      this.save(this.userKey(this.keys.goals, username), goals);
      migrated = true;
    }
    if (achievements) {
      this.save(this.userKey(this.keys.achievements, username), achievements);
      migrated = true;
    }
    if (integrations) {
      this.save(this.userKey(this.keys.integrations, username), integrations);
      migrated = true;
    }
    if (automationRules) {
      this.save(this.userKey(this.keys.automationRules, username), automationRules);
      migrated = true;
    }
    if (gamification) {
      this.save(this.userKey(this.keys.gamification, username), gamification);
      migrated = true;
    }

    if (migrated) {
      console.debug('StorageService: migration complete for', username);
    }
    return migrated;
  },

  saveUserState(state, username) {
    if (!username) return;
    this.save(this.userKey(this.keys.devices, username), state.devices);
    this.save(this.userKey(this.keys.notifications, username), state.notifications);
    this.save(this.userKey(this.keys.prefs, username), state.prefs);
    this.save(this.userKey(this.keys.budget, username), state.budget);
    this.save(this.userKey(this.keys.goals, username), state.goals);
    this.save(this.userKey(this.keys.achievements, username), state.achievements);
    this.save(this.userKey(this.keys.integrations, username), state.integrations);
    this.save(this.userKey(this.keys.automationRules, username), state.automationRules);
    this.save(this.userKey(this.keys.gamification, username), state.gamification);
  },

  loadUserState(state, username) {
    if (!username) return;

    this.migrateLegacyStateToUser(username);

    const savedCurrentUser = this.load(this.keys.currentUser);
    const currentUserMatches = savedCurrentUser && savedCurrentUser.username === username;
    const fallbackToGlobal = currentUserMatches || username === 'admin';

    const devices = this.load(this.userKey(this.keys.devices, username))
      ?? (fallbackToGlobal ? this.load(this.keys.devices) : null);
    const notifications = this.load(this.userKey(this.keys.notifications, username))
      ?? (fallbackToGlobal ? this.load(this.keys.notifications) : null);
    const prefs = this.load(this.userKey(this.keys.prefs, username))
      ?? (fallbackToGlobal ? this.load(this.keys.prefs) : null);
    const budget = this.load(this.userKey(this.keys.budget, username))
      ?? (fallbackToGlobal ? this.load(this.keys.budget) : null);
    const goals = this.load(this.userKey(this.keys.goals, username))
      ?? (fallbackToGlobal ? this.load(this.keys.goals) : null);
    const achievements = this.load(this.userKey(this.keys.achievements, username))
      ?? (fallbackToGlobal ? this.load(this.keys.achievements) : null);
    const integrations = this.load(this.userKey(this.keys.integrations, username))
      ?? (fallbackToGlobal ? this.load(this.keys.integrations) : null);
    const automationRules = this.load(this.userKey(this.keys.automationRules, username))
      ?? (fallbackToGlobal ? this.load(this.keys.automationRules) : null);
    const gamification = this.load(this.userKey(this.keys.gamification, username))
      ?? (fallbackToGlobal ? this.load(this.keys.gamification) : null);

    if (devices) state.devices = devices;
    if (notifications) state.notifications = notifications;
    if (prefs) state.prefs = { ...state.prefs, ...prefs };
    if (budget) state.budget = { ...state.budget, ...budget };
    if (goals) state.goals = { ...state.goals, ...goals };
    if (achievements) state.achievements = { ...state.achievements, ...achievements };
    if (integrations) state.integrations = { ...state.integrations, ...integrations };
    if (automationRules) state.automationRules = automationRules;
    if (gamification) state.gamification = { ...state.gamification, ...gamification };
  },

  saveState(state) {
    this.save(this.keys.accounts, state.accounts);
    if (state.currentUser && state.currentUser.username) {
      this.save(this.keys.currentUser, state.currentUser);
      this.saveUserState(state, state.currentUser.username);
    } else {
      this.remove(this.keys.currentUser);
    }
  },

  loadState(state) {
    const accounts = this.load(this.keys.accounts);
    const currentUser = this.load(this.keys.currentUser);

    if (accounts) state.accounts = accounts;
    if (currentUser) state.currentUser = currentUser;

    console.debug('StorageService: loadState', {
      hasAccounts: !!accounts,
      hasCurrentUser: !!currentUser,
      currentUser: currentUser ? currentUser.username : null,
    });
  },
};
