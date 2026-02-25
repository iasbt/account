import { describe, it, expect, vi } from 'vitest';
import { metricsMiddleware, getMetrics } from '../../middlewares/metrics.js';

describe('Metrics Middleware', () => {
  it('should call next() and measure duration', () => {
    const req = { method: 'GET', route: { path: '/test' } };
    const res = {
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          callback(); // Simulate request finish
        }
      })
    };
    const next = vi.fn();

    metricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should expose metrics endpoint', async () => {
    const req = {};
    const res = {
      set: vi.fn(),
      end: vi.fn()
    };

    await getMetrics(req, res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', expect.any(String));
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('http_request_duration_seconds'));
  });
});
