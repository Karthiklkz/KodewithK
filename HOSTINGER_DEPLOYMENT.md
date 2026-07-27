# 🚀 Hostinger Deployment Guide for KodeWithK

This guide provides step-by-step instructions for hosting your **KodeWithK AI Interview Platform** (Next.js 15 Frontend + Python FastAPI Backend) on **Hostinger**.

---

## 🎯 Step 1: Push Your Code to GitHub

1. Initialize git and commit all project files:
   ```bash
   git init
   git add .
   git commit -m "Production release for Hostinger"
   ```
2. Create a new repository on [GitHub](https://github.com) named `kodewithk-interview`.
3. Push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/kodewithk-interview.git
   git branch -M main
   git push -u origin main
   ```

---

## 🖥️ Option A: Hosting on Hostinger VPS (Recommended)

Hostinger VPS allows you to run both **Node.js** and **Python FastAPI** simultaneously with PM2 and Nginx.

### 1. Connect to your VPS
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### 2. Install Node.js, Python, & PM2
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs python3 python3-pip python3-venv nginx git pm2 -g

# Verify installations
node -v
python3 --version
```

### 3. Clone repository and install dependencies
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/kodewithk-interview.git
cd kodewithk-interview

# Install Frontend Next.js Dependencies
npm install
npm run build

# Install Python Backend Dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 4. Start applications with PM2
```bash
# Start both Next.js and Python FastAPI using the pre-configured ecosystem file
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configure Nginx Reverse Proxy
Edit `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Reload Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🌐 Option B: Hosting Backend on Render (Free) + Frontend on Hostinger Web Hosting

If you are using Hostinger Shared / Business Web Hosting:

1. **Deploy Python Backend (`/backend`) to Render.com**:
   - Create a free Web Service on [Render](https://render.com).
   - Point to your GitHub repo, set root directory to `backend`.
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Copy the deployed Render URL (e.g. `https://kodewithk-backend.onrender.com`).

2. **Deploy Next.js Frontend on Hostinger**:
   - In Hostinger hPanel -> Node.js Applications / Web Apps:
   - Environment Variables: Set `PYTHON_BACKEND_URL=https://kodewithk-backend.onrender.com`
   - Run Build & Start.

---

## 🔐 Environment Variables Summary

| Variable Name | Value / Description |
|---|---|
| `PYTHON_BACKEND_URL` | URL of your running Python server (e.g., `http://127.0.0.1:8000` or `https://backend.yourdomain.com`) |
| `NVIDIA_API_KEY` | Optional default API key for NVIDIA Llama 3.3 |
| `NODE_ENV` | `production` |
