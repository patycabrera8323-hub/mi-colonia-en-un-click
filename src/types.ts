export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt: number; // timestamp in ms
  mcpLogs?: {
    type: 'info' | 'tool_call' | 'tool_response' | 'mcp_connected';
    message: string;
    timestamp: number;
  }[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  rating: number;
  address: string;
  image: string;
  phoneNumber: string;
  horario?: string;
  syncFromUser?: string;
}

export interface BacheReport {
  id: string;
  userId: string;
  description: string;
  address: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'alert' | 'success';
  date: string;
}
