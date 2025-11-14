# Borrowing Request APIs - Quick Reference

## 📌 Summary

Your backend now has **complete borrowing request APIs** that allow students to:
- ✅ View their pending/approved requests
- ✅ View their complete borrowing history  
- ✅ Submit new borrow requests
- ✅ Cancel pending requests

All responses include **category images** for display in your Flutter app!

---

## 🔌 Available Endpoints

### Student Borrowing Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/student/requests/:uid` | Get pending/approved requests |
| `GET` | `/api/student/history/:uid` | Get all borrowing history |
| `POST` | `/api/student/borrow` | Submit new borrow request |
| `PUT` | `/api/student/cancel/:borrowingId` | Cancel a pending request |

### Asset Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/student/assets` | Get all available assets |
| `GET` | `/api/student/assets/category/:categoryId` | Get assets by category |
| `GET` | `/api/student/categories` | Get all active categories |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Login with email/username/uid |
| `POST` | `/api/register` | Register new student |

---

## 📱 Flutter Integration Examples

### 1. Fetch Pending Requests
```dart
Future<List<dynamic>> fetchMyRequests(int userId) async {
  final response = await http.get(
    Uri.parse('http://192.168.56.1:3000/api/student/requests/$userId'),
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  }
  throw Exception('Failed to load requests');
}
```

### 2. Display Request with Image
```dart
ListView.builder(
  itemCount: requests.length,
  itemBuilder: (context, index) {
    final request = requests[index];
    return ListTile(
      leading: Image.network(
        request['category_image_url'],
        width: 50,
        height: 50,
        errorBuilder: (context, error, stackTrace) {
          return Icon(Icons.image_not_supported);
        },
      ),
      title: Text(request['asset_name']),
      subtitle: Text('Status: ${request['status']}'),
      trailing: Text(request['category_name']),
    );
  },
)
```

### 3. Cancel a Request
```dart
Future<void> cancelRequest(int borrowingId, int userId) async {
  final response = await http.put(
    Uri.parse('http://192.168.56.1:3000/api/student/cancel/$borrowingId'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({'borrower_id': userId}),
  );
  
  if (response.statusCode == 200) {
    print('Request cancelled successfully');
  }
}
```

---

## 🧪 Testing

Test user credentials (created earlier):
```
Email: user@gmail.com
Username: user
Password: user123
UID: 9
```

Test the APIs:
```powershell
# Get pending requests
Invoke-WebRequest -Uri "http://localhost:3000/api/student/requests/9"

# Get history
Invoke-WebRequest -Uri "http://localhost:3000/api/student/history/9"

# Submit borrow request
Invoke-WebRequest -Uri "http://localhost:3000/api/student/borrow" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"borrower_id":9,"asset_id":7,"borrow_date":"2025-11-05","return_date":"2025-11-12"}'
```

---

## 📊 Response Fields Explained

### Borrowing Request Fields
- `borrowing_id` - Unique ID for the borrow request
- `status` - Current status: `pending`, `approved`, `borrowed`, `returned`, `cancelled`, `rejected`
- `borrow_date` - When the asset will be borrowed
- `return_date` - When the asset should be returned
- `returned_at` - Actual return timestamp (null if not returned)
- `asset_id`, `asset_code`, `asset_name` - Asset details
- `category_name`, `category_image` - Category info
- `category_image_url` - **Full URL to display image in Flutter**
- `approver_first_name`, `approver_last_name` - Who approved (null if pending)

---

## ✅ Current Database State

- **13 Assets** across 4 categories
- **1 Test borrow request** (User ID 9, Asset: Macbook Pro M1, Status: pending)
- **4 Categories** with real PNG images

Test it in your Flutter app now! 🚀
