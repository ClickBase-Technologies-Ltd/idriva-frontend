// utils/feedEvents.ts
export type FeedEvent = {
  type: 'post_created' | 'post_updated' | 'post_deleted' | 'job_created' | 'job_updated' | 'job_deleted' | 'comment_added' | 'comment_deleted' | 'like_toggled' | 'share_added';
  data: any;
  timestamp: string;
};

class FeedEventManager {
  private listeners: Map<string, Set<(event: FeedEvent) => void>> = new Map();

  // Subscribe to specific event types
  subscribe(eventTypes: string[], callback: (event: FeedEvent) => void) {
    eventTypes.forEach(type => {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)!.add(callback);
    });

    return () => {
      eventTypes.forEach(type => {
        this.listeners.get(type)?.delete(callback);
      });
    };
  }

  // Emit an event
  emit(event: FeedEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // For cross-component communication (e.g., when post is created)
  emitToWindow(event: FeedEvent) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('feed-update', { detail: event }));
    }
  }

  // Subscribe from window events
  subscribeFromWindow(eventTypes: string[], callback: (event: FeedEvent) => void) {
    if (typeof window === 'undefined') return () => {};

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<FeedEvent>;
      if (eventTypes.includes(customEvent.detail.type)) {
        callback(customEvent.detail);
      }
    };

    window.addEventListener('feed-update', handler);
    return () => window.removeEventListener('feed-update', handler);
  }
}

export const feedEventManager = new FeedEventManager();