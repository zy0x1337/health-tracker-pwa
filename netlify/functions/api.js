// netlify/functions/api.js

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
            dbName: 'health-tracker'
        });

        cachedConnection = connection;
        console.log('✅ MongoDB connected to database: health-tracker');
        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
}

// UPDATED: Health Data Schema mit Blood Pressure & Pulse
const healthDataSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    weight: { type: Number, min: 0 },
    steps: { type: Number, min: 0 },
    waterIntake: { type: Number, min: 0 },
    sleepHours: { type: Number, min: 0, max: 24 },
    // NEW: Blood Pressure & Pulse Fields
    systolic: { type: Number, min: 60, max: 250 },
    diastolic: { type: Number, min: 30, max: 150 },
    pulse: { type: Number, min: 30, max: 200 },
    mood: {
        type: String,
        enum: ['excellent', 'good', 'neutral', 'bad', 'terrible']
    },
    notes: String,
    createdAt: { type: Date, default: Date.now }
}, {
    // Compound index für bessere Performance
    indexes: [
        { userId: 1, date: -1 },
        { userId: 1, createdAt: -1 }
    ]
});

// Goals Schema bleibt unverändert
const goalsSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    weightGoal: { type: Number, min: 0 },
    stepsGoal: { type: Number, min: 0, default: 10000 },
    waterGoal: { type: Number, min: 0, default: 2.0 },
    sleepGoal: { type: Number, min: 0, max: 24, default: 8 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    indexes: [{ userId: 1 }]
});

const HealthData = mongoose.models.HealthData ||
    mongoose.model('HealthData', healthDataSchema, 'healthdatas');

const Goals = mongoose.models.Goals ||
    mongoose.model('Goals', goalsSchema, 'goals');

// HAUPT-HANDLER FUNCTION
const handler = async (event, context) => {
    let { httpMethod, path } = event;

    // 🔧 KORREKTUR: Entferne /api prefix falls vorhanden
    if (path.startsWith('/api/')) {
        path = path.replace('/api', '');
    }

    console.log(`📞 API Handler: ${httpMethod} ${path}`);
    console.log(`🔍 Original path: ${event.path}`);

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // OPTIONS Request
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // ROOT PATH - Function verfügbarkeit testen
        if (httpMethod === 'GET' && (path === '/' || path === '')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Health Tracker API Function is running!',
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    features: ['Health Data Tracking', 'Goals Management', 'Blood Pressure Monitoring', 'Pulse Tracking'],
                    availableRoutes: [
                        'GET /health - Health Check',
                        'GET /test-db - Database Test',
                        'GET /health-data/{userId} - Get User Data',
                        'POST /health-data - Save Health Data',
                        'GET /goals/{userId} - Get User Goals',
                        'POST /goals - Save/Update Goals',
                        'GET /stats/{userId} - Get User Statistics'
                    ]
                })
            };
        }

        // Health Check Route
        if (httpMethod === 'GET' && (path === '/health' || path.endsWith('/health'))) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'API is working!',
                    timestamp: new Date().toISOString(),
                    message: 'Health Tracker API with MongoDB support',
                    database: 'health-tracker',
                    collections: ['healthdatas', 'goals'],
                    mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured',
                    features: {
                        healthData: true,
                        goals: true,
                        bloodPressure: true,
                        pulseTracking: true
                    }
                })
            };
        }

        // MongoDB Connection für Daten-Operationen
        await connectToDatabase();

        // Goals GET Route
        if (httpMethod === 'GET' && path.startsWith('/goals/')) {
            const pathSegments = path.split('/').filter(segment => segment.length > 0);
            if (pathSegments.length < 2) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid path format. Expected: /goals/{userId}',
                        receivedPath: path
                    })
                };
            }

            const userId = pathSegments[1];
            console.log(`🎯 Fetching goals for user: ${userId}`);
            
            const goals = await Goals.findOne({ userId }).lean();
            console.log(`✅ Found goals for user ${userId}:`, goals);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(goals || {
                    userId,
                    stepsGoal: 10000,
                    waterGoal: 2.0,
                    sleepGoal: 8,
                    weightGoal: null
                })
            };
        }

        // Goals POST Route (Save/Update)
        if (httpMethod === 'POST' && (path === '/goals' || path.endsWith('/goals'))) {
            const body = JSON.parse(event.body || '{}');
            console.log('🎯 Saving goals:', body);

            if (!body.userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'userId is required',
                        received: body
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
            );

            console.log('✅ Goals saved with ID:', savedGoals._id);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Goals saved successfully',
                    data: savedGoals
                })
            };
        }

        // Health Data GET Route
        if (httpMethod === 'GET' && path.startsWith('/health-data/')) {
            const pathSegments = path.split('/').filter(segment => segment.length > 0);
            console.log('🔍 Path segments:', pathSegments);

            if (pathSegments.length < 2) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid path format. Expected: /health-data/{userId}',
                        receivedPath: path,
                        segments: pathSegments
                    })
                };
            }

            const userId = pathSegments[1];
            console.log(`📊 Fetching data for user: ${userId} from healthdatas collection`);

            if (!userId || userId.trim() === '') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'User ID is required and cannot be empty'
                    })
                };
            }

            const healthData = await HealthData.find({ userId })
                .sort({ date: -1 })
                .limit(100) // Increased limit for more data
                .lean();

            console.log(`✅ Found ${healthData.length} records for user ${userId}`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(healthData)
            };
        }

        // Health Data POST Route - UPDATED mit Blood Pressure & Pulse
        if (httpMethod === 'POST' && (path === '/health-data' || path.endsWith('/health-data'))) {
            const body = JSON.parse(event.body || '{}');
            console.log('💾 Saving to healthdatas collection:', body);

            if (!body.userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'userId is required',
                        received: body
                    })
                };
            }

            // Validation für Blood Pressure Werte
            if ((body.systolic && !body.diastolic) || (!body.systolic && body.diastolic)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Both systolic and diastolic values are required for blood pressure',
                        received: { systolic: body.systolic, diastolic: body.diastolic }
                    })
                };
            }

            const healthData = new HealthData({
                userId: body.userId,
                date: body.date ? new Date(body.date) : new Date(),
                weight: body.weight || null,
                steps: body.steps || null,
                waterIntake: body.waterIntake || null,
                sleepHours: body.sleepHours || null,
                // NEW: Blood Pressure & Pulse Fields
                systolic: body.systolic || null,
                diastolic: body.diastolic || null,
                pulse: body.pulse || null,
                mood: body.mood || null,
                notes: body.notes || null
            });

            const savedData = await healthData.save();
            console.log('✅ Data saved to healthdatas collection with ID:', savedData._id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Health data saved successfully',
                    data: savedData
                })
            };
        }

        // NEW: Statistics Route für erweiterte Datenauswertung
        if (httpMethod === 'GET' && path.startsWith('/stats/')) {
            const pathSegments = path.split('/').filter(segment => segment.length > 0);
            if (pathSegments.length < 2) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid path format. Expected: /stats/{userId}',
                        receivedPath: path
                    })
                };
            }

            const userId = pathSegments[1];
            console.log(`📈 Generating stats for user: ${userId}`);

            // Aggregation Pipeline für Statistiken
            const stats = await HealthData.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: null,
                        totalEntries: { $sum: 1 },
                        avgWeight: { $avg: '$weight' },
                        avgSteps: { $avg: '$steps' },
                        avgWater: { $avg: '$waterIntake' },
                        avgSleep: { $avg: '$sleepHours' },
                        avgSystolic: { $avg: '$systolic' },
                        avgDiastolic: { $avg: '$diastolic' },
                        avgPulse: { $avg: '$pulse' },
                        maxSteps: { $max: '$steps' },
                        minWeight: { $min: '$weight' },
                        maxWeight: { $max: '$weight' }
                    }
                }
            ]);

            // Recent trends (letzte 30 Tage)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentData = await HealthData.find({
                userId: userId,
                date: { $gte: thirtyDaysAgo }
            }).sort({ date: 1 }).lean();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    userId: userId,
                    period: 'all_time',
                    stats: stats[0] || {},
                    recentTrends: {
                        period: 'last_30_days',
                        entries: recentData.length,
                        data: recentData
                    },
                    generatedAt: new Date().toISOString()
                })
            };
        }

        // Database Test Route
        if (httpMethod === 'GET' && (path === '/test-db' || path.endsWith('/test-db'))) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            const healthDataCount = await HealthData.countDocuments();
            const goalsCount = await Goals.countDocuments();

            // Test Blood Pressure Query
            const bpDataCount = await HealthData.countDocuments({
                systolic: { $exists: true, $ne: null },
                diastolic: { $exists: true, $ne: null }
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Database test successful',
                    database: 'health-tracker',
                    collections: collectionNames,
                    documentsCount: {
                        healthdatas: healthDataCount,
                        goals: goalsCount,
                        bloodPressureEntries: bpDataCount
                    },
                    connectionState: mongoose.connection.readyState,
                    schemaVersion: '2.0',
                    features: {
                        bloodPressureTracking: true,
                        pulseMonitoring: true,
                        goalsManagement: true,
                        statisticsGeneration: true
                    }
                })
            };
        }

        // 404 für unbekannte Routen
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                error: 'Route not found',
                path: path,
                originalPath: event.path,
                method: httpMethod,
                availableRoutes: [
                    'GET / - Function Status',
                    'GET /health - Health Check',
                    'GET /test-db - Database Test',
                    'GET /health-data/{userId} - Get User Data',
                    'POST /health-data - Save Health Data',
                    'GET /goals/{userId} - Get User Goals',
                    'POST /goals - Save/Update Goals',
                    'GET /stats/{userId} - Get User Statistics'
                ]
            })
        };

    } catch (error) {
        console.error('❌ Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString(),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

// BEIDE EXPORT-METHODEN für Kompatibilität
module.exports = { handler };
exports.handler = handler;
