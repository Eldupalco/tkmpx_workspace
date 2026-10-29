// Run by scripts/verify-generator.mjs inside a scratch copy compiled to dist-check/.
// Boots the real AppModule (Prisma stubbed) with this project's global pipe, filter and
// interceptor, then checks generated endpoints over HTTP.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';

const dist = new URL('./dist-check/src/', `file://${process.cwd().replace(/\\/g, '/')}/`);
const load = (p) => import(new URL(p, dist).href);
const { AppModule } = await load('app.module.js');
const { PrismaService } = await load('prisma/prisma.service.js');
const { PrismaClientExceptionFilter } = await load('common/filters/prisma-client-exception.filter.js');
const { TransformInterceptor } = await load('common/interceptors/transform.interceptor.js');

const calls = [];
const rows = { ticket: { id: 1, title: 't', views: 5n, createdAt: new Date() } };
const fakePrisma = new Proxy({}, {
  get: (_, model) => new Proxy({}, {
    get: (__, op) => async (args) => {
      calls.push({ model, op, args });
      if (op === 'count') return 0;
      if (op === 'findMany') return [];
      if (op === 'findUnique') return rows[model] ?? null;
      // Like Prisma, ignore undefined values (DTO class fields exist even when not sent)
      const data = Object.fromEntries(Object.entries(args?.data ?? {}).filter(([, v]) => v !== undefined));
      return { ...rows[model], ...data };
    },
  }),
});

const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PrismaService).useValue(fakePrisma)
  .compile();
const app = moduleRef.createNestApplication({ logger: false });
app.useGlobalFilters(new PrismaClientExceptionFilter(app.get(HttpAdapterHost).httpAdapter));
app.useGlobalInterceptors(new TransformInterceptor());
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
await app.init();

const doc = SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build());
assert.ok(doc.paths['/ticket/{id}'], 'Swagger documents generated routes');

const secret = process.env.JWT_SECRET || 'tkpex-super-secret-jwt-key';
const jwt = app.get(JwtService);
const as = async (role) => ({ Authorization: `Bearer ${await jwt.signAsync({ sub: 'u1', role }, { secret })}` });
const user = await as('user');
const admin = await as('admin');
const http = request(app.getHttpServer());

const checks = [
  ['no token → 401', () => http.get('/ticket'), 401],
  ['user can read', () => http.get('/ticket').set(user), 200],
  ['user cannot create', () => http.post('/ticket').set(user).send({ title: 'a', projectId: 'p' }), 403],
  ['user cannot change a role', () => http.patch('/users/7c9e6679-7425-40de-944b-e07fc1f90ae7').set(user).send({ role: 'admin' }), 403],
  ['admin can create', () => http.post('/ticket').set(admin).send({ title: 'a', projectId: 'p' }), 201],
  ['unknown sortBy → 400', () => http.get('/ticket?sortBy=bogus').set(user), 400],
  ['bad Int id → 400', () => http.get('/ticket/abc').set(user), 400],
  ['bad UUID id → 400', () => http.get('/users/not-a-uuid').set(user), 400],
  ['client-supplied PK not editable → 400', () => http.patch('/audit-log/1').set(admin).send({ code: 99 }), 400],
];
for (const [label, send, expected] of checks) {
  const res = await send();
  assert.equal(res.status, expected, `${label}: got ${res.status} ${JSON.stringify(res.body)}`);
}

const bigint = await http.get('/ticket/1').set(user);
assert.equal(bigint.status, 200, `BigInt row → ${bigint.status}`);
assert.equal(bigint.body.data.views, '5', 'BigInt serialized as string');

calls.length = 0;
await http.get('/attendances').set(user);
const userSummary = calls.find((c) => c.op === 'findMany').args.select.users.select;
assert.ok(!('email' in userSummary), 'relation summaries exclude email');

await app.close();
console.log(`✔ HTTP probe: ${checks.length + 2} checks passed`);
