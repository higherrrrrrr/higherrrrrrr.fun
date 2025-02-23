export const logger = {
  error: (err, context = {}) => {
    console.error({
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: err.stack,
      ...context
    });
  },
  info: (message, context = {}) => {
    console.log({
      timestamp: new Date().toISOString(),
      message,
      ...context
    });
  }
}; 