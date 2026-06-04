// Device model example
// This file defines the structure and creation logic for device records.

const DeviceModel = {
  defaults() {
    return {
      id: '',
      name: '',
      type: 'Unknown',
      kwh: 0,
      location: '',
      brand: '',
      wattage: 0,
      addedAt: new Date().toISOString(),
    };
  },

  create(data = {}) {
    return { ...this.defaults(), ...data };
  },
};

export default DeviceModel;
