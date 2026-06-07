# EnergyIQ App

## Smart Home Energy Monitoring System
A full-featured smart home energy monitoring and automation system built with a modular MVC-style architecture.

## EnergyIQ App Structure
This workspace is a static web app with a simple MVC-style folder layout for presentation.

- `wwwroot/` contains the web assets (`index.html`, `style.css`, `script.js`).
- `StorageService.js` centralizes browser storage so `localStorage` behaves like a simple client-side database.
- `AuthService.js` adds local password hashing and improves demo authentication while keeping all data on the device.
- `Models/`, `Controllers/`, and `Views/` now contain real MVC modules with model constructors, controller actions, and view renderers.
- `Habits/`, `Home/`, and `Shares/` now contain feature module files to give each section more content.
- `Program/`, `Migrations/`, and `Properties/` contain configuration and migration examples to represent a larger project structure.
- `wwwroot/` now includes asset subfolders and additional frontend support files.
- The current working app files remain in the root for compatibility, while `wwwroot/` holds a copy to demonstrate a real project layout.

## Features
- Energy usage tracking
- Device management system
- Automation rules
- User authentication
- Dashboard analytics
- Habit tracking system
- Data storage simulation using `localStorage`

## Tech Stack
- JavaScript (Vanilla MVC)
- HTML, CSS
- Node-style architecture simulation

## Project Structure
- `Controllers/`
- `Models/`
- `Views/`
- `Services/`
- SQL migration scripts

## Author
- `mhdateeq1225-ship-it`
