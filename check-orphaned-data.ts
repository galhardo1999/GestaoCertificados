
import { prisma } from './src/lib/prisma'

async function checkOrphanedData() {
    const teamMembers = await prisma.user.findMany({
        where: {
            masterUserId: { not: null }
        },
        include: {
            _count: {
                select: {
                    clients: true,
                    certificates: true
                }
            }
        }
    })

    console.log('Checking for orphaned data...')
    let foundOrphans = false
    for (const member of teamMembers) {
        if (member._count.clients > 0 || member._count.certificates > 0) {
            foundOrphans = true
            console.log(`User ${member.email} (ID: ${member.id}) has orphaned data:`)
            console.log(`- Clients: ${member._count.clients}`)
            console.log(`- Certificates: ${member._count.certificates}`)
            console.log(`Should belong to Master User ID: ${member.masterUserId}`)
        }
    }

    if (!foundOrphans) {
        console.log('No orphaned data found.')
    }
}

checkOrphanedData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
