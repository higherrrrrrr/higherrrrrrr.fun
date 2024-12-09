FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory
RUN mkdir -p /tmp/nginx_cache && \
    chmod 755 /tmp/nginx_cache

# Cloud Run will provide PORT env variable
ENV PORT 8080

# Use the PORT environment variable in nginx.conf
CMD sed -i "s/8080/${PORT}/g" /etc/nginx/nginx.conf && \
    nginx -g 'daemon off;'
