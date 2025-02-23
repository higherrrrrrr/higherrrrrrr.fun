import { NextResponse } from 'next/server';
import { logger } from '../../../lib/logger';

export function validateRequest(schema) {
  return async function(data) {
    try {
      await schema.validate(data);
      return null;
    } catch (error) {
      logger.warn('Validation failed:', { data, error: error.message });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  };
} 