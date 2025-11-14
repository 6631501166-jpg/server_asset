# Login API Documentation

## Login Endpoint

The login API supports **multiple field names** for flexibility. Use the field name that matches your data type!

### Endpoint
```
POST /api/login
```

### Request Body - All Formats Supported

You can use **any of these field names**:

#### Option 1: Using `email` field (for email login)
```json
{
  "email": "user@gmail.com",
  "password": "user123"
}
```

#### Option 2: Using `username` field (for username login)
```json
{
  "username": "user",
  "password": "user123"
}
```

#### Option 3: Using `uid` field (for user ID login)
```json
{
  "uid": "9",
  "password": "user123"
}
```

#### Option 4: Using `identifier` field (generic - works for all)
```json
{
  "identifier": "user@gmail.com",
  "password": "user123"
}
```

**All formats work!** Use whichever field name makes sense for your use case.

### Login Examples

#### 1. Login with EMAIL
```json
{
  "email": "swan2923@gmail.com",
  "password": "11111111"
}
```

#### 2. Login with USERNAME
```json
{
  "username": "john_doe",
  "password": "mypassword"
}
```

#### 3. Login with USER ID
```json
{
  "uid": "9",
  "password": "user123"
}
```

### Response

**Success (200 OK)**
```json
{
  "uid": 9,
  "username": "user",
  "role": "student",
  "first_name": "Test",
  "last_name": "User",
  "email": "user@gmail.com"
}
```

**Error Responses**

- `400 Bad Request`: "Login credential (email/username/uid) and password are required"
- `401 Unauthorized`: "Invalid credentials" (user not found)
- `401 Unauthorized`: "Wrong password"
- `500 Internal Server Error`: "Database server error"

### How It Works

The API automatically detects which field you're using:

1. **`email` field provided** → Queries database by email
2. **`username` field provided** → Queries database by username
3. **`uid` field provided** → Queries database by user ID
4. **`identifier` field provided** → Auto-detects type:
   - Contains `@` → Treated as email
   - Numeric only → Treated as user ID
   - Everything else → Treated as username

### Example Usage in Flutter

```dart
// Login with email (recommended - semantic field name)
final response = await http.post(
  Uri.parse('http://192.168.1.185:3000/api/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'swan2923@gmail.com',
    'password': '11111111',
  }),
);

// Login with username
final response = await http.post(
  Uri.parse('http://192.168.1.185:3000/api/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'username': 'john_doe',
    'password': 'mypassword',
  }),
);

// Login with user ID
final response = await http.post(
  Uri.parse('http://192.168.1.185:3000/api/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'uid': '9',
    'password': 'user123',
  }),
);

// Generic identifier (works for all types)
final response = await http.post(
  Uri.parse('http://192.168.1.185:3000/api/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'identifier': userInput,  // Can be email, username, or uid
    'password': password,
  }),
);
```
