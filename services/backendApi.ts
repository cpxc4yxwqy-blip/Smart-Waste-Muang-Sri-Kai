/* Backend API helpers for push subscription management */

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

export async function sendSubscriptionToBackend(
  subscription: PushSubscription,
  userId: string,
  role: string = 'viewer'
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId, role })
    });
    const data = await response.json();
    console.log('[Backend] Subscription saved', data);
    return data.success;
  } catch (error) {
    console.error('[Backend] Failed to save subscription', error);
    return false;
  }
}

export async function removeSubscriptionFromBackend(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });
    const data = await response.json();
    console.log('[Backend] Subscription removed', data);
    return data.success;
  } catch (error) {
    console.error('[Backend] Failed to remove subscription', error);
    return false;
  }
}

export async function sendPushNotification(
  title: string,
  body: string,
  targetRoles?: string[]
): Promise<{ sent: number; failed: number }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, targetRoles })
    });
    const data = await response.json();
    console.log('[Backend] Push sent', data);
    return { sent: data.sent || 0, failed: data.failed || 0 };
  } catch (error) {
    console.error('[Backend] Failed to send push', error);
    return { sent: 0, failed: 0 };
  }
}
