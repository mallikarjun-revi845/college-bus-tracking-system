import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

const seedDemoData = async () => {
  if ((await prisma.user.count()) > 0) {
    console.log('Seed: users already exist, skipping');
    return;
  }

  const hash = (p) => bcrypt.hashSync(p, 10);

  const admin = await prisma.user.create({ data: { name: 'Admin User', email: 'admin@example.com', password: hash('AdminPass123!'), role: 'admin', phone: '0000000000' } });

  const drivers = [];
  for (let i = 1; i <= 3; i++) {
    const u = await prisma.user.create({ data: { name: `Driver ${i}`, email: `driver${i}@example.com`, password: hash('DriverPass123!'), role: 'driver' } });
    const d = await prisma.driver.create({ data: { userId: u.id, licenseNumber: `LIC-${i}`, contactNumber: '9999999999' } });
    drivers.push({ user: u, driver: d });
  }

  const students = [];
  for (let i = 1; i <= 20; i++) {
    const u = await prisma.user.create({ data: { name: `Student ${i}`, email: `student${i}@example.com`, password: hash('StudentPass123!'), role: 'student' } });
    const s = await prisma.student.create({ data: { userId: u.id, studentId: `S${1000 + i}`, department: 'Engineering', year: 2 } });
    students.push({ user: u, student: s });
  }

  const route1 = await prisma.route.create({ data: { name: 'North Loop', code: 'NL-01', startLocation: 'Main Gate', endLocation: 'Hostel Block', distanceKm: 6.8, durationMinutes: 20 } });
  const route2 = await prisma.route.create({ data: { name: 'City Route', code: 'CR-02', startLocation: 'Admin Block', endLocation: 'Research Park', distanceKm: 9.1, durationMinutes: 26 } });
  const route3 = await prisma.route.create({ data: { name: 'South Loop', code: 'SL-03', startLocation: 'Library', endLocation: 'Sports Complex', distanceKm: 5.2, durationMinutes: 18 } });

  // stops
  const stops = [];
  stops.push(await prisma.stop.create({ data: { name: 'Main Gate', latitude: 12.9716, longitude: 77.5946, address: 'Gate' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Library', latitude: 12.9727, longitude: 77.5938, address: 'Library' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Cafeteria', latitude: 12.9739, longitude: 77.5951, address: 'Cafe' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Hostel Block', latitude: 12.9751, longitude: 77.5965, address: 'Hostel' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Admin Block', latitude: 12.9705, longitude: 77.5918, address: 'Admin' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Science Block', latitude: 12.9698, longitude: 77.5929, address: 'Science' } }));
  stops.push(await prisma.stop.create({ data: { name: 'IT Hub', latitude: 12.9686, longitude: 77.5944, address: 'IT' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Research Park', latitude: 12.9665, longitude: 77.5969, address: 'Research' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Sports Complex', latitude: 12.9655, longitude: 77.5910, address: 'Sports' } }));
  stops.push(await prisma.stop.create({ data: { name: 'Engineering Block', latitude: 12.9710, longitude: 77.5930, address: 'Engineering' } }));

  // routeStops for route1
  await prisma.routeStop.createMany({ data: [
    { routeId: route1.id, stopId: stops[0].id, stopOrder: 1 },
    { routeId: route1.id, stopId: stops[1].id, stopOrder: 2 },
    { routeId: route1.id, stopId: stops[2].id, stopOrder: 3 },
    { routeId: route1.id, stopId: stops[3].id, stopOrder: 4 }
  ]});

  // routeStops for route2
  await prisma.routeStop.createMany({ data: [
    { routeId: route2.id, stopId: stops[4].id, stopOrder: 1 },
    { routeId: route2.id, stopId: stops[5].id, stopOrder: 2 },
    { routeId: route2.id, stopId: stops[6].id, stopOrder: 3 },
    { routeId: route2.id, stopId: stops[7].id, stopOrder: 4 }
  ]});

  // routeStops for route3
  await prisma.routeStop.createMany({ data: [
    { routeId: route3.id, stopId: stops[1].id, stopOrder: 1 },
    { routeId: route3.id, stopId: stops[9].id, stopOrder: 2 },
    { routeId: route3.id, stopId: stops[8].id, stopOrder: 3 }
  ]});

  // buses
  const bus1 = await prisma.bus.create({ data: { registrationNumber: 'BUS-101', name: 'Bus 101', capacity: 40, status: 'active', routeId: route1.id, driverId: drivers[0].driver.id } });
  const bus2 = await prisma.bus.create({ data: { registrationNumber: 'BUS-202', name: 'Bus 202', capacity: 35, status: 'active', routeId: route2.id, driverId: drivers[1].driver.id } });
  const bus3 = await prisma.bus.create({ data: { registrationNumber: 'BUS-303', name: 'Bus 303', capacity: 30, status: 'active', routeId: route3.id, driverId: drivers[2].driver.id } });

  // assignments
  await prisma.assignment.create({ data: { busId: bus1.id, driverId: drivers[0].driver.id, routeId: route1.id, effectiveFrom: new Date(Date.now() - 7 * 24 * 3600 * 1000), status: 'active' } });
  await prisma.assignment.create({ data: { busId: bus2.id, driverId: drivers[1].driver.id, routeId: route2.id, effectiveFrom: new Date(Date.now() - 7 * 24 * 3600 * 1000), status: 'active' } });
  await prisma.assignment.create({ data: { busId: bus3.id, driverId: drivers[2].driver.id, routeId: route3.id, effectiveFrom: new Date(Date.now() - 7 * 24 * 3600 * 1000), status: 'active' } });

  // sample trips
  await prisma.trip.create({ data: { busId: bus1.id, routeId: route1.id, driverId: drivers[0].driver.id, status: 'completed', startTime: new Date(Date.now() - 3600 * 1000), endTime: new Date(Date.now() - 1800 * 1000), distanceKm: 6.5 } });
  await prisma.trip.create({ data: { busId: bus2.id, routeId: route2.id, driverId: drivers[1].driver.id, status: 'completed', startTime: new Date(Date.now() - 7200 * 1000), endTime: new Date(Date.now() - 5400 * 1000), distanceKm: 9.0 } });

  console.log('Seeding complete');
};

seedDemoData()
  .catch((err) => console.error('Seeding error', err))
  .finally(async () => await prisma.$disconnect());
