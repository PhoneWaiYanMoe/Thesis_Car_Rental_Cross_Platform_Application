import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:http_parser/http_parser.dart';

class MediaApiService {
  static const String baseUrl = 'http://10.0.2.2:3008'; // media-service
  final _localStorageService = LocalStorageService();

  // Get auth token
  Future<String?> _getAuthToken() async {
    try {
      final token = await _localStorageService.getToken();
      return token;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  /// Upload single file with MIME type detection
  /// Returns fileId on success
  Future<String> uploadSingle({
    required File file,
    required String ownerId,
    required String ownerType, // VEHICLE, REVIEW, USER, REQUEST
    required String type, // vehicle_photo, document, review_photo, license, selfie, etc.
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload'));

      request.headers['Authorization'] = 'Bearer $token';

      // ✅ FIX: Properly detect MIME type from file
      String? mimeType = lookupMimeType(file.path);

      // ✅ FALLBACK: If MIME type not detected, use default based on extension
      if (mimeType == null) {
        final extension = file.path.split('.').last.toLowerCase();
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          default:
            mimeType = 'image/jpeg'; // Default to JPEG
        }
      }

      print('📤 Uploading file: ${file.path}');
      print('   MIME type: $mimeType');
      print('   Owner: $ownerType/$ownerId, Type: $type');

      // Add file with explicit MIME type
      final multipartFile = await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: MediaType.parse(mimeType),
      );
      request.files.add(multipartFile);

      // Add fields
      request.fields['ownerId'] = ownerId;
      request.fields['ownerType'] = ownerType;
      request.fields['type'] = type;

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final fileId = data['fileId'];
        print('✅ File uploaded successfully: $fileId');
        return fileId;
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to upload file');
      }
    } catch (e) {
      print('❌ Upload single file error: $e');
      rethrow;
    }
  }

  /// Upload multiple files in batch with MIME type detection
  /// Returns list of fileIds on success
  Future<List<String>> uploadBatch({
    required List<File> files,
    required String ownerId,
    required String ownerType,
    required String type,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload/batch'));

      request.headers['Authorization'] = 'Bearer $token';

      print('📤 Uploading ${files.length} files...');

      // ✅ FIX: Add all files with proper MIME type detection
      for (final file in files) {
        String? mimeType = lookupMimeType(file.path);

        // Fallback MIME type detection
        if (mimeType == null) {
          final extension = file.path.split('.').last.toLowerCase();
          switch (extension) {
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              break;
            case 'png':
              mimeType = 'image/png';
              break;
            case 'webp':
              mimeType = 'image/webp';
              break;
            case 'pdf':
              mimeType = 'application/pdf';
              break;
            default:
              mimeType = 'image/jpeg';
          }
        }

        print('   File: ${file.path.split('/').last} (${mimeType})');

        final multipartFile = await http.MultipartFile.fromPath(
          'files',
          file.path,
          contentType: MediaType.parse(mimeType),
        );
        request.files.add(multipartFile);
      }

      // Add fields
      request.fields['ownerId'] = ownerId;
      request.fields['ownerType'] = ownerType;
      request.fields['type'] = type;

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('📥 Batch upload response: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final fileIds = List<String>.from(data['fileIds']);
        print('✅ ${fileIds.length} files uploaded successfully');
        return fileIds;
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to upload files');
      }
    } catch (e) {
      print('❌ Upload batch error: $e');
      rethrow;
    }
  }

  /// Get file by ID (public endpoint)
  Future<MediaFile> getFileById(String fileId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/media/$fileId'));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return MediaFile.fromJson(data['file']);
      } else {
        throw Exception('File not found');
      }
    } catch (e) {
      print('❌ Get file error: $e');
      rethrow;
    }
  }

  /// Get multiple files by IDs (public endpoint)
  Future<Map<String, MediaFile>> getBatchByIds(List<String> fileIds) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/batch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'ids': fileIds}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final result = <String, MediaFile>{};

        data.forEach((key, value) {
          result[key] = MediaFile.fromJson(value);
        });

        return result;
      } else {
        throw Exception('Failed to get files');
      }
    } catch (e) {
      print('❌ Get batch error: $e');
      rethrow;
    }
  }

  /// Get files by owner (public endpoint)
  Future<List<MediaFile>> getByOwner({required String ownerType, required String ownerId, String? type}) async {
    try {
      final queryParams = {'ownerType': ownerType, 'ownerId': ownerId, if (type != null) 'type': type};

      final uri = Uri.parse('$baseUrl/batch').replace(queryParameters: queryParams);
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final items = data['items'] as List;
        return items.map((item) => MediaFile.fromJson(item)).toList();
      } else {
        throw Exception('Failed to get files');
      }
    } catch (e) {
      print('❌ Get by owner error: $e');
      rethrow;
    }
  }

  /// Delete file (protected endpoint)
  Future<void> deleteFile(String fileId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) {
        throw Exception('Authentication required');
      }

      final response = await http.delete(Uri.parse('$baseUrl/$fileId'), headers: {'Authorization': 'Bearer $token'});

      if (response.statusCode == 200) {
        print('✅ File deleted successfully');
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to delete file');
      }
    } catch (e) {
      print('❌ Delete file error: $e');
      rethrow;
    }
  }
}

// ==================== MODELS ====================

class MediaFile {
  final String id;
  final String url;
  final String? thumbnailUrl;
  final String ownerId;
  final String ownerType;
  final String uploaderId;
  final String type;
  final int? width;
  final int? height;
  final String fileName;
  final int size;
  final String mimeType;
  final DateTime uploadedAt;

  MediaFile({
    required this.id,
    required this.url,
    this.thumbnailUrl,
    required this.ownerId,
    required this.ownerType,
    required this.uploaderId,
    required this.type,
    this.width,
    this.height,
    required this.fileName,
    required this.size,
    required this.mimeType,
    required this.uploadedAt,
  });

  factory MediaFile.fromJson(Map<String, dynamic> json) {
    return MediaFile(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      thumbnailUrl: json['thumbnailUrl'],
      ownerId: json['ownerId'] ?? '',
      ownerType: json['ownerType'] ?? '',
      uploaderId: json['uploaderId'] ?? '',
      type: json['type'] ?? '',
      width: json['width'],
      height: json['height'],
      fileName: json['fileName'] ?? '',
      size: json['size'] ?? 0,
      mimeType: json['mimeType'] ?? '',
      uploadedAt: DateTime.parse(json['uploadedAt']),
    );
  }
}
