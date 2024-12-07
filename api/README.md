# API Service

## Setup

### Prerequisites
- Python 3.8+
- PostgreSQL
- pip

### Installation

1. Install dependencies:
```

## Authentication

The API uses Ethereum wallet signatures for authentication. To make authenticated requests:

1. Sign the message: `we're going higherrrrrrr`
2. Format the Authorization header:
```
Authorization: Bearer <wallet_address>:<signature>
```

Example using web3.js:
```javascript
const message = "we're going higherrrrrrr";
const signature = await web3.eth.personal.sign(message, address);
const authHeader = `Bearer ${address}:${signature}`;
```

## API Endpoints