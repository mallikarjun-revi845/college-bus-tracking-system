import prisma from '../config/db.js';

const seedDemoData = async () => {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  await prisma.user.createMany({
    data: [
      { name: 'Admin User', email: 'admin@example.com', password: '$2a$10$XrCgOCXl7f8opbD6nkYJr.XByfM26v7RB4C9ZfR1iT5D4kF2nnL6G', role: 'admin' },
      { name: 'Driver One', email: 'driver@example.com', password: '$2a$10$XrCgOCXl7f8opbD6nkYJr.XByfM26v7RB4C9ZfR1iT5D4kF2nnL6G', role: 'driver' },
      { name: 'Student One', email: 'student@example.com', password: '$2a$10$XrCgOCXl7f8opbD6nkYJr.XByfM26v7RB4C9ZfR1iT5D4kF2nnL6G', role: 'student' }
    ]
  });
};

seedDemoData()
  .then(() => console.log('Seeding complete'))
  .catch((error) => console.error(error))
  .finally(async () => {
    await prisma.$disconnect();
  });
