export async function requestNotifications() {
  if (!("Notification" in window)) {
    return { supported: false, granted: false };
  }
  if (Notification.permission === 'granted') {
    return { supported: true, granted: true };
  }
  if (Notification.permission === 'denied') {
    return { supported: true, granted: false };
  }
  const perm = await Notification.requestPermission();
  return { supported: true, granted: perm === 'granted' };
}
