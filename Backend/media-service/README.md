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
