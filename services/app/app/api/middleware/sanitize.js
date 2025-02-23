import { NextResponse } from 'next/server';
import sanitize from 'sanitize-html';

export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return sanitize(input, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  return input;
}

export function withSanitize(handler) {
  return async (request) => {
    const body = await request.json();
    const sanitizedBody = Object.keys(body).reduce((acc, key) => ({
      ...acc,
      [key]: sanitizeInput(body[key])
    }), {});
    
    request.sanitizedBody = sanitizedBody;
    return handler(request);
  };
} 