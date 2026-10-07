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
    const makeRequest = async () => {
      return await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages,
          currentPath: currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/')
        })
      });
    };

    try {
      let res = await makeRequest();

      // Retry once after 600ms if 404/502/503/504 (e.g. during server reload or warmup)
      if (!res.ok && (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504)) {
        await new Promise(r => setTimeout(r, 600));
        res = await makeRequest();
      }

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
