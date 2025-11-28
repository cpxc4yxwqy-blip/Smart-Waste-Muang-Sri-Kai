/* Web Push Subscription Helpers */

// Vite provides import.meta.env but TS may need declaration; cast to any for env access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeUser(userId?: string, role?: string): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    alert('Missing VAPID public key (VITE_VAPID_PUBLIC_KEY)');
    return null;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Notification permission denied');
    return null;
  }
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  console.log('[Push] New subscription', JSON.stringify(sub));
  try { localStorage.setItem('push_subscription', JSON.stringify(sub)); } catch {}
  
  // Send to backend (non-blocking)
  const { sendSubscriptionToBackend } = await import('./backendApi');
  sendSubscriptionToBackend(sub, userId || 'anonymous', role || 'viewer').catch(console.error);
  
  alert('สมัครรับการแจ้งเตือนสำเร็จ');
  return sub;
}

export async function unsubscribeUser(): Promise<boolean> {
  const sub = await getExistingSubscription();
  if (!sub) return false;
  const success = await sub.unsubscribe();
  if (success) {
    localStorage.removeItem('push_subscription');
    
    // Remove from backend
    const { removeSubscriptionFromBackend } = await import('./backendApi');
    removeSubscriptionFromBackend(sub.endpoint).catch(console.error);
    
    alert('ยกเลิกการรับแจ้งเตือนแล้ว');
  }
  return success;
}
