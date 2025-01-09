# NGINX RPC Caching Proxy

A specialized NGINX proxy server configured for caching RPC requests with CORS support and custom header management. This proxy is designed to sit in front of Alchemy's Base Mainnet endpoint, providing caching and rate limiting capabilities.

## Features

- Request caching based on request body content
- Intelligent cache control for different RPC methods:
  - `eth_blockNumber`: 2 seconds cache
  - `eth_call`: 22 seconds cache
  - Other methods: no caching
- CORS support with configurable origins
- Header sanitization and management using headers-more-nginx-module
- Cache status monitoring via X-Cache-Status header
- Debug-level error logging
- Request body based cache keys

## Prerequisites

- Docker
- Docker Compose (optional)

## Configuration

### Allowed Origins

The proxy is configured to allow requests from:
- `http://localhost:3000`
- `https://alpha.higherrrrrrr.fun`

To modify allowed origins, update the `map $http_origin $is_allowed_origin` section in `nginx.conf`.

### Cache Settings

Cache is configured with the following parameters:
- Location: `/tmp/nginx_cache`
- Levels: 1:2
- Zone: 10MB
- Maximum size: 10GB
- Inactive timeout: 60 minutes

## Building

To build the Docker image:

```bash
docker build -t rpc-cache-proxy .
```

## Running

Start the container:

```bash
docker run -d -p 8080:8080 rpc-cache-proxy
```

## Usage

Send your RPC requests to `http://localhost:8080` instead of directly to Alchemy. The proxy will handle caching and CORS automatically.

Example request:

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Cache Bypass

To bypass the cache for a specific request, include the `Cache-Bypass` header:

```bash
curl -X POST http://localhost:8080 \
  -H "Cache-Bypass: true" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Monitoring

The proxy adds an `X-Cache-Status` header to all responses with the following possible values:
- `MISS`: The response was not found in the cache
- `HIT`: The response was served from the cache
- `BYPASS`: The cache was bypassed
- `EXPIRED`: The cached response was expired
- `STALE`: A stale cached response was served

## Security Considerations

- The proxy removes sensitive headers from upstream responses
- Origin validation is enforced
- All requests from non-allowed origins are rejected with 403
- Preflight requests (OPTIONS) are handled appropriately
- Upstream API key is embedded in the configuration and not exposed to clients

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the WAGMI License (MIT-Compatible).