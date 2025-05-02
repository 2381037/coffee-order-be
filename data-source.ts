// src/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config(); // Load .env file variables into process.env

const host = process.env.POSTGRES_HOST;
const port = process.env.POSTGRES_PORT
  ? parseInt(process.env.POSTGRES_PORT, 10)
  : 5432;
const username = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DATABASE;

if (!host || !username || !password || !database) {
  console.error(
    'FATAL ERROR: Missing one or more required PostgreSQL environment variables (POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE)',
  );
  process.exit(1);
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: host,
  port: port,
  username: username,
  password: password,
  database: database,
  // Path entities juga perlu disesuaikan jika struktur src dipertahankan
  entities: ['dist/src/**/*.entity{.js,.ts}'], // <-- Sesuaikan path entities
  // FIX: Ubah path migrations agar menunjuk ke lokasi yang benar di dalam dist
  migrations: ['dist/src/migrations/*{.js,.ts}'], // <-- Path yang benar
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
  ssl: {
    rejectUnauthorized: false, // Untuk Neon/Vercel
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
