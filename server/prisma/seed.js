import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';
import { ROLES, TRIP_STATUS } from '../config/constants.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.tripEvent.deleteMany();
  await prisma.busLocation.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.student.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // ========== CREATE USERS ==========
  const adminPassword = await hashPassword('admin123');
  const driverPassword = await hashPassword('driver123');
  const studentPassword = await hashPassword('student123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password Hash: adminPassword,
      role: ROLES.ADMIN,
      phone: '+1-555-0001',
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: 'driver@example.com',
      name: 'John Driver',
      passwordHash: driverPassword,
      role: ROLES.DRIVER,
      phone: '+1-555-0010',
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: 'driver2@example.com',
      name: 'Sarah Driver',
      passwordHash: driverPassword,
      role: ROLES.DRIVER,
      phone: '+1-555-0011',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student@example.com',
      name: 'Alice Student',
      passwordHash: studentPassword,
      role: ROLES.STUDENT,
      phone: '+1-555-0020',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      name: 'Bob Student',
      passwordHash: studentPassword,
      role: ROLES.STUDENT,
      phone: '+1-555-0021',
    },
  });

  console.log('✓ Created users');

  // ========== CREATE DRIVERS ==========
  const driverRecord1 = await prisma.driver.create({
    data: {
      userId: driver1.id,
      licenseNumber: 'DL-2024-001',
      licenseExpiry: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });

  const driverRecord2 = await prisma.driver.create({
    data: {
      userId: driver2.id,
      licenseNumber: 'DL-2024-002',
      licenseExpiry: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });

  console.log('✓ Created drivers');

  // ========== CREATE STUDENTS ==========
  await prisma.student.create({
    data: {
      userId: student1.id,
      studentId: 'STU-2024-001',
      department: 'Computer Science',
      year: 3,
    },
  });

  await prisma.student.create({
    data: {
      userId: student2.id,
      studentId: 'STU-2024-002',
      department: 'Engineering',
      year: 2,
    },
  });

  console.log('✓ Created students');

  // ========== CREATE BUSES ==========
  const bus1 = await prisma.bus.create({
    data: {
      busNumber: 'BUS-001',
      registrationNumber: 'RN-2024-001',
      capacity: 50,
      status: 'ACTIVE',
      active: true,
      assignedDriverId: driverRecord1.id,
    },
  });

  const bus2 = await prisma.bus.create({
    data: {
      busNumber: 'BUS-002',
      registrationNumber: 'RN-2024-002',
      capacity: 45,
      status: 'ACTIVE',
      active: true,
      assignedDriverId: driverRecord2.id,
    },
  });

  const bus3 = await prisma.bus.create({
    data: {
      busNumber: 'BUS-003',
      registrationNumber: 'RN-2024-003',
      capacity: 40,
      status: 'MAINTENANCE',
      active: false,
    },
  });

  console.log('✓ Created buses');

  // ========== CREATE BUS STOPS ==========
  const stop1 = await prisma.busStop.create({
    data: {
      name: 'Main Gate',
      latitude: 40.7128,
      longitude: -74.006,
      address: 'College Main Entrance',
      city: 'New York',
      zipcode: '10001',
    },
  });

  const stop2 = await prisma.busStop.create({
    data: {
      name: 'Library',
      latitude: 40.7135,
      longitude: -74.0055,
      address: 'Central Library Building',
      city: 'New York',
      zipcode: '10001',
    },
  });

  const stop3 = await prisma.busStop.create({
    data: {
      name: 'Science Building',
      latitude: 40.7142,
      longitude: -74.0048,
      address: 'Science and Tech Complex',
      city: 'New York',
      zipcode: '10001',
    },
  });

  const stop4 = await prisma.busStop.create({
    data: {
      name: 'Dormitory Area',
      latitude: 40.715,
      longitude: -74.008,
      address: 'Student Housing Zone',
      city: 'New York',
      zipcode: '10001',
    },
  });

  console.log('✓ Created bus stops');

  // ========== CREATE ROUTES ==========
  const route1 = await prisma.route.create({
    data: {
      name: 'North Campus Route',
      description: 'Route serving north campus buildings',
      active: true,
    },
  });

  const route2 = await prisma.route.create({
    data: {
      name: 'South Campus Route',
      description: 'Route serving south campus and dormitories',
      active: true,
    },
  });

  console.log('✓ Created routes');

  // ========== CREATE ROUTE STOPS ==========
  await prisma.routeStop.create({
    data: {
      routeId: route1.id,
      busStopId: stop1.id,
      stopOrder: 1,
      estimatedMinutes: 0,
      estimatedDistance: 0,
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: route1.id,
      busStopId: stop2.id,
      stopOrder: 2,
      estimatedMinutes: 5,
      estimatedDistance: 0.8,
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: route1.id,
      busStopId: stop3.id,
      stopOrder: 3,
      estimatedMinutes: 5,
      estimatedDistance: 1.2,
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: route2.id,
      busStopId: stop1.id,
      stopOrder: 1,
      estimatedMinutes: 0,
      estimatedDistance: 0,
    },
  });

  await prisma.routeStop.create({
    data: {
      routeId: route2.id,
      busStopId: stop4.id,
      stopOrder: 2,
      estimatedMinutes: 8,
      estimatedDistance: 2.1,
    },
  });

  console.log('✓ Created route stops');

  // ========== ASSIGN ROUTES TO BUSES ==========
  await prisma.bus.update({
    where: { id: bus1.id },
    data: { assignedRouteId: route1.id },
  });

  await prisma.bus.update({
    where: { id: bus2.id },
    data: { assignedRouteId: route2.id },
  });

  console.log('✓ Assigned routes to buses');

  // ========== CREATE SAMPLE TRIPS ==========
  const trip1 = await prisma.trip.create({
    data: {
      busId: bus1.id,
      driverId: driverRecord1.id,
      routeId: route1.id,
      status: TRIP_STATUS.COMPLETED,
      plannedStartTime: new Date(Date.now() - 3600000),
      actualStartTime: new Date(Date.now() - 3600000),
      actualEndTime: new Date(Date.now() - 1800000),
    },
  });

  // Add sample location data
  await prisma.busLocation.createMany({
    data: [
      {
        busId: bus1.id,
        tripId: trip1.id,
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        speed: 20,
        heading: 45,
        recordedAt: new Date(Date.now() - 3600000),
      },
      {
        busId: bus1.id,
        tripId: trip1.id,
        latitude: 40.7135,
        longitude: -74.0055,
        accuracy: 10,
        speed: 25,
        heading: 50,
        recordedAt: new Date(Date.now() - 3000000),
      },
      {
        busId: bus1.id,
        tripId: trip1.id,
        latitude: 40.7142,
        longitude: -74.0048,
        accuracy: 10,
        speed: 15,
        heading: 55,
        recordedAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log('✓ Created sample trips');

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Development Credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Driver: driver@example.com / driver123');
  console.log('  Student: student@example.com / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
