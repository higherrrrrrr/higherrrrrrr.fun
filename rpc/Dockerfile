FROM nginx:alpine

# Install headers-more-nginx-module
RUN apk add --no-cache nginx-mod-http-headers-more

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory
RUN mkdir -p /tmp/nginx_cache && \
    chmod 777 /tmp/nginx_cache

# Document that we're using port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
