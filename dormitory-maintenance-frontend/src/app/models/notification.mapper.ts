import { AppNotification, NotificationType } from '@models/notification.model';

export const notificationTypes: NotificationType[] = [
  'report.created',
  'report.updated',
  'supply.updated',
  'job.reassigned',
];

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

/** Accept persisted backend notifications, never raw report/job/supply broadcasts. */
export function mapNotification(value: unknown): AppNotification | null {
  if (
    !record(value) ||
    !text(value['id']) ||
    !text(value['userId']) ||
    !notificationTypes.includes(value['type'] as NotificationType) ||
    !timestamp(value['createdAt']) ||
    !(value['readAt'] === null || timestamp(value['readAt'])) ||
    !record(value['payload'])
  )
    return null;

  const type = value['type'] as NotificationType;
  const payload = value['payload'];
  const report = record(payload['report']) ? payload['report'] : payload;
  const label = text(report['title']) ?? 'Maintenance report';
  const status = text(report['status'])?.replaceAll('_', ' ');
  const defaults: Record<NotificationType, { title: string; message: string }> = {
    'report.created': { title: 'New maintenance report', message: `${label} was reported.` },
    'report.updated': {
      title: 'Report updated',
      message: status ? `${label}: ${status}.` : `${label} was updated.`,
    },
    'job.reassigned': { title: 'Job reassigned', message: `${label} was assigned to you.` },
    'supply.updated': {
      title: 'Supply request updated',
      message: `${text(payload['item']) ?? 'Supply request'}: ${text(payload['status'])?.replaceAll('_', ' ') ?? 'updated'}.`,
    },
  };

  return {
    id: value['id'] as string,
    userId: value['userId'] as string,
    type,
    // A report's title is domain data, not a notification heading.
    title: defaults[type].title,
    message: text(payload['message']) ?? defaults[type].message,
    isRead: value['readAt'] !== null,
    createdAt: value['createdAt'],
  };
}

/** Notifications are immutable except for read state, which only advances. */
export function mergeNotifications(
  current: AppNotification[],
  incoming: AppNotification[],
): AppNotification[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    byId.set(item.id, { ...item, isRead: item.isRead || !!byId.get(item.id)?.isRead });
  }
  return [...byId.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
  );
}
