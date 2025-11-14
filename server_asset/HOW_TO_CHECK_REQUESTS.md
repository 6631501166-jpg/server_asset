# How to Check Student Requests in Flutter

## ✅ API Endpoint Already Available

**Endpoint:** `GET /api/student/requests/:uid`

**Purpose:** Get all pending and approved borrow requests for a student

---

## 📝 Step-by-Step Flutter Implementation

### 1. In your Flutter app, when user clicks "Check Requests" button:

```dart
// Get the logged-in student's ID (from your login response)
int studentId = 9; // Example: This comes from your login

// Make API call
final response = await http.get(
  Uri.parse('http://192.168.56.1:3000/api/student/requests/$studentId'),
);

if (response.statusCode == 200) {
  List<dynamic> requests = json.decode(response.body);
  
  // Now display the requests in your UI
  // Each request has:
  // - borrowing_id
  // - asset_name
  // - asset_code  
  // - category_name
  // - category_image_url (full URL for Image.network)
  // - status (pending/approved)
  // - borrow_date
  // - return_date
}
```

### 2. Example Response You'll Get:

```json
[
  {
    "borrowing_id": 3,
    "status": "pending",
    "borrow_date": "2025-11-05",
    "return_date": "2025-11-12",
    "asset_id": 7,
    "asset_code": "Mac-1",
    "asset_name": "Macbook Pro M1",
    "category_name": "Macbook",
    "category_image": "macbook.png",
    "category_image_url": "http://192.168.56.1:3000/images/categories/macbook.png"
  }
]
```

### 3. Display in Flutter:

```dart
ListView.builder(
  itemCount: requests.length,
  itemBuilder: (context, index) {
    final request = requests[index];
    
    return Card(
      child: ListTile(
        leading: Image.network(
          request['category_image_url'],  // ← Image URL included!
          width: 50,
          height: 50,
        ),
        title: Text(request['asset_name']),
        subtitle: Text('Status: ${request['status']}'),
        trailing: Text(request['category_name']),
      ),
    );
  },
)
```

---

## 🧪 Test Data Available

**Test Student:**
- User ID: `9`
- Email: `user@gmail.com`
- Username: `user`
- Password: `user123`

**Has 1 Pending Request:**
- Asset: Macbook Pro M1 (Mac-1)
- Borrow Date: 2025-11-05
- Return Date: 2025-11-12
- Status: pending

---

## 📱 Complete Example Flutter Widget

See the file: `FLUTTER_EXAMPLE_MY_REQUESTS.dart`

This contains a complete, working Flutter page that:
- ✅ Fetches student's requests from the API
- ✅ Displays them with category images
- ✅ Shows status badges (pending/approved)
- ✅ Allows cancelling pending requests
- ✅ Has pull-to-refresh functionality
- ✅ Handles loading and error states

Just copy it to your Flutter project and modify the server URL!

---

## 🚀 Quick Start

1. **In your Flutter app, add this button:**
```dart
ElevatedButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MyRequestsPage(
          studentId: currentUser.uid, // Your logged-in user ID
        ),
      ),
    );
  },
  child: Text('Check My Requests'),
)
```

2. **Copy the `FLUTTER_EXAMPLE_MY_REQUESTS.dart` file to your Flutter project**

3. **Update the server URL if needed** (change `http://192.168.56.1:3000` to match your server)

4. **That's it!** The page will fetch and display all pending/approved requests with images.

---

## 💡 Additional Features Available

If you also want to show **all history** (including completed/cancelled/rejected):

Use: `GET /api/student/history/:uid`

This returns ALL borrowing records regardless of status.
