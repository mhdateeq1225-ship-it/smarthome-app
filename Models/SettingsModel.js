// Settings model example
// This file stores application preferences and alert settings.

const SettingsModel = {
  defaults() {
    return {
      theme: 'dark',
      notifications: true,
      alertThreshold: 500,
      currency: 'USD',
      measurement: 'kWh',
      autoRefresh: false,
    };
  },
};

export default SettingsModel;
