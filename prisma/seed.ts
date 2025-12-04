import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10)

    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            id: 'demo-user-123',
            email: 'demo@example.com',
            name: 'Usuário Demo',
            password: hashedPassword,
        },
    })

    console.log('✅ Demo user created:', demoUser.email)
    console.log('   ID:', demoUser.id)
    console.log('   Email:', demoUser.email)
    console.log('   Password: demo123')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
