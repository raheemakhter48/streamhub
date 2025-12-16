# Docker Quick Start Script

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "DOCKER DEPLOYMENT OPTIONS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Platform Options:" -ForegroundColor Yellow
Write-Host "1. Railway (Recommended - Easy & Fast)" -ForegroundColor White
Write-Host "   URL: https://railway.app" -ForegroundColor Gray
Write-Host "   Free: 500 hours/month`n" -ForegroundColor Gray

Write-Host "2. Render (Free Tier Available)" -ForegroundColor White
Write-Host "   URL: https://render.com" -ForegroundColor Gray
Write-Host "   Free: 750 hours/month (sleeps after 15min)`n" -ForegroundColor Gray

Write-Host "3. Fly.io (Good Performance)" -ForegroundColor White
Write-Host "   URL: https://fly.io" -ForegroundColor Gray
Write-Host "   Free: 3 shared VMs`n" -ForegroundColor Gray

Write-Host "========================================" -ForegroundColor Green
Write-Host "RAILWAY QUICK STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "1. Go to: https://railway.app" -ForegroundColor Yellow
Write-Host "2. Login with GitHub" -ForegroundColor White
Write-Host "3. New Project > Deploy from GitHub" -ForegroundColor White
Write-Host "4. Select your repo" -ForegroundColor White
Write-Host "5. Settings > Root Directory: backend" -ForegroundColor White
Write-Host "6. Variables > Add:" -ForegroundColor White
Write-Host "   - MONGODB_URI=your_mongodb_uri" -ForegroundColor Gray
Write-Host "   - JWT_SECRET=your_secret" -ForegroundColor Gray
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - PORT=3000" -ForegroundColor Gray
Write-Host "7. Deploy > Get public URL" -ForegroundColor White
Write-Host "8. Update mobile app API URL`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Green
Write-Host "RENDER QUICK STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "1. Go to: https://render.com" -ForegroundColor Yellow
Write-Host "2. Sign up with GitHub" -ForegroundColor White
Write-Host "3. New > Web Service" -ForegroundColor White
Write-Host "4. Connect GitHub repo" -ForegroundColor White
Write-Host "5. Settings:" -ForegroundColor White
Write-Host "   - Environment: Docker" -ForegroundColor Gray
Write-Host "   - Root Directory: backend" -ForegroundColor Gray
Write-Host "6. Environment Variables (same as Railway)" -ForegroundColor White
Write-Host "7. Create Web Service" -ForegroundColor White
Write-Host "8. Get public URL`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Green
Write-Host "LOCAL TESTING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Test Docker locally:" -ForegroundColor Yellow
Write-Host "cd backend" -ForegroundColor White
Write-Host "docker-compose up --build`n" -ForegroundColor White

Write-Host "Or build image manually:" -ForegroundColor Yellow
Write-Host "docker build -t streamflow-backend ." -ForegroundColor White
Write-Host "docker run -p 3000:3000 -e MONGODB_URI=your_uri streamflow-backend`n" -ForegroundColor White

