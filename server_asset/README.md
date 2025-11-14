# Asset Borrowing System - Server

Backend API server for the Asset Borrowing System.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

   Edit `.env` file with your configuration:
   ```
   HOST=0.0.0.0        # Listen on all interfaces
   PORT=3000           # Server port
   DB_HOST=localhost   # MySQL host
   DB_USER=root        # MySQL user
   DB_PASSWORD=        # MySQL password
   DB_NAME=assets      # Database name
   ```

3. **Setup Database**
   
   Run the database setup script to create the database and add a test user:
   ```bash
   node setup_database.js
   ```

4. **Start Server**
   ```bash
   node app.js
   ```

## Environment Variables

### Server Configuration

- **HOST**: Server host address
  - `0.0.0.0` - Listen on all network interfaces (recommended for development)
  - `127.0.0.1` or `localhost` - Listen only on localhost
  - Specific IP (e.g., `192.168.1.173`) - Listen on that interface

- **PORT**: Server port (default: 3000)

### Database Configuration

- **DB_HOST**: MySQL host (default: localhost)
- **DB_USER**: MySQL username (default: root)
- **DB_PASSWORD**: MySQL password (default: empty)
- **DB_NAME**: Database name (default: assets)

## Test User

After running `setup_database.js`, you can login with:
- **Email**: user@gmail.com
- **Username**: user
- **Password**: user123
- **Role**: student

## API Endpoints

### Common APIs
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /api/password/:raw` - Generate password hash

### Student APIs
- `GET /api/student/assets` - Get all available assets
- `GET /api/student/assets/category/:categoryId` - Get assets by category
- `GET /api/student/categories` - Get all active categories
- `POST /api/student/borrow` - Request to borrow an asset
- `GET /api/student/history/:uid` - Get borrowing history
- `GET /api/student/requests/:uid` - Get pending/approved requests
- `PUT /api/student/cancel/:borrowingId` - Cancel a pending request

## Network Access

### From the same computer:
```
http://localhost:3000
http://127.0.0.1:3000
```

### From other devices on the network:
```
http://<your-computer-ip>:3000
```

To find your IP address:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **macOS/Linux**: `ifconfig` or `ip addr`

### For Flutter App Configuration

Update your Flutter app's API service to point to:
- **iOS Simulator**: `http://localhost:3000/api` or `http://127.0.0.1:3000/api`
- **Android Emulator**: `http://10.0.2.2:3000/api`
- **Physical Device**: `http://<your-computer-ip>:3000/api`
