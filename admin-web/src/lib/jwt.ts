import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'muyamagicsecret';

export function signToken(payload: object, expiresIn: string = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
