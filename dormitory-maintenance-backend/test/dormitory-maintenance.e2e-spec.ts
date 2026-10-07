import { ReportStatus } from '@prisma/client';

process.env.DOCKER_HOST = process.env.DOCKER_HOST || 'unix:///run/user/1000/podman/podman.sock';
process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { io as ioClient, Socket } from 'socket.io-client';
import * as argon2 from 'argon2';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

describe('Dormitory Maintenance System (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let httpServer: any;
  let port: number;
  let container: StartedPostgreSqlContainer;

  let adminToken: string;
  let studentToken: string;
  let janitorToken: string;
  let studentId: string;
  let janitorId: string;
  let _adminId: string;

  let reportId: string;
  let jobId: string;
  let supplyRequestId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('dormitory_maintenance_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();

    execSync('npx prisma db push', {
      env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
      stdio: 'inherit',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    await app.listen(0);
    httpServer = app.getHttpServer();
    const address = httpServer.address();
    port = typeof address === 'object' && address ? address.port : 3000;

    // Clean up database tables
    await prisma.notification.deleteMany();
    await prisma.supplyRequest.deleteMany();
    await prisma.reportEvent.deleteMany();
    await prisma.job.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.report.deleteMany();
    await prisma.janitorSpecialization.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.activationToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await argon2.hash('Password123!');

    // Create Admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@dorm.com',
        passwordHash,
        role: 'administrator',
      },
    });
    _adminId = admin.id;

    // Create Student
    const student = await prisma.user.create({
      data: {
        name: 'Student User',
        email: 'student@dorm.com',
        passwordHash,
        role: 'student',
        roomNumber: '101A',
      },
    });
    studentId = student.id;

    // Create Janitor with plumbing specialization
    const janitor = await prisma.user.create({
      data: {
        name: 'Janitor Joe',
        email: 'janitor@dorm.com',
        passwordHash,
        role: 'janitor',
        specializations: {
          create: [{ category: 'plumbing' }],
        },
      },
    });
    janitorId = janitor.id;

    // Login Admin
    const adminLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@dorm.com', password: 'Password123!' });
    adminToken = adminLogin.body.accessToken;

    // Login Student
    const studentLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'student@dorm.com', password: 'Password123!' });
    studentToken = studentLogin.body.accessToken;

    // Login Janitor
    const janitorLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'janitor@dorm.com', password: 'Password123!' });
    janitorToken = janitorLogin.body.accessToken;
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
  });

  it('1. Should allow student to create a report', async () => {
    const res = await request(httpServer)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        category: 'plumbing',
        title: 'Leaking Faucet',
        description: 'Sink in room 101A is leaking continuously.',
        location: 'Room 101A Bathroom',
        severity: 'Medium',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Leaking Faucet');
    expect(res.body.status).toBe('Waiting');
    reportId = res.body.id;
  });

  it('2. Should allow janitor to accept job and prevent concurrent multiple active jobs', async () => {
    const res = await request(httpServer)
      .post(`/api/v1/reports/${reportId}/accept`)
      .set('Authorization', `Bearer ${janitorToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.janitorId).toBe(janitorId);
    jobId = res.body.id;

    // Attempting to accept another report while active job exists should conflict
    const report2 = await prisma.report.create({
      data: {
        studentId,
        category: 'plumbing',
        title: 'Clogged Drain',
        description: 'Shower drain clogged',
        location: 'Bathroom',
        severity: 'Low',
      },
    });

    await request(httpServer)
      .post(`/api/v1/reports/${report2.id}/accept`)
      .set('Authorization', `Bearer ${janitorToken}`)
      .expect(409);
  });

  it('3. Should allow janitor to update job status and request supplies', async () => {
    const updateRes = await request(httpServer)
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${janitorToken}`)
      .send({
        estimateMinutes: 45,
        status: ReportStatus.Repair_in_progress,
        comment: 'Working on replacing washer',
      })
      .expect(200);

    expect(updateRes.body.estimateMinutes).toBe(45);

    const supplyRes = await request(httpServer)
      .post(`/api/v1/jobs/${jobId}/supply-requests`)
      .set('Authorization', `Bearer ${janitorToken}`)
      .send({
        item: 'Rubber Washer',
        quantity: 2,
        justification: 'Worn out faucet washer needs replacement',
      })
      .expect(201);

    expect(supplyRes.body).toHaveProperty('id');
    expect(supplyRes.body.item).toBe('Rubber Washer');
    supplyRequestId = supplyRes.body.id;
  });

  it('4. Should allow administrator to update supply request and reassign job', async () => {
    const supplyUpdateRes = await request(httpServer)
      .patch(`/api/v1/supplies/${supplyRequestId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'ordered',
        arrivalAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(200);

    expect(supplyUpdateRes.body.status).toBe('ordered');

    const reassignRes = await request(httpServer)
      .post(`/api/v1/reports/${reportId}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        comment: 'Reassigning for administrative inspection',
      })
      .expect(200);

    expect(reassignRes.body.status).toBe('Waiting');
  });

  it('5. Should connect via WebSocket with JWT and receive real-time notifications', async () => {
    await new Promise<void>((resolve, reject) => {
      const clientSocket: Socket = ioClient(`http://localhost:${port}/ws`, {
        auth: { token: studentToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', async () => {
        // Trigger an event to test broadcasting
        await request(httpServer)
          .patch(`/api/v1/reports/${reportId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ severity: 'High', comment: 'Escalating severity' });
      });

      clientSocket.on('report.updated', (data) => {
        expect(data).toBeDefined();
        clientSocket.disconnect();
        resolve();
      });

      setTimeout(() => {
        clientSocket.disconnect();
        reject(new Error('WebSocket event timeout'));
      }, 3000);
    });
  });
});
