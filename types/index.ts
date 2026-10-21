export type UserStatus = "online" | "offline" | "away" | "busy";

export interface User {
  id: string;
  name: string;
  userNumber: string; // e.g. "849201"
  email: string;
  avatarUrl?: string;
  status: UserStatus;
  lastSeen?: string;
  role?: "owner" | "admin" | "member";
  bio?: string;
  joinedDate?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status: "sent" | "delivered" | "read";
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  audioWaveform?: number[];
  audioDuration?: string;
  photosStack?: string[];
  photosCount?: number;
  attachment?: {
    type: "image" | "file" | "location";
    url?: string;
    fileName?: string;
    fileSize?: string;
    locationName?: string;
  };
}

export interface Conversation {
  id: string;
  type: "direct" | "project";
  participant: User;
  lastMessage: {
    text: string;
    timestamp: string;
    isOutgoing: boolean;
    status?: "sent" | "delivered" | "read";
    hasPhotoMedia?: boolean;
  };
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed" | "on_hold";
  owner: User;
  memberCount: number;
  members: User[];
  lastActivity: string;
  websiteUrl?: string;
  repoUrl?: string;
  coverGradient?: string;
}

export interface CallRecord {
  id: string;
  participant: User;
  type: "audio" | "video";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
  duration?: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  size: string;
  category: "document" | "media" | "code" | "archive";
  uploadedBy: User;
  uploadedAt: string;
}

export interface AppNotification {
  id: string;
  type: "message" | "project_invite" | "call_missed" | "connection_request" | "system";
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
  actionUrl?: string;
}
