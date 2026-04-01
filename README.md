# Inventory Management App - Quick Start Guide

This guide contains the daily commands you need to start the application on your computer.

## Prerequisites Check (Run Once per PC reboot)
Before starting the Node.js servers, your database and background queue must be running.

### 1. Start Docker Desktop
Open the **Docker Desktop** application from your Windows Start Menu and wait for the engine to start (the whale icon turns green).

### 2. Start the Database & Redis
Open a terminal in the project root folder (`InventorAPp`) and run:
```bash
docker-compose up -d
```
*This command starts PostgreSQL (your database) and Redis (your background worker queue) silently in the background.*

---

## Starting the Application (Daily Workflow)

You need to run two separate terminals to start both halves of the application.

### Terminal 1: Start the Backend Server (API & Background Workers)
Open a new terminal, go to the `backend` folder, and start the development server:
```bash
cd backend
npm run dev
```
*The backend API and Socket.io will start on **http://localhost:5000**.*
*The background inventory scanner (**BullMQ worker**) will automatically begin monitoring for low stock.*

### Terminal 2: Start the Frontend UI (Next.js)
Open a second terminal, go to the `frontend` folder, and start the web app:
```bash
cd frontend
npm run dev
```
*The frontend dashboard will start on **http://localhost:3000**.*

---

## Stopping the Application

When you are done working:
1. Go to **Terminal 1** (Backend) and press `Ctrl + C` to stop the API.
2. Go to **Terminal 2** (Frontend) and press `Ctrl + C` to stop the UI.
3. If you want to shut down the databases to save battery/RAM, open a terminal in the project root and run:
```bash
docker-compose down
```

## Useful Pointers
- **Main Website:** http://localhost:3000
- **Email/SMS Settings:** You can globally change who the app sends emails from and what SMS number to use by going to the **Settings** tab in the sidebar as an Admin.
- **Backend Health Check:** http://localhost:5000/api/health

## Render Deployment

This repository now includes a root `render.yaml` blueprint for Render with:

- a backend web service for the API and Socket.IO
- a separate worker service for BullMQ jobs
- a managed PostgreSQL database
- a managed Redis-compatible Key Value instance
- a frontend web service for Next.js

Before the first production deploy, set these values in Render when prompted:

- `inventorapp-api` `FRONTEND_URL`: your frontend Render URL, for example `https://inventorapp-frontend.onrender.com`
- `inventorapp-frontend` `NEXT_PUBLIC_API_URL`: your backend Render URL plus `/api`, for example `https://inventorapp-api.onrender.com/api`
- your email and Twilio credentials if you want notifications enabled in production

After the services are created, run the backend migration once:

```bash
cd backend
npm run migrate
```

The backend web service no longer starts workers in production. Render should run the dedicated `inventorapp-worker` service for scheduled checks and queue processing.
