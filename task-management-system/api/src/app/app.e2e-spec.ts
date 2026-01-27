import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from './app.module';

describe('API E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    async function login(email: string, password: string) {
        const res = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password });

        return res;
    }

    it('POST /api/auth/login returns accessToken for valid user', async () => {
        const res = await login('admin@example.com', 'Password123!');
        expect(res.status).toBe(201);
        expect(res.body.accessToken).toBeDefined();
    });

    it('Viewer cannot create a task (403)', async () => {
        const loginRes = await login('viewer@example.com', 'Password123!');
        const token = loginRes.body.accessToken;

        const res = await request(app.getHttpServer())
            .post('/api/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Should fail' });

        expect(res.status).toBe(403);
    });

    it('Viewer cannot access audit log (403)', async () => {
        const loginRes = await login('viewer@example.com', 'Password123!');
        const token = loginRes.body.accessToken;

        const res = await request(app.getHttpServer())
            .get('/api/audit-log')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });
});