'use strict';

import DeviceModel from '../Models/DeviceModel.js';
import UserModel from '../Models/UserModel.js';
import SettingsModel from '../Models/SettingsModel.js';
import { login, signup } from '../Controllers/AuthController.js';
import { addDevice, removeDevice } from '../Controllers/DeviceController.js';
import { renderLogin } from '../Views/LoginView.js';
import { renderDashboard } from '../Views/DashboardView.js';

export function initMvcDemo() {
  const infoEl = document.getElementById('mvc-info');
  if (infoEl) {
    infoEl.textContent = 'Models / Controllers / Views loaded';
  }

  const sampleDevice = DeviceModel.create({
    id: 'dev-001',
    name: 'Smart Lamp',
    type: 'Lighting',
    kwh: 12,
    location: 'Living Room',
  });

  const sampleUser = UserModel.create({
    username: 'demo',
    email: 'demo@energyiq.app',
    name: 'Demo User',
  });

  const sampleSettings = SettingsModel.defaults();

  console.group('MVC Demo')
  console.log('Device Model:', sampleDevice);
  console.log('User Model:', sampleUser);
  console.log('Settings Model:', sampleSettings);
  console.log('Auth Controller login function:', login.name);
  console.log('Auth Controller signup function:', signup.name);
  console.log('Device Controller addDevice function:', addDevice.name);
  console.log('Device Controller removeDevice function:', removeDevice.name);
  console.log('Login View renderer result:', renderLogin());
  console.log('Dashboard View renderer result:', renderDashboard(sampleDevice));
  console.groupEnd();
}
