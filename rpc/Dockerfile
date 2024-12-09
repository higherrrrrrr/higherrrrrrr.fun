FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory and ensure nginx user can write to it
RUN mkdir -p /tmp/nginx_cache && \
    chmod 755 /tmp/nginx_cache && \
    chown -R nginx:nginx /tmp/nginx_cache

# Create required directories and set permissions
RUN mkdir -p /var/cache/nginx && \
    mkdir -p /var/run && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Cloud Run will provide PORT env variable
ENV PORT 8080

# Use the PORT environment variable in nginx.conf and ensure proper startup
CMD /bin/sh -c "envsubst '\$PORT' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp && \
    mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf && \
    nginx -g 'daemon off;'"
