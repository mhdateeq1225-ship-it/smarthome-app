// User model example
// Defines user identity and account details.

const UserModel = {
  defaults() {
    return {
      id: '',
      username: '',
      email: '',
      name: '',
      role: 'user',
      plan: 'Free',
      createdAt: new Date().toISOString(),
    };
  },

  create(data = {}) {
    return { ...this.defaults(), ...data };
  },
};

export default UserModel;
