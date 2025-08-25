import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { AGORA_CONFIG } from "../config";

// Use configuration from config.js
const APP_ID = AGORA_CONFIG.APP_ID;
const TEMP_TOKEN = AGORA_CONFIG.TEMP_TOKEN;

export default function Call({ channel }) {
  const [inCall, setInCall] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const client = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const retryTimeoutRef = useRef();

  useEffect(() => {
    // Initialize the client with more robust settings
    client.current = AgoraRTC.createClient({ 
      mode: "rtc", 
      codec: "vp8",
      // Add additional configuration for better connectivity
      enableDualStream: false,
      enableAudioRecording: false
    });
    

    
    // Set up event listeners
    client.current.on("user-published", handleUserPublished);
    client.current.on("user-unpublished", handleUserUnpublished);
    client.current.on("user-left", handleUserLeft);
    client.current.on("connection-state-change", handleConnectionStateChange);

    return () => {
      if (client.current) {
        client.current.off("user-published", handleUserPublished);
        client.current.off("user-unpublished", handleUserUnpublished);
        client.current.off("user-left", handleUserLeft);
        client.current.off("connection-state-change", handleConnectionStateChange);
      }
      // Clear any pending retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleConnectionStateChange = (curState, prevState) => {
    console.log("Connection state changed from", prevState, "to", curState);
    if (curState === "DISCONNECTED") {
      setError("Connection lost. Please try again.");
      setInCall(false);
      setIsConnecting(false);
    } else if (curState === "CONNECTED") {
      setIsConnecting(false);
    } else if (curState === "CONNECTING") {
      setIsConnecting(true);
    }
  };

  useEffect(() => {
    if (channel && !inCall && client.current && !isConnecting) {
      joinChannel();
    }
  }, [channel, client.current, isConnecting]);

  const handleUserPublished = async (user, mediaType) => {
    try {
      await client.current.subscribe(user, mediaType);
      console.log("Subscribed to remote user:", user.uid);

      if (mediaType === "video") {
        setRemoteUsers(prev => [...prev, user]);
      }
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    } catch (error) {
      console.error("Error subscribing to user:", error);
    }
  };

  const handleUserUnpublished = (user) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const handleUserLeft = (user) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const joinChannel = async () => {
    if (!channel || !client.current || isConnecting) {
      console.log("Cannot join: channel=", channel, "client=", !!client.current, "isConnecting=", isConnecting);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsConnecting(true);

    try {
      // Check if client is already connected or connecting
      const connectionState = client.current.connectionState;
      if (connectionState === "CONNECTED" || connectionState === "CONNECTING") {
        console.log("Client already in state:", connectionState);
        setIsLoading(false);
        setIsConnecting(false);
        return;
      }

      // Try to join with a timeout using token authentication
      // Web SDK format: join(appId, channel, token, uid)
      const joinPromise = client.current.join(APP_ID, channel, TEMP_TOKEN, null);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout")), 10000)
      );

      const uid = await Promise.race([joinPromise, timeoutPromise]);
      console.log("Successfully joined channel:", channel, "with UID:", uid);

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Publish local tracks
      await client.current.publish([audioTrack, videoTrack]);
      console.log("Published local tracks");

      setInCall(true);
      setIsLoading(false);
      setIsConnecting(false);
      setRetryCount(0); // Reset retry count on success

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

    } catch (error) {
      console.error("Error joining channel:", error);
      setIsConnecting(false);
      
      // Provide more specific error messages and retry logic
      let errorMessage = "Failed to join channel";
      let shouldRetry = false;
      
      if (error.message && error.message.includes("CAN_NOT_GET_GATEWAY_SERVER")) {
        if (retryCount < 3) {
          errorMessage = `Connection attempt ${retryCount + 1} failed. Retrying...`;
          shouldRetry = true;
        } else {
          errorMessage = "Unable to connect to Agora servers. This might be due to network restrictions or firewall settings.";
        }
      } else if (error.message && error.message.includes("timeout")) {
        errorMessage = "Connection timed out. Please check your internet connection.";
        shouldRetry = retryCount < 2;
      } else if (error.message && error.message.includes("dynamic use static key")) {
        errorMessage = "Authentication required. Please contact support for proper token setup.";
      } else if (error.message && error.message.includes("invalid vendor key") || error.message.includes("can not find appid")) {
        errorMessage = "Invalid App ID. Please check your Agora project configuration or create a new project.";
      } else if (error.message && error.message.includes("already in connecting/connected state")) {
        errorMessage = "Connection already in progress. Please wait...";
        // Don't retry for this error, just wait for the current connection to complete
      } else {
        errorMessage = `Failed to join channel: ${error.message || error}`;
      }
      
      setError(errorMessage);
      setIsLoading(false);

      // Retry logic
      if (shouldRetry) {
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          if (!inCall && !isConnecting) {
            joinChannel();
          }
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    }
  };

  const leaveChannel = async () => {
    try {
      // Clear any pending retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      if (localVideoTrack) {
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }

      if (client.current) {
        await client.current.leave();
      }
      setInCall(false);
      setRemoteUsers([]);
      setRetryCount(0);
      setIsConnecting(false);
      console.log("Left channel successfully");
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  };

  const retryConnection = async () => {
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setError(null);
    setRetryCount(0);
    setInCall(false);
    setRemoteUsers([]);
    setIsConnecting(false);
    
    if (localAudioTrack) {
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    
    // Leave current connection if any
    if (client.current) {
      try {
        await client.current.leave();
      } catch (error) {
        console.log("Error leaving during retry:", error);
      }
    }
    
    // Reinitialize client
    client.current = AgoraRTC.createClient({ 
      mode: "rtc", 
      codec: "vp8",
      enableDualStream: false,
      enableAudioRecording: false
    });
    
    client.current.on("user-published", handleUserPublished);
    client.current.on("user-unpublished", handleUserUnpublished);
    client.current.on("user-left", handleUserLeft);
    client.current.on("connection-state-change", handleConnectionStateChange);
    
    // Wait a moment before trying to join again
    setTimeout(() => {
      if (channel) {
        joinChannel();
      }
    }, 1000);
  };

  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      remoteUsers[0].videoTrack.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  if (!channel) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Please enter a channel name to start</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        
        {error.includes("network restrictions") && (
          <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
            <h4>Possible Solutions:</h4>
            <ul style={{ textAlign: "left", display: "inline-block" }}>
              <li>Check if you're behind a corporate firewall</li>
              <li>Try using a different network (mobile hotspot)</li>
              <li>Disable VPN if you're using one</li>
              <li>Check browser permissions for camera/microphone</li>
            </ul>
          </div>
        )}
        
        {error.includes("Invalid App ID") && (
          <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "5px", border: "1px solid #ffeaa7" }}>
            <h4>App ID Issue - Solutions:</h4>
            <ul style={{ textAlign: "left", display: "inline-block" }}>
              <li>Create a new Agora project at <a href="https://console.agora.io" target="_blank" rel="noopener noreferrer">console.agora.io</a></li>
              <li>Get your App ID from the project settings</li>
              <li>Replace the APP_ID constant in Call.js with your new App ID</li>
              <li>Generate a new token for your App ID and channel</li>
              <li>Make sure your project is enabled for RTC (Real-Time Communication)</li>
            </ul>
          </div>
        )}
        
        <button 
          onClick={retryConnection}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Retry Connection
        </button>
        
        <button 
          onClick={() => {
            setError(null);
            setRetryCount(0);
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Joining channel...</p>
        {retryCount > 0 && <p>Retry attempt: {retryCount}</p>}
        {isConnecting && <p>Connecting to Agora servers...</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3>Channel: {channel}</h3>
        {inCall && (
          <button 
            onClick={leaveChannel}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Leave Channel
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Local Video */}
        <div style={{ border: "2px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
          <div
            ref={localVideoRef}
            style={{
              width: "400px",
              height: "300px",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {!localVideoTrack && <p>Local Video</p>}
          </div>
          <div style={{ padding: "10px", backgroundColor: "#f8f8f8" }}>
            <strong>You</strong>
          </div>
        </div>

        {/* Remote Videos */}
        {remoteUsers.map((user, index) => (
          <div key={user.uid} style={{ border: "2px solid #4CAF50", borderRadius: "8px", overflow: "hidden" }}>
            <div
              ref={index === 0 ? remoteVideoRef : null}
              style={{
                width: "400px",
                height: "300px",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <p>Remote User {user.uid}</p>
            </div>
            <div style={{ padding: "10px", backgroundColor: "#e8f5e8" }}>
              <strong>Remote User {user.uid}</strong>
            </div>
          </div>
        ))}
      </div>

      {remoteUsers.length === 0 && inCall && (
        <div style={{ marginTop: "20px", textAlign: "center", color: "#666" }}>
          <p>Waiting for other users to join...</p>
        </div>
      )}
    </div>
  );
}
