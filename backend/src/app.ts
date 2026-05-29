import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { initializeDatabase } from './config/database';
import { ENV } from './config/environment';
import { specs, swaggerUiOptions } from './config/swagger';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import propertyRoutes from './routes/propertyRoutes';
import rentalUnitRoutes from './routes/rentalUnitRoutes';
import leaseRoutes from './routes/leaseRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import messageRoutes from './routes/messageRoutes';
import announcementRoutes from './routes/announcementRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import uploadRoutes from './routes/uploadRoutes';
import downloadRoutes from './routes/downloadRoutes';

const app = express();
const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
];
const configuredAllowedOrigins = ENV.FRONTEND_URL
    ? ENV.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins]);

// Security middleware
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin) || (ENV.NODE_ENV === 'development' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'test' ? 10000 : 100, // much higher limit for tests
    message: JSON.stringify({ error: 'Too many requests from this IP, please try again later.' }),
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (ENV.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/units', rentalUnitRoutes);
app.use('/api/v1/leases', leaseRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/maintenance-requests', maintenanceRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/download', downloadRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
export async function startApp() {
    try {
        await initializeDatabase();

        app.listen(ENV.PORT, () => {
            console.log(`Server is running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
            console.log(`API documentation available at http://localhost:${ENV.PORT}/api-docs`);
            console.log(`Health check available at http://localhost:${ENV.PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

export default app;
