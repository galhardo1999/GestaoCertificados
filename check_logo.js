const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.usuario.findFirst({
        where: {
            nome: {
                contains: 'JOSE WILSON MENDES BARROS ARACATUBA',
                mode: 'insensitive'
            }
        },
        select: {
            id: true,
            nome: true,
            urlLogo: true
        }
    })
    console.log(JSON.stringify(user, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
