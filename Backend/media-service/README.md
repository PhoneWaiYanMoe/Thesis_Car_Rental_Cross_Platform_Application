# Media Service - Wiz Car Rental Platform

## Overview
The Media Service handles file uploads, image processing, and storage for the Wiz Car Rental Platform. It manages media for vehicles, user profiles, reviews, and documents with automatic thumbnail generation and cloud storage.

## Features
- Single and batch file uploads
- Image processing and optimization with Sharp
- Automatic thumbnail generation (300x300px)
- Cloud storage with Cloudinary
- JWT authentication for protected endpoints
- Public access for media retrieval
- File type validation
- Size limit enforcement
- Owner-based media organization
- File metadata tracking

## Tech Stack
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL with Sequelize ORM
- **Storage**: Cloudinary
- **Image Processing**: Sharp
- **File Upload**: Multer (memory storage)
- **Authentication**: JWT

## Prerequisites
- Node.js v18+ 
- PostgreSQL 14+
- Cloudinary account (free tier works)

## Installation

1. **Clone and navigate**
```bash
cd media-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Create PostgreSQL database**
```bash
createdb wiz_media_db
```

4. **Configure environment**
Create `.env` file with your credentials:
```env
# Server
PORT=3008
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wiz_media_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_jwt_secret

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg,image/webp
ALLOWED_DOCUMENT_TYPES=application/pdf
```

5. **Start the service**
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## API Endpoints

### 1. Upload Single File (Protected)
```
POST /api/v1/upload
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - file: (file)
  - ownerId: (UUID) - ID of the entity that owns this media
  - ownerType: "VEHICLE" | "REVIEW" | "USER" | "REQUEST"
  - type: "vehicle_photo" | "document" | "review_photo" | "license" | "selfie" | "passport" | "contract" | "profile"

Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "url": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnails/...",
    "ownerId": "uuid",
    "ownerType": "VEHICLE",
    "uploaderId": "uuid",
    "type": "vehicle_photo",
    "width": 1200,
    "height": 800,
    "fileName": "car.jpg",
    "size": 245678,
    "mimeType": "image/jpeg",
    "uploadedAt": "2025-12-27T..."
  }
}
```

### 2. Upload Multiple Files (Protected)
```
POST /api/v1/upload/batch
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - files: (multiple files, max 10)
  - ownerId: (UUID)
  - ownerType: "VEHICLE" | "REVIEW" | "USER" | "REQUEST"
  - type: (string)

Response:
{
  "success": true,
  "message": "Files uploaded successfully",
  "files": [
    { /* file object */ },
    { /* file object */ }
  ]
}
```

### 3. Get Single Media by ID (Public)
```
GET /api/v1/media/:id
No authentication required

Response:
{
  "success": true,
  "file": {
    "id": "uuid",
    "url": "...",
    "thumbnailUrl": "...",
    "ownerId": "...",
    "ownerType": "VEHICLE",
    "uploaderId": "...",
    "type": "vehicle_photo",
    ...
  }
}
```

### 4. Batch Get Media by IDs (Public)
```
POST /api/v1/media/batch
No authentication required
Body: {
  "ids": ["uuid1", "uuid2", "uuid3"]
}

Response:
{
  "uuid1": {
    "id": "uuid1",
    "url": "...",
    "thumbnailUrl": "...",
    ...
  },
  "uuid2": {
    "id": "uuid2",
    "url": "...",
    ...
  }
}
```
**Note**: Returns object keyed by ID to avoid N+1 query problems.

### 5. Get Media by Owner (Public)
```
GET /api/v1/media/batch?ownerType=VEHICLE&ownerId=uuid&type=vehicle_photo
No authentication required
Query Parameters:
  - ownerType: (required) "VEHICLE" | "REVIEW" | "USER" | "REQUEST"
  - ownerId: (required) UUID
  - type: (optional) filter by media type

Response:
{
  "items": [
    {
      "id": "uuid",
      "url": "...",
      "thumbnailUrl": "...",
      ...
    },
    ...
  ]
}
```

### 6. Delete Media (Protected)
```
DELETE /api/v1/:id
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "File deleted successfully"
}
```
**Authorization**: Only the uploader or users with type "admin" can delete files.

## Owner Types and Use Cases

### VEHICLE
- **ownerId**: Vehicle ID
- **type**: "vehicle_photo"
- Used for: Vehicle listings, photo galleries

### USER  
- **ownerId**: User ID
- **type**: "profile", "license", "selfie", "passport"
- Used for: User profiles, identity verification

### REVIEW
- **ownerId**: Review ID
- **type**: "review_photo"
- Used for: Customer review images

### REQUEST
- **ownerId**: Request ID
- **type**: "document"
- Used for: Rental request attachments

## File Types Supported

### Images
- JPEG, PNG, JPG, WebP
- Automatically processed and optimized
- Thumbnails generated

### Documents
- PDF (stored as-is, no processing)

## File Size Limits
- Maximum file size: 5MB (configurable in .env)
- Maximum files per batch: 10

## Database Schema

### media_files table
```sql
- id (UUID, Primary Key)
- owner_id (UUID, Not Null) - Entity that owns the media
- owner_type (ENUM: VEHICLE, REVIEW, USER, REQUEST, Not Null)
- uploader_id (UUID, Not Null) - User who uploaded the file
- type (ENUM: vehicle_photo, document, review_photo, license, selfie, passport, contract, profile, Not Null)
- url (Text, Not Null) - Cloudinary URL
- thumbnail_url (Text, Nullable) - Thumbnail URL for images
- cloudinary_public_id (String, Not Null) - Internal only, not returned in API
- file_name (String, Not Null)
- mime_type (String, Not Null)
- size (Integer, Not Null) - File size in bytes
- width (Integer, Nullable) - Image width in pixels
- height (Integer, Nullable) - Image height in pixels
- uploaded_at (Timestamp, Default: NOW)
```

## Image Processing
- Images automatically resized to max 1200px width
- Maintains aspect ratio
- Thumbnails generated at 300x300px (cropped to center)
- JPEG optimization at 85% quality
- Thumbnail optimization at 70% quality
- WebP support for modern browsers

## Security

### Protected Endpoints
- `POST /upload` - Requires JWT
- `POST /upload/batch` - Requires JWT  
- `DELETE /:id` - Requires JWT + authorization check

### Public Endpoints
- `GET /media/:id` - No authentication
- `POST /media/batch` - No authentication
- `GET /media/batch` - No authentication

### Security Features
- JWT authentication with Bearer tokens
- File type validation (whitelist only)
- File size limit enforcement
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- Authorization check for deletion (uploader or admin only)

## Error Handling
All endpoints return consistent JSON responses:

**Success**:
```json
{
  "success": true,
  "message": "Operation successful",
  "file": {...} or "files": [...]
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Cloudinary Integration
The service uses Cloudinary for reliable cloud storage:
- Automatic CDN delivery worldwide
- Organized in folders by type (`wiz/vehicle_photo`, `wiz/license`, etc.)
- Thumbnails in separate folders (`wiz/vehicle_photo/thumbnails`)
- Public URLs (permanent, no expiration)
- Automatic image optimization
- Secure file deletion

## Privacy Note
- **cloudinaryPublicId** is stored in the database but **never returned** in API responses
- This prevents external services from directly manipulating Cloudinary resources
- Only URLs are exposed publicly

## Health Check
```
GET /health

Response:
{
  "success": true,
  "service": "Media Service",
  "status": "healthy",
  "timestamp": "2025-12-27T..."
}
```

## Testing

Test all endpoints using Postman or curl:

1. **Upload test** (requires auth token)
2. **Get by ID** (public, no auth)
3. **Batch retrieval** (public)
4. **Get by owner** (public)
5. **Delete** (requires auth + ownership)

See TESTING_GUIDE.md for detailed testing scenarios.

## Future Dockerization
This service is designed to work locally first, then be containerized. When dockerizing:
- Update `DB_HOST` from `localhost` to Docker service name
- Configure Docker Compose for multi-service orchestration
- Use volume mounts for development
- Configure service-to-service networking

## Development Notes
- Uses memory storage (Multer) - files never touch disk
- Database auto-syncs schema in development mode
- All file processing happens in-memory before Cloudinary upload
- Permanent URLs eliminate need for signed/temporary URLs