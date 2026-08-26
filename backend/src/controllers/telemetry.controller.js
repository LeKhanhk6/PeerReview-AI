/**
 * Controller xử lý các request Telemetry và Client Errors từ Frontend
 */

export const handleClientError = async (req, res) => {
    try {
        const { message, stack, url, userAgent, userId, timestamp, sessionId, componentStack } = req.body;
        
        // Trong môi trường production, bạn nên lưu log này vào Database (VD: MongoDB/PostgreSQL) 
        // hoặc gửi đến các dịch vụ như Sentry, Datadog.
        // Ở đây chúng ta tạm thời log ra console với format rõ ràng.
        
        console.error('\n[CLIENT ERROR RECEIVED]');
        console.error(`- Timestamp: ${new Date(timestamp || Date.now()).toISOString()}`);
        console.error(`- URL: ${url}`);
        console.error(`- UserAgent: ${userAgent}`);
        console.error(`- SessionID: ${sessionId}`);
        if (userId) console.error(`- UserID: ${userId}`);
        console.error(`- Message: ${message}`);
        if (stack) console.error(`- Stack: ${stack}`);
        if (componentStack) console.error(`- ComponentStack: ${componentStack}`);
        console.error('-----------------------\n');

        res.status(200).json({ success: true, message: 'Client error logged successfully' });
    } catch (error) {
        console.error('Failed to process client error:', error);
        res.status(500).json({ success: false, message: 'Failed to log client error' });
    }
};

export const handleTelemetry = async (req, res) => {
    try {
        const { event, metadata, userId, timestamp, sessionId } = req.body;

        console.log('\n[TELEMETRY EVENT RECEIVED]');
        console.log(`- Event: ${event}`);
        console.log(`- Timestamp: ${new Date(timestamp || Date.now()).toISOString()}`);
        console.log(`- SessionID: ${sessionId}`);
        if (userId) console.log(`- UserID: ${userId}`);
        if (metadata) console.log(`- Metadata:`, metadata);
        console.log('-----------------------\n');

        res.status(200).json({ success: true, message: 'Telemetry logged successfully' });
    } catch (error) {
        console.error('Failed to process telemetry:', error);
        res.status(500).json({ success: false, message: 'Failed to log telemetry' });
    }
};
