import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create Super Admin
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'admin@digitialpassport.com' },
    update: {},
    create: {
      email: 'admin@digitialpassport.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Super Admin created:', superAdmin)

  // Create Event
  const event = await prisma.event.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      name: 'Tech Summit 2024',
      description: 'Annual technology summit featuring innovations and demos',
      startDate: new Date('2024-06-20'),
      endDate: new Date('2024-06-22'),
      venue: 'Convention Center, San Francisco',
      themeColor: '#3B82F6',
      status: 'PUBLISHED',
    },
  })

  console.log('Event created:', event)

  // Create Event Admin
  const eventAdmin = await prisma.admin.upsert({
    where: { email: 'admin@techsummit.com' },
    update: {},
    create: {
      email: 'admin@techsummit.com',
      firstName: 'Event',
      lastName: 'Manager',
      password: await bcrypt.hash('Manager@123', 10),
      role: 'EVENT_ADMIN',
      eventId: event.id,
    },
  })

  console.log('Event Admin created:', eventAdmin)

  // Create Zones
  const zones = await Promise.all([
    prisma.zone.upsert({
      where: { qrSlug: 'hall-a' },
      update: {},
      create: {
        name: 'Hall A - Registration',
        description: 'Welcome and registration desk',
        qrSlug: 'hall-a',
        eventId: event.id,
        points: 10,
        active: true,
      },
    }),
    prisma.zone.upsert({
      where: { qrSlug: 'hall-b' },
      update: {},
      create: {
        name: 'Hall B - Product Demo',
        description: 'Live product demonstrations',
        qrSlug: 'hall-b',
        eventId: event.id,
        points: 15,
        active: true,
      },
    }),
    prisma.zone.upsert({
      where: { qrSlug: 'hall-c' },
      update: {},
      create: {
        name: 'Hall C - Keynote Stage',
        description: 'Main keynote presentations',
        qrSlug: 'hall-c',
        eventId: event.id,
        points: 20,
        active: true,
      },
    }),
    prisma.zone.upsert({
      where: { qrSlug: 'networking' },
      update: {},
      create: {
        name: 'Networking Lounge',
        description: 'Meet and greet with speakers and exhibitors',
        qrSlug: 'networking',
        eventId: event.id,
        points: 15,
        active: true,
      },
    }),
  ])

  console.log('Zones created:', zones.length)

  // Create Activities
  await Promise.all([
    prisma.activity.upsert({
      where: { zoneId: zones[0].id },
      update: {},
      create: {
        type: 'QUIZ',
        zoneId: zones[0].id,
        eventId: event.id,
        question: 'What is the name of this event?',
        answers: [
          { id: '1', text: 'Tech Summit 2024', isCorrect: true },
          { id: '2', text: 'Digital Expo 2024', isCorrect: false },
          { id: '3', text: 'Innovation Fair 2024', isCorrect: false },
          { id: '4', text: 'Tech Conference 2023', isCorrect: false },
        ],
      },
    }),
    prisma.activity.upsert({
      where: { zoneId: zones[1].id },
      update: {},
      create: {
        type: 'POLL',
        zoneId: zones[1].id,
        eventId: event.id,
        question: 'What is your primary interest?',
        pollOptions: [
          { id: '1', text: 'AI & Machine Learning' },
          { id: '2', text: 'Cloud Computing' },
          { id: '3', text: 'Cybersecurity' },
          { id: '4', text: 'Web Development' },
        ],
      },
    }),
    prisma.activity.upsert({
      where: { zoneId: zones[2].id },
      update: {},
      create: {
        type: 'SURVEY',
        zoneId: zones[2].id,
        eventId: event.id,
        question: 'Event feedback survey',
        surveyQuestions: [
          {
            id: '1',
            question: 'How would you rate the event?',
            type: 'rating',
          },
          {
            id: '2',
            question: 'What topics interest you most?',
            type: 'multiple_choice',
            options: ['AI', 'Cloud', 'Security', 'Web'],
          },
        ],
      },
    }),
    prisma.activity.upsert({
      where: { zoneId: zones[3].id },
      update: {},
      create: {
        type: 'RAFFLE',
        zoneId: zones[3].id,
        eventId: event.id,
        question: 'Enter our raffle draw!',
      },
    }),
  ])

  console.log('Activities created')

  // Create Points Configuration
  await prisma.pointsConfig.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      eventId: event.id,
      pointsPerZone: 10,
      pointsPerQuiz: 5,
      pointsPerPoll: 3,
      pointsPerSurvey: 8,
    },
  })

  // Create Registration Configuration
  await prisma.registrationConfig.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      eventId: event.id,
      requiredFields: ['firstName', 'lastName', 'email'],
      optionalFields: ['mobile', 'company', 'designation'],
      hiddenFields: [],
    },
  })

  // Create Event Settings
  await prisma.eventSettings.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      eventId: event.id,
      scanMode: 'UNLIMITED',
      enableNotifications: true,
      enableLeaderboard: true,
    },
  })

  // Create Sample Attendees
  const attendees = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: await bcrypt.hash('User@123', 10),
        mobile: '+1234567890',
        company: 'Tech Corp',
        designation: 'Software Engineer',
        eventId: event.id,
        role: 'ATTENDEE',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: await bcrypt.hash('User@123', 10),
        mobile: '+1987654321',
        company: 'Digital Solutions',
        designation: 'Product Manager',
        eventId: event.id,
        role: 'ATTENDEE',
      },
    }),
  ])

  console.log('Attendees created:', attendees.length)

  // Create Sample Scans
  await Promise.all([
    prisma.scan.create({
      data: {
        userId: attendees[0].id,
        zoneId: zones[0].id,
        eventId: event.id,
        pointsEarned: 10,
        completedAt: new Date(),
        device: 'Mobile',
        browser: 'Chrome',
      },
    }),
    prisma.scan.create({
      data: {
        userId: attendees[0].id,
        zoneId: zones[1].id,
        eventId: event.id,
        pointsEarned: 15,
        completedAt: new Date(),
        device: 'Mobile',
        browser: 'Safari',
      },
    }),
  ])

  console.log('Scans created')

  // Create Badges
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { id: 'badge-1' },
      update: {},
      create: {
        id: 'badge-1',
        name: 'Bronze Explorer',
        description: 'Visit 2 zones',
        eventId: event.id,
      },
    }),
    prisma.badge.upsert({
      where: { id: 'badge-2' },
      update: {},
      create: {
        id: 'badge-2',
        name: 'Silver Explorer',
        description: 'Visit 4 zones',
        eventId: event.id,
      },
    }),
  ])

  console.log('Badges created:', badges.length)

  // Create Rewards
  await prisma.reward.upsert({
    where: { id: 'reward-1' },
    update: {},
    create: {
      id: 'reward-1',
      name: 'Grand Prize',
      description: 'Exclusive tech gadget',
      pointsRequired: 100,
      eventId: event.id,
    },
  })

  console.log('Rewards created')

  console.log('Seed completed successfully!')
}

main()
  .catch(e => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
