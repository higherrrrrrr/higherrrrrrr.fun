FROM nginx:mainline

# Install the headers-more-nginx-module
RUN apt-get update && apt-get install -y wget build-essential libpcre3-dev zlib1g-dev libssl-dev
RUN wget https://github.com/openresty/headers-more-nginx-module/archive/v0.34.tar.gz
RUN tar xvf v0.34.tar.gz

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf.template

# Use environment variable substitution when container starts
CMD ["/bin/sh", "-c", "envsubst '${ALCHEMY_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
