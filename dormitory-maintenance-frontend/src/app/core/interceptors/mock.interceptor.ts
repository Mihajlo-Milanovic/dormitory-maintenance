import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { Report } from '../../shared/models/report.model';
import { SupplyRequest } from '../../shared/models/supply.model';
import { User } from '../../shared/models/user.model';
import { AppNotification } from '../../shared/models/notification.model';

let mockReports: Report[] = [
  {
    id: 'rep-1',
    title: 'Leaking Faucet in Room 304',
    description: 'The kitchen sink faucet is dripping continuously and wasting water.',
    category: 'plumbing',
    location: 'Building A, Room 304',
    severity: 'Medium',
    status: 'Waiting',
    studentId: 'stu-1',
    studentName: 'Alice Student',
    events: [
      { id: 'ev-1', status: 'Waiting', createdAt: new Date().toISOString(), authorName: 'Alice Student', comment: 'Report created' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rep-2',
    title: 'Power Outlet Sparking in Hallway',
    description: 'The wall socket near the 2nd floor elevator sparked when plugging in a vacuum.',
    category: 'electrical',
    location: 'Building B, 2nd Floor Corridor',
    severity: 'Critical',
    status: 'Accepted',
    studentId: 'stu-2',
    studentName: 'Bob Student',
    janitorId: 'jan-1',
    janitorName: 'John Janitor',
    timeEstimateMinutes: 45,
    events: [
      { id: 'ev-2', status: 'Waiting', createdAt: new Date().toISOString(), authorName: 'Bob Student' },
      { id: 'ev-3', status: 'Accepted', createdAt: new Date().toISOString(), authorName: 'John Janitor' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rep-3',
    title: 'Broken Heater Thermostat',
    description: 'Radiator in room 102 does not respond to temperature adjustments.',
    category: 'heating',
    location: 'Building A, Room 102',
    severity: 'High',
    status: 'Waiting for supplies',
    studentId: 'stu-3',
    studentName: 'Charlie Student',
    janitorId: 'jan-1',
    janitorName: 'John Janitor',
    timeEstimateMinutes: 60,
    events: [
      { id: 'ev-4', status: 'Waiting for supplies', createdAt: new Date().toISOString(), authorName: 'John Janitor', comment: 'Waiting for replacement valve' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let mockSupplies: SupplyRequest[] = [
  {
    id: 'sup-1',
    reportId: 'rep-3',
    janitorId: 'jan-1',
    janitorName: 'John Janitor',
    item: 'Thermostat Valve Assembly',
    quantity: 1,
    justification: 'Replacement for broken radiator valve in room 102.',
    status: 'Ordered',
    arrivalAt: 'Tomorrow 10:00 AM',
    createdAt: new Date().toISOString(),
  }
];

let mockUsers: User[] = [
  { id: 'stu-1', email: 'student@dorm.edu', name: 'Alice Student', role: 'student', isActive: true, createdAt: new Date().toISOString() },
  { id: 'jan-1', email: 'janitor@dorm.edu', name: 'John Janitor', role: 'janitor', specialization: 'plumbing', isActive: true, createdAt: new Date().toISOString() },
  { id: 'adm-1', email: 'admin@dorm.edu', name: 'Admin User', role: 'admin', isActive: true, createdAt: new Date().toISOString() },
];

let mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'jan-1',
    title: 'New High Priority Report',
    message: 'Electrical issue reported in Building B.',
    type: 'report.created',
    isRead: false,
    createdAt: new Date().toISOString(),
  }
];

export const mockInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const url = req.url;
      const method = req.method;

      if (url.includes('auth/login') && method === 'POST') {
        const body = req.body as any;
        const email = body?.email || 'student@dorm.edu';
        let matchedUser = mockUsers.find(u => u.email === email);
        if (!matchedUser) {
          matchedUser = mockUsers[0];
        }
        return of(new HttpResponse({
          status: 200,
          body: {
            accessToken: 'mock-jwt-token-xyz',
            refreshToken: 'mock-refresh-token-xyz',
            user: matchedUser,
          }
        })).pipe(delay(300));
      }

      if (url.includes('reports/open') && method === 'GET') {
        const openReports = mockReports.filter(r => r.status === 'Waiting');
        return of(new HttpResponse({ status: 200, body: openReports })).pipe(delay(200));
      }
      if (url.includes('reports/janitor') && method === 'GET') {
        const janitorJobs = mockReports.filter(r => r.janitorId === 'jan-1');
        return of(new HttpResponse({ status: 200, body: janitorJobs })).pipe(delay(200));
      }
      if (url.includes('reports') && method === 'GET') {
        return of(new HttpResponse({ status: 200, body: mockReports })).pipe(delay(200));
      }

      if (url.endsWith('reports') && method === 'POST') {
        const body = req.body as any;
        const newReport: Report = {
          id: 'rep-' + (mockReports.length + 1),
          title: body.title,
          description: body.description,
          category: body.category,
          location: body.location,
          severity: body.severity,
          status: 'Waiting',
          studentId: 'stu-1',
          studentName: 'Alice Student',
          events: [{ id: 'ev-' + Date.now(), status: 'Waiting', createdAt: new Date().toISOString(), authorName: 'Alice Student', comment: 'Report submitted' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockReports.unshift(newReport);
        return of(new HttpResponse({ status: 201, body: newReport })).pipe(delay(300));
      }

      if (url.includes('/accept') && method === 'POST') {
        const parts = url.split('/');
        const id = parts[parts.length - 2];
        const report = mockReports.find(r => r.id === id);
        if (report) {
          report.status = 'Accepted';
          report.janitorId = 'jan-1';
          report.janitorName = 'John Janitor';
          report.events.push({ id: 'ev-' + Date.now(), status: 'Accepted', createdAt: new Date().toISOString(), authorName: 'John Janitor' });
        }
        return of(new HttpResponse({ status: 200, body: report })).pipe(delay(200));
      }

      if (url.includes('/estimate') && method === 'POST') {
        const parts = url.split('/');
        const id = parts[parts.length - 2];
        const body = req.body as any;
        const report = mockReports.find(r => r.id === id);
        if (report) {
          report.timeEstimateMinutes = body.minutes;
        }
        return of(new HttpResponse({ status: 200, body: report })).pipe(delay(200));
      }

      if (url.includes('/status') && method === 'POST') {
        const parts = url.split('/');
        const id = parts[parts.length - 2];
        const body = req.body as any;
        const report = mockReports.find(r => r.id === id);
        if (report) {
          report.status = body.status;
          report.events.push({ id: 'ev-' + Date.now(), status: body.status, createdAt: new Date().toISOString(), authorName: 'John Janitor', comment: body.comment });
        }
        return of(new HttpResponse({ status: 200, body: report })).pipe(delay(200));
      }

      if (url.includes('/resume') && method === 'POST') {
        const parts = url.split('/');
        const id = parts[parts.length - 2];
        const report = mockReports.find(r => r.id === id);
        if (report) {
          report.status = 'Repair in progress';
          report.events.push({ id: 'ev-' + Date.now(), status: 'Repair in progress', createdAt: new Date().toISOString(), authorName: 'John Janitor', comment: 'Resumed after supplies delivery' });
        }
        return of(new HttpResponse({ status: 200, body: report })).pipe(delay(200));
      }

      if (url.includes('supplies') && method === 'GET') {
        return of(new HttpResponse({ status: 200, body: mockSupplies })).pipe(delay(200));
      }
      if (url.includes('supplies') && method === 'POST') {
        const body = req.body as any;
        const newReq: SupplyRequest = {
          id: 'sup-' + (mockSupplies.length + 1),
          reportId: body.reportId,
          janitorId: 'jan-1',
          janitorName: 'John Janitor',
          item: body.item,
          quantity: body.quantity,
          justification: body.justification,
          status: 'Requested',
          createdAt: new Date().toISOString(),
        };
        mockSupplies.unshift(newReq);
        const report = mockReports.find(r => r.id === body.reportId);
        if (report) {
          report.status = 'Waiting for supplies';
        }
        return of(new HttpResponse({ status: 201, body: newReq })).pipe(delay(300));
      }
      if (url.includes('supplies/') && method === 'PATCH') {
        const parts = url.split('/');
        const id = parts[parts.length - 1];
        const body = req.body as any;
        const sup = mockSupplies.find(s => s.id === id);
        if (sup) {
          sup.status = body.status;
          if (body.arrivalAt !== undefined) sup.arrivalAt = body.arrivalAt;
        }
        return of(new HttpResponse({ status: 200, body: sup })).pipe(delay(200));
      }

      if (url.includes('users') && method === 'GET') {
        return of(new HttpResponse({ status: 200, body: mockUsers })).pipe(delay(200));
      }
      if (url.endsWith('users') && method === 'POST') {
        const body = req.body as any;
        const newUser: User = {
          id: 'usr-' + (mockUsers.length + 1),
          email: body.email,
          name: body.name,
          role: body.role,
          specialization: body.specialization,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        mockUsers.unshift(newUser);
        return of(new HttpResponse({ status: 201, body: newUser })).pipe(delay(300));
      }

      if (url.includes('notifications') && method === 'GET') {
        return of(new HttpResponse({ status: 200, body: mockNotifications })).pipe(delay(200));
      }
      if (url.includes('notifications/') && method === 'PATCH') {
        const parts = url.split('/');
        const id = parts[parts.length - 2];
        const notif = mockNotifications.find(n => n.id === id);
        if (notif) notif.isRead = true;
        return of(new HttpResponse({ status: 200, body: notif })).pipe(delay(100));
      }

      return throwError(() => error);
    })
  );
};
