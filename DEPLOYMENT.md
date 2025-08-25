# Deployment Guide for Render

## 🚀 Quick Deploy to Render

### Option 1: One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual Deployment

1. **Fork/Clone this repository**
2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Sign up/Login
   - Click "New +" → "Static Site"

3. **Configure the deployment:**
   - **Name:** `agora-video-call`
   - **Repository:** Your GitHub repo
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`

4. **Set Environment Variables:**
   ```
   REACT_APP_AGORA_APP_ID=your_agora_app_id
   REACT_APP_AGORA_TOKEN=your_agora_token
   REACT_APP_DEFAULT_CHANNEL=my-room
   ```

5. **Click "Create Static Site"**

## 🔧 Pre-Deployment Checklist

### ✅ Required Setup:
- [ ] Agora project created with valid App ID
- [ ] Token authentication configured (or disabled for testing)
- [ ] Environment variables set in Render
- [ ] HTTPS enabled (automatic on Render)

### ✅ Security Considerations:
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS (automatic on Render)
- [ ] Configure CSP headers (included in _headers file)
- [ ] Set up proper CORS if needed

### ✅ Performance Optimizations:
- [ ] Build optimization enabled
- [ ] Static assets properly configured
- [ ] CDN enabled (automatic on Render)

## 🌐 Post-Deployment

### Environment Variables in Render:
1. Go to your service dashboard
2. Click "Environment" tab
3. Add these variables:
   ```
   REACT_APP_AGORA_APP_ID=your_app_id
   REACT_APP_AGORA_TOKEN=your_token_or_null
   REACT_APP_DEFAULT_CHANNEL=my-room
   ```

### Testing Your Deployment:
1. Visit your Render URL
2. Test video call functionality
3. Check browser console for errors
4. Verify camera/microphone permissions

## 🔍 Troubleshooting

### Common Issues:
- **CORS errors:** Check CSP headers in `_headers` file
- **Token errors:** Verify environment variables are set correctly
- **Build failures:** Check build logs in Render dashboard
- **HTTPS issues:** Render provides HTTPS automatically

### Support:
- Render Documentation: https://render.com/docs
- Agora Documentation: https://docs.agora.io
- React Documentation: https://reactjs.org/docs
