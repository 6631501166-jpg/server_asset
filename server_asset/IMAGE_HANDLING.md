# Complete API Documentation

## 📋 Borrowing Request APIs

### 1. Get Student's Pending/Approved Requests
```
GET /api/student/requests/:uid
```

Returns all borrowing requests that are currently `pending` or `approved` for a specific student.

**Parameters:**
- `uid` (path parameter) - Student's user ID

**Response:**
```json
[
  {
    "borrowing_id": 3,
    "status": "pending",
    "borrow_date": "2025-11-05T00:00:00.000Z",
    "return_date": "2025-11-12T00:00:00.000Z",
    "asset_id": 7,
    "asset_code": "Mac-1",
    "asset_name": "Macbook Pro M1",
    "category_name": "Macbook",
    "category_image": "macbook.png",
    "category_image_url": "http://192.168.56.1:3000/images/categories/macbook.png"
  }
]
```

**Use case:** Display active requests in Flutter app's "My Requests" screen

---

### 2. Get Student's Borrowing History
```
GET /api/student/history/:uid
```

Returns complete borrowing history (all statuses: pending, approved, borrowed, returned, cancelled, rejected).

**Parameters:**
- `uid` (path parameter) - Student's user ID

**Response:**
```json
[
  {
    "borrowing_id": 3,
    "status": "pending",
    "borrow_date": "2025-11-05T00:00:00.000Z",
    "return_date": "2025-11-12T00:00:00.000Z",
    "returned_at": null,
    "asset_id": 7,
    "asset_code": "Mac-1",
    "asset_name": "Macbook Pro M1",
    "category_name": "Macbook",
    "category_image": "macbook.png",
    "approver_first_name": null,
    "approver_last_name": null,
    "category_image_url": "http://192.168.56.1:3000/images/categories/macbook.png"
  }
]
```

**Use case:** Display borrowing history in Flutter app's "History" screen

---

### 3. Cancel Pending Request
```
PUT /api/student/cancel/:borrowingId
```

Allows student to cancel their pending borrow request.

**Parameters:**
- `borrowingId` (path parameter) - Borrowing request ID

**Request Body:**
```json
{
  "borrower_id": 9
}
```

**Response:**
```
Request cancelled
```

**Validation:**
- Only the borrower can cancel their request
- Only `pending` status requests can be cancelled
- Asset status is updated back to `available` if no other active requests exist

---

### 4. Submit Borrow Request
```
POST /api/student/borrow
```

Submit a new request to borrow an asset.

**Request Body:**
```json
{
  "borrower_id": 9,
  "asset_id": 7,
  "borrow_date": "2025-11-05",
  "return_date": "2025-11-12"
}
```

**Response:**
```json
{
  "message": "Borrow request submitted",
  "borrowing_id": 3
}
```

**Validation:**
- Asset must be `available`
- Borrow date must be today or later
- Return date must be after borrow date

---

## 🖼️ Image Handling in Server

## ✅ Setup Complete

### Packages Installed:
- **multer**: For handling multipart/form-data file uploads

### Directory Structure:
```
server_asset/
├── public/
│   └── images/
│       ├── categories/  ← Category images
│       │   ├── macbook.png
│       │   ├── ipad.png
│       │   ├── playstation.png
│       │   └── vr.png
│       └── assets/      ← Asset images
```

## Static File Serving

Images are now accessible via HTTP:
```
http://192.168.56.1:3000/images/categories/macbook.png
http://192.168.56.1:3000/images/assets/your-asset.png
```

## API Response Format

### GET /api/student/categories
```json
[
  {
    "category_id": 1,
    "name": "Macbook",
    "image": "macbook.png",
    "imageUrl": "http://192.168.56.1:3000/images/categories/macbook.png",
    "is_active": 1
  }
]
```

## File Upload Endpoints

### Upload Category Image
```
POST /api/upload/category
Content-Type: multipart/form-data

Form Data:
- category_image: (file)
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "filename": "category_image-1699123456789-123456789.png",
  "imageUrl": "http://192.168.56.1:3000/images/categories/category_image-1699123456789-123456789.png"
}
```

### Upload Asset Image
```
POST /api/upload/asset
Content-Type: multipart/form-data

Form Data:
- asset_image: (file)
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "filename": "asset_image-1699123456789-123456789.png",
  "imageUrl": "http://192.168.56.1:3000/images/assets/asset_image-1699123456789-123456789.png"
}
```

## Upload Constraints

- **File size limit**: 5MB
- **Allowed formats**: jpg, jpeg, png, gif
- **Filenames**: Auto-generated with timestamp to prevent conflicts

## For Flutter App

### Display Category Images:
```dart
Image.network(
  category['imageUrl'],  // Use the imageUrl field
  errorBuilder: (context, error, stackTrace) {
    return Icon(Icons.image_not_supported);
  },
)
```

### Upload Image from Flutter:
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> uploadCategoryImage(File imageFile) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://192.168.56.1:3000/api/upload/category'),
  );
  
  request.files.add(
    await http.MultipartFile.fromPath(
      'category_image',
      imageFile.path,
    ),
  );
  
  var response = await request.send();
  
  if (response.statusCode == 200) {
    var responseData = await response.stream.bytesToString();
    print('Upload successful: $responseData');
  }
}
```

## Adding Your Own Images

1. Place your image files in:
   - `public/images/categories/` for category images
   - `public/images/assets/` for asset images

2. Update the database with the filename:
```sql
UPDATE category SET image = 'your-image.png' WHERE category_id = 1;
```

3. The image will be accessible at:
```
http://192.168.56.1:3000/images/categories/your-image.png
```

## Testing

Test image URLs:
```bash
# Test if images are accessible
curl http://localhost:3000/images/categories/macbook.png

# Test categories API
curl http://localhost:3000/api/student/categories
```

All images return **Status 200** ✅
