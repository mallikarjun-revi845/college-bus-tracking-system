import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  return bcryptjs.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};
