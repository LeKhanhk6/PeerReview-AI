import http from 'k6/http';
import { check, sleep } from 'k6';

// Options for k6 load test: Simulate spike load of 300-500 virtual users (VUs)
export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp-up to 50 users
        { duration: '1m', target: 300 },  // Ramp-up to 300 users
        { duration: '30s', target: 500 }, // Spike to 500 users
        { duration: '1m', target: 300 },  // Stay at 300 users
        { duration: '30s', target: 0 },   // Ramp-down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000/api';

export default function () {
    // 1. Health check request
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
        'health status is 200': (r) => r.status === 200,
        'db is connected': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.data && body.data.database && body.data.database.connected === true;
            } catch (e) {
                return false;
            }
        },
    });

    sleep(1);
}
