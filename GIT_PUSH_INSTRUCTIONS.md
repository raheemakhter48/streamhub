# Git Push Instructions

## Steps to Push to GitHub

### 1. Initialize Git (if not already done)

```bash
cd d:\applications\fasco
git init
```

### 2. Add Remote Repository

```bash
git remote add origin https://github.com/raheemakhter48/streamflow-hub.git
```

### 3. Add All Files

```bash
git add .
```

### 4. Commit Changes

```bash
git commit -m "Complete backend implementation with MongoDB and Azure deployment

- Added Node.js/Express backend
- MongoDB integration (replaced Supabase)
- JWT authentication
- IPTV credentials management
- M3U playlist fetching (no CORS)
- Favorites and recently watched
- Stream proxy for video streams
- Azure deployment configuration
- Updated frontend to use backend API
- Performance optimizations (pagination)
- Zero buffering HLS player
- Dark/light theme support"
```

### 5. Push to GitHub

```bash
git push -u origin main
```

If main branch doesn't exist:
```bash
git branch -M main
git push -u origin main
```

## If You Get Authentication Error

### Option 1: Use Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Use token as password when pushing

### Option 2: Use SSH

```bash
git remote set-url origin git@github.com:raheemakhter48/streamflow-hub.git
```

## Files to Exclude (Already in .gitignore)

- `node_modules/`
- `.env` files
- `dist/`
- Logs

## What's Being Pushed

✅ Complete backend code
✅ Frontend with backend integration
✅ MongoDB models
✅ Azure deployment configs
✅ Documentation
✅ All source code

---

**Ready to push!** 🚀

