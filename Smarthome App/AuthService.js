'use strict';

const AuthService = {
  generateSalt(length = 16) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}`);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async createAccount({ username, password, name, email, address = '', plan = 'Free' }) {
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);
    return { username, name, email, address, plan, passwordHash, salt };
  },

  async validateCredentials(account, password) {
    if (!account) return false;
    if (account.passwordHash && account.salt) {
      const hash = await this.hashPassword(password, account.salt);
      return hash === account.passwordHash;
    }
    // Legacy fallback for older demo accounts stored with plain-text password
    if (account.password) {
      return account.password === password;
    }
    return false;
  },

  async prepareAccounts(accounts) {
    if (!Array.isArray(accounts)) return;
    let migrated = false;

    for (const account of accounts) {
      if (account.password && !(account.passwordHash && account.salt)) {
        account.salt = account.salt || this.generateSalt();
        account.passwordHash = await this.hashPassword(account.password, account.salt);
        delete account.password;
        migrated = true;
      }
    }

    return migrated;
  },

  async findAccountByUsername(accounts, username) {
    if (!Array.isArray(accounts)) return null;
    return accounts.find(acc => acc.username === username) || null;
  },

  async authenticate(accounts, username, password) {
    const account = await this.findAccountByUsername(accounts, username);
    if (!account) return null;
    const valid = await this.validateCredentials(account, password);
    return valid ? account : null;
  },
};
