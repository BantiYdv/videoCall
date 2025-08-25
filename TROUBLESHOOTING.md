# Troubleshooting Agora App ID Issues

## Error: "invalid vendor key, can not find appid"

This error occurs when the Agora App ID is invalid or the project is not properly configured.

### Solution Steps:

1. **Create a New Agora Project:**
   - Go to [Agora Console](https://console.agora.io)
   - Sign up or log in to your account
   - Click "Create Project"
   - Give your project a name (e.g., "Video Call App")
   - Select "RTC (Real-Time Communication)" as the project type
   - Click "Create"

2. **Get Your App ID:**
   - In your project dashboard, find the "App ID" field
   - Copy the App ID (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

3. **Generate a Token:**
   - In your project dashboard, go to "Token Generator"
   - Enter your channel name: `my-room`
   - Set UID to 0 (or leave empty for auto-assignment)
   - Set expiration time (e.g., 24 hours)
   - Click "Generate Token"
   - Copy the generated token

4. **Update Configuration:**
   - Open `src/config.js`
   - Replace the `APP_ID` with your new App ID
   - Replace the `TEMP_TOKEN` with your new token
   - Save the file

5. **Restart the Application:**
   - Stop the development server (Ctrl+C)
   - Run `npm start` again

### Example Configuration:

```javascript
export const AGORA_CONFIG = {
  APP_ID: "your_new_app_id_here",
  TEMP_TOKEN: "your_new_token_here",
  DEFAULT_CHANNEL: "my-room"
};
```

### Common Issues:

- **Project not enabled for RTC:** Make sure your project type is "RTC (Real-Time Communication)"
- **Token expired:** Generate a new token if the current one has expired
- **Wrong channel name:** Make sure the token is generated for the same channel name you're using

### Testing:

1. Open the app in your browser
2. The channel form should be pre-filled with "my-room"
3. Click "Join Channel"
4. Allow camera and microphone permissions
5. You should see your local video feed

If you still have issues, check the browser console for more detailed error messages.
