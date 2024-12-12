FROM nginx:1.25.3

# Install build dependencies
RUN apt-get update && apt-get install -y \
    wget \
    build-essential \
    libpcre3-dev \
    zlib1g-dev \
    libssl-dev \
    git

# Get nginx source code (same version as base image)
RUN wget http://nginx.org/download/nginx-1.25.3.tar.gz && \
    tar zxf nginx-1.25.3.tar.gz

# Get headers-more-nginx-module
RUN git clone https://github.com/openresty/headers-more-nginx-module.git

# Configure and build nginx with the additional module
RUN cd nginx-1.25.3 && \
    ./configure \
        --with-compat \
        --add-dynamic-module=../headers-more-nginx-module && \
    make modules

# Create modules directory and copy the built module
RUN mkdir -p /usr/lib/nginx/modules && \
    cp /nginx-1.25.3/objs/ngx_http_headers_more_filter_module.so /usr/lib/nginx/modules/

# Clean up build dependencies and source files
RUN apt-get remove -y wget build-essential && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /nginx-1.25.3* && \
    rm -rf /headers-more-nginx-module

# Create modules-enabled directory and load the module
RUN mkdir -p /etc/nginx/modules-enabled && \
    echo "load_module modules/ngx_http_headers_more_filter_module.so;" > /etc/nginx/modules-enabled/headers-more.conf

# Create cache directory
RUN mkdir -p /tmp/nginx_cache && \
    chmod 777 /tmp/nginx_cache

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
