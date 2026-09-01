import { supabase } from "@/lib/supabase";
import { dbSaveRecord, dbFetch } from "@/lib/dbPersistence";

/**
 * Standard public Google STUN servers for NAT Traversal.
 * Can be extended with custom TURN servers for restricted enterprise symmetric NATs.
 */
export const DEFAULT_ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

/**
 * Normalizes a user identifier for Supabase Realtime channel names.
 */
export function getChannelName(userKey) {
  const clean = String(userKey || "default")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");
  return `screen-stream-${clean}`;
}

/**
 * Active Broadcaster Session Holder (Singleton per client tab)
 */
class BroadcasterSession {
  constructor() {
    this.mediaStream = null;
    this.channel = null;
    this.peerConnections = new Map(); // viewerId -> RTCPeerConnection
    this.iceCandidateQueues = new Map(); // viewerId -> RTCIceCandidate[]
    this.userInfo = null;
    this.sessionId = null;
    this.heartbeatInterval = null;
    this.isBroadcasting = false;
    this.onStreamEndedCallback = null;
    this.onViewerCountChangeCallback = null;
  }

  /**
   * Starts a real Entire-Screen capture session and prepares WebRTC signaling.
   */
  async start({
    userId,
    userName,
    userEmail,
    department = "Engineering",
    role = "Intern",
    onStreamEnded = null,
    onViewerCountChange = null,
  }) {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen Capture API (getDisplayMedia) is not supported in this browser.");
    }

    this.onStreamEndedCallback = onStreamEnded;
    this.onViewerCountChangeCallback = onViewerCountChange;
    this.userInfo = { userId, userName, userEmail, department, role };
    this.sessionId = `sess-${Date.now()}`;

    // 1. Request Entire Screen from browser
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    } catch (err) {
      console.warn("[WebRTC Broadcaster] Display media prompt cancelled or failed:", err);
      throw err;
    }

    this.isBroadcasting = true;

    // Handle user stopping screen share via browser floating bar
    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.log("[WebRTC Broadcaster] Screen track ended by user");
        this.stop();
        if (this.onStreamEndedCallback) {
          this.onStreamEndedCallback();
        }
      };
    }

    // 2. Connect to Supabase Realtime Channel
    const channelName = getChannelName(userEmail || userId);
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    this.channel
      .on("broadcast", { event: "signal" }, async (payload) => {
        await this._handleSignalingMessage(payload.payload || payload);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[WebRTC Broadcaster] Subscribed to signaling channel: ${channelName}`);
          // Send broadcast announcement that stream is active
          this._broadcastStatus("streaming-active");
        }
      });

    // 3. Save active monitoring session record in DB
    const sessionRecord = {
      id: this.sessionId,
      user_id: String(userId || userEmail),
      user_name: userName || "Remote User",
      user_email: (userEmail || "").toLowerCase().trim(),
      user_role: role,
      department: department,
      status: "Active",
      screen_sharing: "Active",
      connection_status: "Live Streaming",
      started_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await dbSaveRecord("monitoring_sessions", sessionRecord);
      await dbSaveRecord("remote_work_sessions", sessionRecord);
    } catch (e) {
      console.warn("[WebRTC Broadcaster] Error saving session to database:", e);
    }

    // 4. Heartbeat interval (updates last_seen and broadcasts presence every 10s)
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isBroadcasting) return;
      this._broadcastStatus("heartbeat");
      try {
        const updateRec = {
          id: this.sessionId,
          last_seen: new Date().toISOString(),
          status: "Active",
          screen_sharing: "Active",
          connection_status: "Live Streaming",
          updated_at: new Date().toISOString(),
        };
        await dbSaveRecord("monitoring_sessions", updateRec);
      } catch (e) {}
    }, 10000);

    return {
      stream: this.mediaStream,
      sessionId: this.sessionId,
      channelName: channelName,
    };
  }

  /**
   * Internal signaling handler for incoming viewer messages.
   */
  async _handleSignalingMessage(msg) {
    if (!msg || !this.isBroadcasting || !this.mediaStream) return;
    const { type, viewerId, sdp, candidate } = msg;

    if (type === "viewer-join") {
      console.log(`[WebRTC Broadcaster] Viewer ${viewerId} joined. Creating Offer...`);
      await this._createPeerConnectionForViewer(viewerId);
    } else if (type === "answer" && viewerId) {
      console.log(`[WebRTC Broadcaster] Received Answer from Viewer ${viewerId}`);
      const pc = this.peerConnections.get(viewerId);
      if (pc && sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          // Flush any queued ICE candidates
          const queue = this.iceCandidateQueues.get(viewerId) || [];
          for (const cand of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          this.iceCandidateQueues.delete(viewerId);
        } catch (err) {
          console.warn("[WebRTC Broadcaster] Error setting remote description:", err);
        }
      }
    } else if (type === "candidate" && viewerId && candidate) {
      const pc = this.peerConnections.get(viewerId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[WebRTC Broadcaster] Error adding ICE candidate:", err);
        }
      } else {
        // Queue candidate until remote description is set
        const queue = this.iceCandidateQueues.get(viewerId) || [];
        queue.push(candidate);
        this.iceCandidateQueues.set(viewerId, queue);
      }
    } else if (type === "viewer-leave" && viewerId) {
      this._closePeerConnection(viewerId);
    }
  }

  /**
   * Creates a dedicated RTCPeerConnection for a connecting Admin Viewer and sends an SDP Offer.
   */
  async _createPeerConnectionForViewer(viewerId) {
    this._closePeerConnection(viewerId);

    const pc = new RTCPeerConnection(DEFAULT_ICE_SERVERS);
    this.peerConnections.set(viewerId, pc);

    // Add local MediaStream tracks to peer connection
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.mediaStream);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "candidate",
            viewerId: viewerId,
            candidate: event.candidate,
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Broadcaster] PC state for viewer ${viewerId}: ${pc.connectionState}`);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        this._closePeerConnection(viewerId);
      }
      if (this.onViewerCountChangeCallback) {
        this.onViewerCountChangeCallback(this.peerConnections.size);
      }
    };

    // Create & send Offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      });
      await pc.setLocalDescription(offer);

      if (this.channel) {
        await this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "offer",
            viewerId: viewerId,
            sdp: pc.localDescription,
          },
        });
      }

      if (this.onViewerCountChangeCallback) {
        this.onViewerCountChangeCallback(this.peerConnections.size);
      }
    } catch (err) {
      console.warn("[WebRTC Broadcaster] Error creating offer for viewer:", err);
    }
  }

  _closePeerConnection(viewerId) {
    const pc = this.peerConnections.get(viewerId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      this.peerConnections.delete(viewerId);
      this.iceCandidateQueues.delete(viewerId);
    }
  }

  _broadcastStatus(status) {
    if (this.channel && this.userInfo) {
      this.channel.send({
        type: "broadcast",
        event: "signal",
        payload: {
          type: "status-update",
          status: status,
          user: this.userInfo,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Cleanly stops the broadcast session and notifies viewers.
   */
  async stop() {
    this.isBroadcasting = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Notify all viewers that stream ended
    if (this.channel) {
      try {
        await this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "stream-stopped", sessionId: this.sessionId },
        });
      } catch (e) {}
    }

    // Stop MediaStream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.mediaStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    this.peerConnections.clear();
    this.iceCandidateQueues.clear();

    // Unsubscribe from channel
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (e) {}
      this.channel = null;
    }

    // Update database session status
    if (this.sessionId) {
      try {
        const updateRec = {
          id: this.sessionId,
          status: "Stopped",
          screen_sharing: "Inactive",
          connection_status: "Offline",
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await dbSaveRecord("monitoring_sessions", updateRec);
        await dbSaveRecord("remote_work_sessions", updateRec);
      } catch (e) {}
    }

    console.log("[WebRTC Broadcaster] Broadcast session cleanly stopped.");
  }
}

// Global Broadcaster Singleton instance
export const globalBroadcaster = new BroadcasterSession();

/**
 * Starts a Broadcaster Session from UI
 */
export async function startScreenBroadcast(params) {
  return await globalBroadcaster.start(params);
}

/**
 * Stops Broadcaster Session from UI
 */
export async function stopScreenBroadcast() {
  await globalBroadcaster.stop();
}

/**
 * Check if broadcaster is currently running
 */
export function isScreenBroadcasting() {
  return globalBroadcaster.isBroadcasting && globalBroadcaster.mediaStream !== null;
}

/**
 * Viewer Connection Class for Admin Dashboard
 */
export class WebRTCViewerClient {
  constructor({ userKey, onRemoteStream, onConnectionStateChange, onStatusMessage }) {
    this.userKey = userKey;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onStatusMessage = onStatusMessage;

    this.viewerId = `viewer-${Math.random().toString(36).substring(2, 9)}`;
    this.channel = null;
    this.peerConnection = null;
    this.iceCandidateQueue = [];
    this.isConnected = false;
    this.reconnectTimeout = null;
  }

  /**
   * Connects to the remote user's broadcast channel and initiates WebRTC handshake.
   */
  async connect() {
    this.disconnect();

    const channelName = getChannelName(this.userKey);
    console.log(`[WebRTC Viewer] Connecting to channel: ${channelName} as ${this.viewerId}`);

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange("connecting");
    }

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    this.channel
      .on("broadcast", { event: "signal" }, async (payload) => {
        await this._handleSignalingMessage(payload.payload || payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[WebRTC Viewer] Subscribed. Sending viewer-join...`);
          this._sendJoinRequest();
        }
      });
  }

  _sendJoinRequest() {
    if (this.channel) {
      this.channel.send({
        type: "broadcast",
        event: "signal",
        payload: {
          type: "viewer-join",
          viewerId: this.viewerId,
        },
      });
    }
  }

  async _handleSignalingMessage(msg) {
    if (!msg) return;
    const { type, viewerId, sdp, candidate, status } = msg;

    if (type === "stream-stopped") {
      console.log("[WebRTC Viewer] Remote user stopped screen sharing");
      if (this.onStatusMessage) this.onStatusMessage("Screen sharing stopped by user");
      if (this.onConnectionStateChange) this.onConnectionStateChange("stopped");
      this._cleanupPeerConnection();
      return;
    }

    if (type === "status-update") {
      if (status === "streaming-active" && !this.isConnected) {
        this._sendJoinRequest();
      }
      return;
    }

    // Only process messages addressed to this specific viewer
    if (viewerId !== this.viewerId) return;

    if (type === "offer" && sdp) {
      console.log("[WebRTC Viewer] Received Offer. Creating Answer...");
      await this._handleOffer(sdp);
    } else if (type === "candidate" && candidate) {
      if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[WebRTC Viewer] Error adding candidate:", err);
        }
      } else {
        this.iceCandidateQueue.push(candidate);
      }
    }
  }

  async _handleOffer(sdp) {
    this._cleanupPeerConnection();

    this.peerConnection = new RTCPeerConnection(DEFAULT_ICE_SERVERS);

    // Incoming remote video stream track
    this.peerConnection.ontrack = (event) => {
      console.log("[WebRTC Viewer] Received remote MediaStream track! 🎥", event.streams);
      if (event.streams && event.streams[0]) {
        this.isConnected = true;
        if (this.onRemoteStream) {
          this.onRemoteStream(event.streams[0]);
        }
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange("connected");
        }
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "candidate",
            viewerId: this.viewerId,
            candidate: event.candidate,
          },
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection ? this.peerConnection.connectionState : "closed";
      console.log(`[WebRTC Viewer] Connection State: ${state}`);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }

      if (state === "disconnected" || state === "failed") {
        this.isConnected = false;
        // Attempt reconnection after brief timeout
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            if (this.channel) {
              console.log("[WebRTC Viewer] Attempting auto-reconnect...");
              this._sendJoinRequest();
            }
          }, 3000);
        }
      }
    };

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

      // Flush queued candidates
      while (this.iceCandidateQueue.length > 0) {
        const cand = this.iceCandidateQueue.shift();
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.channel) {
        await this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "answer",
            viewerId: this.viewerId,
            sdp: this.peerConnection.localDescription,
          },
        });
      }
    } catch (err) {
      console.warn("[WebRTC Viewer] Error creating answer:", err);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange("failed");
      }
    }
  }

  _cleanupPeerConnection() {
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }
    this.iceCandidateQueue = [];
  }

  disconnect() {
    this.isConnected = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.channel) {
      try {
        this.channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "viewer-leave", viewerId: this.viewerId },
        });
      } catch (e) {}

      try {
        supabase.removeChannel(this.channel);
      } catch (e) {}
      this.channel = null;
    }

    this._cleanupPeerConnection();

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange("closed");
    }
  }
}
