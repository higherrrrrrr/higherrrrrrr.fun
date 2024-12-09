FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory
RUN mkdir -p /tmp/nginx_cache && \
    chmod 755 /tmp/nginx_cache

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
