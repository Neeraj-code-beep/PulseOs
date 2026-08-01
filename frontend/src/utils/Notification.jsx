// Browser Notification API utility functions

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export const showBrowserNotification = ({ title, body, tag }) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  try {
    return new Notification(title, {
      body,
      tag: tag || undefined,
    });
  } catch (error) {
    console.error('Error showing browser notification:', error);
  }
};
