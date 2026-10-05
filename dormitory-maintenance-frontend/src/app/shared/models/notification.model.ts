export type NotificationType = 'report.created' | 'report.updated' | 'supply.updated' | 'job.reassigned';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
