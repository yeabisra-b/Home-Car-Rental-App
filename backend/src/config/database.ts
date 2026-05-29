import { Sequelize } from 'sequelize';
import { ENV } from './environment';
import { initializeModels } from '../database/models';
import { resetDatabaseSchema, runMigrations } from '../database/migrator';

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    database: ENV.DB_NAME,
    username: ENV.DB_USER,
    password: ENV.DB_PASSWORD,
    logging: ENV.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
        ssl: false,
        // Force TCP connection instead of Unix socket
        // This helps avoid peer authentication issues
    },
});

export { sequelize };

export const models = initializeModels(sequelize);

export async function initializeDatabase() {
    try {
        await sequelize.authenticate();

        await runMigrations(sequelize);
    } catch (error) {
        throw error;
    }
}

export async function prepareDatabaseForTests(): Promise<void> {
    await sequelize.authenticate();
    await resetDatabaseSchema(sequelize);
    await runMigrations(sequelize);
}

export async function closeDatabaseConnection() {
    try {
        await sequelize.close();
    } catch (error) {
        throw error;
    }
}
