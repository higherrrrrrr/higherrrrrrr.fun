import { logger } from './logger';
import { validateRequest } from '../app/api/middleware/validate';
import { rateLimiter } from '../app/api/middleware/rateLimit';
import { NextResponse } from 'next/server';

export function withApiHandler(handler, { schema, rateLimit = true } = {}) {
  return async function(req) {
    try {
      // Rate limiting
      if (rateLimit) {
        const rateLimitResult = await rateLimiter(req);
        if (rateLimitResult) return rateLimitResult;
      }

      // Schema validation
      if (schema) {
        const validationError = await validateRequest(schema)(req);
        if (validationError) return validationError;
      }

      // Execute handler
      const response = await handler(req);
      return response;
    } catch (error) {
      logger.error('API Error:', {
        error: error.message,
        stack: error.stack,
        url: req.url
      });
      
      // Handle specific error types
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Resource already exists' },
          { status: 409 }
        );
      }

      if (error.code === '57P01') { // Connection timeout
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function validateRequest(schema) {
  return async function(data) {
    try {
      await schema.validate(data);
      return null;
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  };
} 