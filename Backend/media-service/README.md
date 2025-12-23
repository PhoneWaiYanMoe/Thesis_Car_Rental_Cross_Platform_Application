# Media Service - Wiz Car Rental Platform

## Overview
The Media Service handles file uploads, image processing, and storage for the Wiz Car Rental Platform. It supports uploading avatars, vehicle photos, documents, licenses, and more.

## Features
- Single and batch file uploads
- Image processing and optimization with Sharp
- Automatic thumbnail generation
- Cloud storage with Cloudinary
- JWT authentication
- File type validation
- Size limit enforcement
- Temporary URL generation
- File metadata tracking

## Tech Stack
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL with Sequelize ORM
- **Storage**: Cloudinary
- **Image Processing**: Sharp
- **File Upload**: Multer
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
Create `.env` file with your credentials (see `.env` file)

5. **Start the service**
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## API Endpoints

### Upload Single File
```
POST /api/v1/media/upload
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - file: (file)
  - type: "avatar" | "vehicle_photo" | "document" | "review_photo" | "license" | "selfie" | "passport"
  - category: (optional)
```

### Upload Multiple Files
```
POST /api/v1/media/upload/batch
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - files[]: (multiple files, max 10)
  - type: (string)
  - category: (optional)
```

### Get File by ID
```
GET /api/v1/media/:id
Headers: Authorization: Bearer <token>
```

### Delete File
```
DELETE /api/v1/media/:id
Headers: Authorization: Bearer <token>
```

### Get User's Files
```
GET /api/v1/media/user/files?type=avatar
Headers: Authorization: Bearer <token>
Query: type (optional filter)
```

## File Types Supported
- **Images**: JPEG, PNG, JPG, WebP
- **Documents**: PDF, DOC, DOCX

## File Size Limits
- Maximum file size: 5MB (configurable in .env)
- Maximum files per batch: 10

## Database Schema

### media_files table
- id (UUID, Primary Key)
- user_id (UUID)
- type (ENUM)
- category (String)
- url (Text)
- thumbnail_url (Text)
- cloudinary_public_id (String)
- file_name (String)
- mime_type (String)
- size (Integer)
- width (Integer, nullable)
- height (Integer, nullable)
- uploaded_at (Timestamp)

## Image Processing
- Images are automatically resized to max 1200px width
- Thumbnails are generated at 300x300px
- JPEG optimization at 85% quality
- WebP support for modern browsers

## Testing
See TESTING_GUIDE.md for comprehensive manual testing instructions.

## Security
- JWT authentication required for all endpoints
- File type validation
- Size limit enforcement
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers

## Error Handling
All endpoints return consistent JSON responses:
```json
{
  "success": true/false,
  "message": "...",
  "data": {...}
}
```

## Cloudinary Integration
The service uses Cloudinary for reliable cloud storage:
- Automatic CDN delivery
- Image transformations on-the-fly
- Secure signed URLs
- Automatic backup

## Support
For issues or questions, contact the development team.