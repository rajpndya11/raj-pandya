export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  suggestedQuestions?: string[];
  timestamp: number;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  suggestedQuestions?: string[];
  error?: string;
}

export const chatService = {
  async sendMessage(messages: { role: string; content: string }[], currentPath?: string): Promise<ChatResponse> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          currentPath: currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/')
        })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with status ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('ChatService error:', err);
      return {
        success: false,
        error: err.message || 'Unable to connect to Portfolio AI. Please try again.'
      };
    }
  }
};
