import bcrypt from 'bcryptjs';

export const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, 10);
export const comparePassword = (plainPassword, passwordHash) => bcrypt.compare(plainPassword, passwordHash);
