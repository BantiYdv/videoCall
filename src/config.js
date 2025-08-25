// Agora Configuration
// Uses environment variables for deployment, falls back to local values for development

export const AGORA_CONFIG = {
  // Your Agora App ID from the console
  APP_ID: process.env.REACT_APP_AGORA_APP_ID || "a32fa0ab368c43aa85985bb65628111f",
  
  // Your temporary token (generate new one from console)
  // Set to null to test without token authentication
  TEMP_TOKEN: process.env.REACT_APP_AGORA_TOKEN || null,
  
  // Default channel name
  DEFAULT_CHANNEL: process.env.REACT_APP_DEFAULT_CHANNEL || "my-room"
};

// Instructions:
// 1. Go to https://console.agora.io
// 2. Create a new project or use existing one
// 3. Copy your App ID from project settings
// 4. Generate a token for your channel
// 5. Replace the values above
// 
// For Render deployment:
// - Set REACT_APP_AGORA_APP_ID in Render environment variables
// - Set REACT_APP_AGORA_TOKEN in Render environment variables
// - Set REACT_APP_DEFAULT_CHANNEL in Render environment variables
