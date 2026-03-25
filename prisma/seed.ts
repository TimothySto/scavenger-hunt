import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const event = await prisma.event.upsert({
    where: { slug: 'spring-hunt' },
    update: {},
    create: {
      name: 'Spring Hunt',
      slug: 'spring-hunt',
      description: 'Local development test event',
      isActive: true,
    },
  })

  const checkpoints = [
    {
      name: 'Welcome Table',
      slug: 'welcome-table',
      qrCodeValue: 'spring-hunt-welcome-table',
      points: 10,
      clue: 'Start here',
    },
    {
      name: 'Library Entrance',
      slug: 'library-entrance',
      qrCodeValue: 'spring-hunt-library-entrance',
      points: 15,
      clue: 'Find the front entrance',
    },
    {
      name: 'Student Center',
      slug: 'student-center',
      qrCodeValue: 'spring-hunt-student-center',
      points: 20,
      clue: 'Look where students gather',
    },
  ]

  for (const checkpoint of checkpoints) {
    await prisma.checkpoint.upsert({
      where: { qrCodeValue: checkpoint.qrCodeValue },
      update: {},
      create: {
        ...checkpoint,
        eventId: event.id,
      },
    })
  }

  console.log('Seed complete.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })