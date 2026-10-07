import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/dormitory_maintenance?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await argon2.hash('admin123!');

    await prisma.user.upsert({
        where: {
            email: 'admin@dorm.com',
        },
        update: {},
        create: {
            name: 'System Administrator',
            email: 'admin@dorm.com',
            passwordHash,
            role: 'administrator',
            active: true,
        },
    });

    console.log('Admin account ready: admin@dorm.com');
}

main().catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
