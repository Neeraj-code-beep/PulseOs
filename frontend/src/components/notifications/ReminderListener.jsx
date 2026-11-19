import { useEffect, useContext } from 'react';
import { useSocket } from '../../context/useSocket';
import { TodoContext } from '../../context/TodoContext';
import { showBrowserNotification } from '../../utils/Notification';
import { toast } from 'react-toastify';
import { registerReminderHandler } from '../../utils/taskUtils';

export const ReminderListener = () => {
  const { socket } = useSocket();
  const { markReminderSentLocally } = useContext(TodoContext);

  useEffect(() => {
    if (!socket) return;

    return registerReminderHandler(socket, (payload) => {
      // 1. Synchronize local Todo state so reminder is marked sent
      if (markReminderSentLocally) {
        markReminderSentLocally(payload.id);
      }

      // 2. In-app toast fallback
      toast.info(`🔔 Reminder: ${payload.title}`, {
        autoClose: 6000,
      });

      // 3. System browser notification with tag deduplication
      showBrowserNotification({
        title: 'PulseOS Reminder',
        body: payload.title,
        tag: `todo-reminder-${payload.id}`,
      });
    });
  }, [socket, markReminderSentLocally]);

  return null;
};
