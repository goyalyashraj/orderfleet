import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics for flash sale overselling verification
const successCounter = new Counter('successful_reservations');
const rejectedCounter = new Counter('rejected_insufficient_stock');
const unexpectedErrorCounter = new Counter('unexpected_errors');
const reservationLatency = new Trend('reservation_latency_ms');

export const options = {
    scenarios: {
        flash_sale_spike: {
            executor: 'shared-iterations',
            vus: 50,
            iterations: 100,
            maxDuration: '30s',
        },
    },
    thresholds: {
        'successful_reservations': ['count==10'], // Invariant: Exactly 10 units must be reserved
        'unexpected_errors': ['count==0'],       // Zero unexpected 5xx crashes
    },
};

const BASE_URL = __ENV.GATEWAY_URL || 'http://localhost:8080';
const PRODUCT_ID = parseInt(__ENV.PRODUCT_ID || '12', 10);
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
    const uniqueOrderId = 900000 + (__VU * 1000) + __ITER;

    const payload = JSON.stringify({
        orderId: uniqueOrderId,
        productId: PRODUCT_ID,
        quantity: 1,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        timeout: '10s',
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/api/v1/inventory/reserve`, payload, params);
    reservationLatency.add(Date.now() - startTime);

    if (res.status === 200 || res.status === 201) {
        successCounter.add(1);
        check(res, {
            'Reservation Successful (200/201)': (r) => r.status === 200 || r.status === 201,
        });
    } else if (res.status === 409 || res.status === 400) {
        rejectedCounter.add(1);
        check(res, {
            'Rejected Gracefully (409/400 Insufficient Stock)': (r) => r.status === 409 || r.status === 400,
        });
    } else {
        unexpectedErrorCounter.add(1);
        console.error(`Unexpected status ${res.status}: ${res.body}`);
    }
}
