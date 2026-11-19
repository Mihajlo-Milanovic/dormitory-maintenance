import { describe, expect, it } from 'vitest';
import { mapNotification } from '@models/notification.mapper';

const base = {
  id: 'notification-1',
  userId: 'user-1',
  type: 'report.updated',
  createdAt: '2026-10-20T00:00:00Z',
  readAt: null,
  payload: { title: 'Leaking tap', status: 'Repair_in_progress' },
};

describe('notification mapping', () => {
  it('maps report and job payloads consistently and derives read state', () => {
    const expected = {
      id: base.id,
      userId: base.userId,
      type: base.type,
      createdAt: base.createdAt,
      title: 'Report updated',
      message: 'Leaking tap: Repair in progress.',
      isRead: false,
    };
    expect(mapNotification(base)).toEqual(expected);
    expect(mapNotification({ ...base, payload: { report: base.payload } })).toEqual(expected);
    expect(mapNotification({ ...base, readAt: base.createdAt })?.isRead).toBe(true);
  });

  it('maps supply and reassignment payloads without exposing JSON', () => {
    expect(
      mapNotification({
        ...base,
        type: 'supply.updated',
        payload: { item: 'Pipe', status: 'ordered' },
      })?.message,
    ).toBe('Pipe: ordered.');
    expect(mapNotification({ ...base, type: 'job.reassigned' })?.message).toBe(
      'Leaking tap was assigned to you.',
    );
    expect(mapNotification({ ...base, payload: { title: 42, message: {} } })?.message).toBe(
      'Maintenance report was updated.',
    );
  });

  it.each([
    null,
    {},
    { ...base, id: '' },
    { ...base, userId: '' },
    { ...base, type: 'connect' },
    { ...base, createdAt: 'invalid' },
    { ...base, readAt: undefined },
    { ...base, readAt: 'invalid' },
    { ...base, payload: [] },
    { ...base, payload: null },
    { id: 'report-1', title: 'Report', status: 'Waiting' },
  ])('rejects malformed or domain data: %j', (value) => {
    expect(mapNotification(value)).toBeNull();
  });
});
