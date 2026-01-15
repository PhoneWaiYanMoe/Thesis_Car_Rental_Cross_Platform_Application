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
- Node.js 
- PostgreSQL
- Cloudinary account

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
Create `.env` file from .env.sample

5. **Start the service**
```bash
npm run dev

# Production
npm start
```

## API Endpoints

### 1. Upload Single File (Protected)
```
POST /upload
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
  "fileId": "ec2a9119-e0eb-4678-86ec-733b16202178"
}
```

### 2. Upload Multiple Files (Protected)
```
POST /upload/batch
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
  "fileIds": [
        "ec2a9119-e0eb-4678-86ec-733b16202178",
        "c9ebedbd-9a3a-4beb-8853-0105fec867a3",
        "dbd44226-1fae-4c93-9406-a53ea982df52"
    ]
}
```

### 3. Get Single Media by ID (Public)
```
GET /:id
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
POST /batch
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
GET /batch?ownerType=VEHICLE&ownerId=uuid&type=vehicle_photo
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
DELETE /:id
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