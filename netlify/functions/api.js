// netlify/functions/api.js - Optimierte Version für Health Tracker Pro

const mongoose = require('mongoose');

let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        console.log('✅ Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        console.log('🔄 Connecting to MongoDB...');
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            dbName: 'health-tracker',
            bufferCommands: false,
            maxPoolSize: 10
        });
        cachedConnection = connection;
        console.log('✅ MongoDB connected to database: health-tracker');
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
}

// VERBESSERTE SCHEMAS mit Index-Optimierung
const healthDataSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    weight: { type: Number, min: 0 },
    steps: { type: Number, min: 0 },
    waterIntake: { type: Number, min: 0 },
    sleepHours: { type: Number, min: 0, max: 24 },
    mood: {
        type: String,
        enum: ['excellent', 'good', 'neutral', 'bad', 'terrible']
    },
    notes: String,
    // NEUE FELDER für bessere Client-Integration
    _localId: String, // Für Offline-Sync
    _synced: { type: Boolean, default: true },
    submissionId: String, // Duplicate Prevention
    createdAt: { type: Date, default: Date.now }
});

// Compound Index für Performance
healthDataSchema.index({ userId: 1, date: -1 });
healthDataSchema.index({ userId: 1, createdAt: -1 });

const goalsSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    weightGoal: { type: Number, min: 0 },
    stepsGoal: { type: Number, min: 0, default: 10000 },
    waterGoal: { type: Number, min: 0, default: 2.0 },
    sleepGoal: { type: Number, min: 0, max: 24, default: 8 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const HealthData = mongoose.models.HealthData ||
    mongoose.model('HealthData', healthDataSchema, 'healthdatas');

const Goals = mongoose.models.Goals ||
    mongoose.model('Goals', goalsSchema, 'goals');

// VERBESSERTE HAUPTFUNKTION
const handler = async (event, context) => {
    // Serverless Context Optimierung
    context.callbackWaitsForEmptyEventLoop = false;
    
    let { httpMethod, path, queryStringParameters } = event;

    // Path Normalization
    if (path.startsWith('/.netlify/functions/api')) {
        path = path.replace('/.netlify/functions/api', '');
    }
    if (path.startsWith('/api/')) {
        path = path.replace('/api', '');
    }
    if (path === '') path = '/';

    console.log(`📞 API Handler: ${httpMethod} ${path}`);

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Cache-Control': 'no-cache'
    };

    // OPTIONS Request
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // ROOT PATH - Function Status
        if (httpMethod === 'GET' && path === '/') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Health Tracker Pro API v2.1.0',
                    status: 'operational',
                    timestamp: new Date().toISOString(),
                    database: process.env.MONGODB_URI ? 'connected' : 'not configured',
                    routes: {
                        health: 'GET /health',
                        testDb: 'GET /test-db',
                        healthData: {
                            get: 'GET /health-data/{userId}',
                            post: 'POST /health-data',
                            aggregated: 'GET /health-data-aggregated/{userId}'
                        },
                        goals: {
                            get: 'GET /goals/{userId}',
                            post: 'POST /goals'
                        }
                    }
                })
            };
        }

        // Health Check Route - ERWEITERT
        if (httpMethod === 'GET' && (path === '/health' || path.endsWith('/health'))) {
            try {
                await connectToDatabase();
                const dbStats = await mongoose.connection.db.stats();
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        api: {
                            version: '2.1.0',
                            environment: process.env.NODE_ENV || 'production'
                        },
                        database: {
                            connected: mongoose.connection.readyState === 1,
                            name: 'health-tracker',
                            collections: dbStats.collections || 0,
                            dataSize: `${Math.round(dbStats.dataSize / 1024)}KB`
                        },
                        performance: {
                            uptime: process.uptime(),
                            memoryUsage: process.memoryUsage()
                        }
                    })
                };
            } catch (error) {
                return {
                    statusCode: 503,
                    headers,
                    body: JSON.stringify({
                        status: 'unhealthy',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    })
                };
            }
        }

        // MongoDB Connection für Datenoperationen
        await connectToDatabase();

        // GOALS ROUTES - Verbessert
        if (httpMethod === 'GET' && path.match(/^\/goals\/([^\/]+)$/)) {
            const userId = path.split('/')[2];
            console.log(`🎯 Fetching goals for user: ${userId}`);
            
            const goals = await Goals.findOne({ userId }).lean();
            
            // Fallback mit Default-Werten
            const response = goals || {
                userId,
                stepsGoal: 10000,
                waterGoal: 2.0,
                sleepGoal: 8,
                weightGoal: null,
                createdAt: new Date().toISOString()
            };
            
            console.log(`✅ Goals response for ${userId}:`, response);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(response)
            };
        }

        if (httpMethod === 'POST' && (path === '/goals' || path.endsWith('/goals'))) {
            const body = JSON.parse(event.body || '{}');
            console.log('🎯 Saving/Updating goals:', body);

            if (!body.userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'userId is required',
                        code: 'MISSING_USER_ID'
                    })
                };
            }

            const goalData = {
                userId: body.userId,
                weightGoal: body.weightGoal || null,
                stepsGoal: body.stepsGoal || 10000,
                waterGoal: body.waterGoal || 2.0,
                sleepGoal: body.sleepGoal || 8,
                updatedAt: new Date()
            };

            const savedGoals = await Goals.findOneAndUpdate(
                { userId: body.userId },
                goalData,
                { upsert: true, new: true, runValidators: true }
            ).lean();

            console.log('✅ Goals saved:', savedGoals._id);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Goals updated successfully',
                    data: savedGoals
                })
            };
        }

        // HEALTH DATA ROUTES - Optimiert
        if (httpMethod === 'GET' && path.match(/^\/health-data\/([^\/]+)$/)) {
            const userId = path.split('/')[2];
            console.log(`📊 Fetching health data for user: ${userId}`);

            if (!userId || userId.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Valid userId is required',
                        code: 'INVALID_USER_ID'
                    })
                };
            }

            // Query-Parameter für Filterung
            const limit = parseInt(queryStringParameters?.limit) || 100;
            const days = parseInt(queryStringParameters?.days) || null;
            
            let dateFilter = {};
            if (days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                dateFilter = { date: { $gte: cutoffDate } };
            }

            const healthData = await HealthData.find({ 
                userId,
                ...dateFilter 
            })
            .sort({ date: -1, createdAt: -1 })
            .limit(Math.min(limit, 200)) // Max 200 für Performance
            .lean();

            console.log(`✅ Retrieved ${healthData.length} records for user ${userId}`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(healthData)
            };
        }

        // HEALTH DATA POST - Verbessert mit Duplikat-Prävention
        if (httpMethod === 'POST' && (path === '/health-data' || path.endsWith('/health-data'))) {
            const body = JSON.parse(event.body || '{}');
            console.log('💾 Processing health data:', { 
                userId: body.userId, 
                date: body.date,
                hasData: Object.keys(body).length > 2
            });

            if (!body.userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'userId is required',
                        code: 'MISSING_USER_ID'
                    })
                };
            }

            // INTELLIGENTE DUPLIKAT-PRÄVENTION
            const entryDate = body.date ? new Date(body.date) : new Date();
            const startOfDay = new Date(entryDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(entryDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            // Prüfe auf existierende Einträge am gleichen Tag
            const existingEntries = await HealthData.find({
                userId: body.userId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }).lean();

            // ERWEITERTE DUPLIKAT-LOGIK
            if (existingEntries.length > 0) {
                const isDuplicate = existingEntries.some(existing => {
                    // Prüfe auf identische Werte in wichtigen Feldern
                    const keyFields = ['steps', 'waterIntake', 'sleepHours', 'weight', 'mood'];
                    return keyFields.every(field => {
                        const existingValue = existing[field];
                        const newValue = body[field];
                        return existingValue === newValue;
                    });
                });

                if (isDuplicate && !body.forceSubmit) {
                    console.log('🚫 Duplicate entry prevented');
                    return {
                        statusCode: 409,
                        headers,
                        body: JSON.stringify({
                            error: 'Duplicate entry detected',
                            code: 'DUPLICATE_DATA',
                            message: 'Identical data already exists for this date',
                            suggestion: 'Use forceSubmit=true to override',
                            existingEntries: existingEntries.length
                        })
                    };
                }
            }

            // SPEICHERE NEUE DATEN
            const healthData = new HealthData({
                userId: body.userId,
                date: entryDate,
                weight: body.weight || null,
                steps: body.steps || null,
                waterIntake: body.waterIntake || null,
                sleepHours: body.sleepHours || null,
                mood: body.mood || null,
                notes: body.notes || null,
                _localId: body._localId || null,
                submissionId: body.submissionId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });

            const savedData = await healthData.save();
            console.log('✅ Health data saved:', savedData._id);
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Health data saved successfully',
                    data: {
                        id: savedData._id,
                        userId: savedData.userId,
                        date: savedData.date,
                        createdAt: savedData.createdAt
                    }
                })
            };
        }

        // AGGREGIERTE DATEN - Optimiert
        if (httpMethod === 'GET' && path.match(/^\/health-data-aggregated\/([^\/]+)$/)) {
            const userId = path.split('/')[2];
            const days = parseInt(queryStringParameters?.days) || 30;
            
            console.log(`📊 Aggregating data for user: ${userId} (${days} days)`);

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const pipeline = [
                { 
                    $match: { 
                        userId: userId,
                        date: { $gte: cutoffDate }
                    }
                },
                { 
                    $group: {
                        _id: { 
                            $dateToString: { format: "%Y-%m-%d", date: "$date" }
                        },
                        date: { $first: "$date" },
                        weight: { $last: "$weight" },
                        steps: { $sum: "$steps" },
                        waterIntake: { $sum: "$waterIntake" },
                        sleepHours: { $sum: "$sleepHours" },
                        mood: { $last: "$mood" },
                        notes: { 
                            $push: { 
                                $cond: [
                                    { $ne: ["$notes", null] }, 
                                    "$notes", 
                                    "$$REMOVE"
                                ]
                            }
                        },
                        entryCount: { $sum: 1 }
                    }
                },
                { $sort: { "date": -1 } },
                { $limit: days }
            ];
            
            const aggregatedData = await HealthData.aggregate(pipeline);
            
            // Post-processing: Notes zusammenfassen
            const processedData = aggregatedData.map(day => ({
                ...day,
                notes: day.notes.length > 0 ? day.notes.join(' | ') : null
            }));
            
            console.log(`✅ Aggregated ${processedData.length} days for user ${userId}`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(processedData)
            };
        }

        // DATABASE TEST - Erweitert
        if (httpMethod === 'GET' && (path === '/test-db' || path.endsWith('/test-db'))) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const healthDataCount = await HealthData.countDocuments();
            const goalsCount = await Goals.countDocuments();
            
            // Beispiel-Abfrage für Performance-Test
            const sampleData = await HealthData.findOne().lean();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Database connection successful',
                    database: 'health-tracker',
                    connection: {
                        state: mongoose.connection.readyState,
                        host: mongoose.connection.host,
                        port: mongoose.connection.port
                    },
                    collections: collections.map(c => ({
                        name: c.name,
                        type: c.type
                    })),
                    statistics: {
                        healthDataEntries: healthDataCount,
                        goalEntries: goalsCount,
                        totalDocuments: healthDataCount + goalsCount
                    },
                    sampleDataExists: !!sampleData,
                    timestamp: new Date().toISOString()
                })
            };
        }

        // 404 für unbekannte Routen
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                error: 'Endpoint not found',
                path: path,
                method: httpMethod,
                availableEndpoints: [
                    'GET /',
                    'GET /health',
                    'GET /test-db',
                    'GET /health-data/{userId}',
                    'POST /health-data',
                    'GET /health-data-aggregated/{userId}',
                    'GET /goals/{userId}',
                    'POST /goals'
                ],
                documentation: 'https://your-docs-url.com/api'
            })
        };

    } catch (error) {
        console.error('❌ API Function error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                code: error.code || 'INTERNAL_ERROR',
                message: error.message,
                timestamp: new Date().toISOString(),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

module.exports = { handler };
exports.handler = handler;
