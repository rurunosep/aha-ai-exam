import postgres from 'postgres';

const options = process.env.NODE_ENV === 'production' ? {
  ssl: {
    rejectUnauthorized: false,
  },
} : {};

const sql = postgres(process.env.DATABASE_URL!, options);

export default sql;
