// Device controller example
// Handles device management actions.

export function addDevice(device) {
  return {
    type: 'ADD_DEVICE',
    payload: { ...device, createdAt: new Date().toISOString() },
  };
}

export function removeDevice(deviceId) {
  return {
    type: 'REMOVE_DEVICE',
    payload: { deviceId, removedAt: new Date().toISOString() },
  };
}
