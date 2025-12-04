
import { prisma } from './src/lib/prisma'

async function fixOrphanedData() {
    const teamMembers = await prisma.user.findMany({
        where: {
            masterUserId: { not: null }
        }
    })

    console.log('Fixing orphaned data...')
    for (const member of teamMembers) {
        if (!member.masterUserId) continue

        // Update Clients
        const clients = await prisma.client.updateMany({
            where: { userId: member.id },
            data: { userId: member.masterUserId }
        })

        if (clients.count > 0) {
            console.log(`Moved ${clients.count} clients from ${member.email} to master user.`)
        }

        // Update Certificates
        const certificates = await prisma.certificate.updateMany({
            where: { userId: member.id },
            data: { userId: member.masterUserId }
        })

        if (certificates.count > 0) {
            console.log(`Moved ${certificates.count} certificates from ${member.email} to master user.`)
        }
    }
    console.log('Done.')
}

fixOrphanedData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
