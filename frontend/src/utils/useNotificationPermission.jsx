import { useState } from 'react';
import { getNotificationPermission, requestNotificationPermission } from './Notification';
import { toast } from 'react-toastify';

export const useNotificationPermission = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingCallback, setPendingCallback] = useState(null);

  const checkAndPromptPermission = (onGranted) => {
    const currentPermission = getNotificationPermission();

    if (currentPermission === 'granted') {
      if (onGranted) onGranted();
      return;
    }

    if (currentPermission === 'denied') {
      toast.info(
        'Browser notifications are blocked. Your reminder will still appear inside PulseOS while the app is open.',
      );
      if (onGranted) onGranted();
      return;
    }

    // Permission is 'default' -> show custom explanatory dialog first
    setPendingCallback(() => onGranted);
    setShowDialog(true);
  };

  const handleConfirmAllow = async () => {
    setShowDialog(false);
    const res = await requestNotificationPermission();
    if (res === 'denied') {
      toast.info(
        'Browser notifications are blocked. Your reminder will still appear inside PulseOS while the app is open.',
      );
    }
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  };

  const handleDismiss = () => {
    setShowDialog(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  };

  return {
    showDialog,
    checkAndPromptPermission,
    handleConfirmAllow,
    handleDismiss,
  };
};
