import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:mime/mime.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:http_parser/http_parser.dart';

class MediaApiService {
  // ─── LOCAL (hit media-service directly, no nginx prefix needed) ───────────
  // static const String _uploadBase  = 'http://10.0.2.2:3008';
  // static const String _uploadBase  = 'http://localhost:3008';

  // ─── PROD (through nginx → location /media/ → wiz_media-service:3008) ────
  // nginx strips the /media prefix before forwarding, so:
  //   /media/upload        → service receives → /upload
  //   /media/upload/batch  → service receives → /upload/batch
  //   /media/media/:id     → service receives → /media/:id
  //   /media/batch         → service receives → /batch
  //   /media/:id (DELETE)  → service receives → /:id
  static const String _base = 'http://206.189.147.242/media';

  final _localStorageService = LocalStorageService();

  Future<String?> _getAuthToken() async {
    try {
      return await _localStorageService.getToken();
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  String _detectMimeType(String filePath) {
    String? mimeType = lookupMimeType(filePath);
    if (mimeType != null) return mimeType;
    final ext = filePath.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'image/jpeg';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL:  POST http://10.0.2.2:3008/upload
  // PROD:   POST http://206.189.147.242/media/upload  → service: /upload
  // ─────────────────────────────────────────────────────────────────────────

  /// Upload single file. Returns fileId on success.
  Future<String> uploadSingle({
    required File file,
    required String ownerId,
    required String ownerType, // VEHICLE, REVIEW, USER, REQUEST
    required String type, // vehicle_photo, document, license, selfie, contract, etc.
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) throw Exception('Authentication required');

      final uploadUrl = '$_base/upload';
      final request = http.MultipartRequest('POST', Uri.parse(uploadUrl));
      request.headers['Authorization'] = 'Bearer $token';

      final mimeType = _detectMimeType(file.path);
      print('📤 Uploading file: ${file.path.split('/').last}');
      print('   MIME type: $mimeType');
      print('   Owner: $ownerType/$ownerId, Type: $type');
      print('   URL: $uploadUrl');

      request.files.add(await http.MultipartFile.fromPath('file', file.path, contentType: MediaType.parse(mimeType)));
      request.fields['ownerId'] = ownerId;
      request.fields['ownerType'] = ownerType;
      request.fields['type'] = type;

      final response = await http.Response.fromStream(await request.send());
      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final fileId = jsonDecode(response.body)['fileId'] as String;
        print('✅ File uploaded successfully: $fileId');
        return fileId;
      }
      final err = jsonDecode(response.body);
      throw Exception(err['message'] ?? 'Failed to upload file (${response.statusCode})');
    } catch (e) {
      print('❌ Upload single file error: $e');
      rethrow;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL:  POST http://10.0.2.2:3008/upload/batch
  // PROD:   POST http://206.189.147.242/media/upload/batch  → service: /upload/batch
  // ─────────────────────────────────────────────────────────────────────────

  /// Upload multiple files in batch. Returns list of fileIds on success.
  Future<List<String>> uploadBatch({
    required List<File> files,
    required String ownerId,
    required String ownerType,
    required String type,
  }) async {
    try {
      final token = await _getAuthToken();
      if (token == null) throw Exception('Authentication required');

      final uploadUrl = '$_base/upload/batch';
      final request = http.MultipartRequest('POST', Uri.parse(uploadUrl));
      request.headers['Authorization'] = 'Bearer $token';

      print('📤 Uploading ${files.length} files...');
      print('   URL: $uploadUrl');

      for (final file in files) {
        final mimeType = _detectMimeType(file.path);
        print('   File: ${file.path.split('/').last} ($mimeType)');
        request.files.add(
          await http.MultipartFile.fromPath('files', file.path, contentType: MediaType.parse(mimeType)),
        );
      }
      request.fields['ownerId'] = ownerId;
      request.fields['ownerType'] = ownerType;
      request.fields['type'] = type;

      final response = await http.Response.fromStream(await request.send());
      print('📥 Batch upload response: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final fileIds = List<String>.from(jsonDecode(response.body)['fileIds']);
        print('✅ ${fileIds.length} files uploaded successfully');
        return fileIds;
      }
      final err = jsonDecode(response.body);
      throw Exception(err['message'] ?? 'Failed to upload files (${response.statusCode})');
    } catch (e) {
      print('❌ Upload batch error: $e');
      rethrow;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL:  GET http://10.0.2.2:3008/media/:id
  // PROD:   GET http://206.189.147.242/media/media/:id  → service: /media/:id
  // ─────────────────────────────────────────────────────────────────────────

  /// Get file by ID (public endpoint)
  Future<MediaFile> getFileById(String fileId) async {
    try {
      final response = await http.get(Uri.parse('$_base/media/$fileId'));
      if (response.statusCode == 200) {
        return MediaFile.fromJson(jsonDecode(response.body)['file']);
      }
      throw Exception('File not found');
    } catch (e) {
      print('❌ Get file error: $e');
      rethrow;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL:  POST http://10.0.2.2:3008/batch
  // PROD:   POST http://206.189.147.242/media/batch  → service: /batch
  // ─────────────────────────────────────────────────────────────────────────

  /// Get multiple files by IDs (public endpoint)
  Future<Map<String, MediaFile>> getBatchByIds(List<String> fileIds) async {
    try {
      final response = await http.post(
        Uri.parse('$_base/batch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'ids': fileIds}),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data.map((k, v) => MapEntry(k, MediaFile.fromJson(v)));
      }
      throw Exception('Failed to get files');
    } catch (e) {
      print('❌ Get batch error: $e');
      rethrow;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL:  GET http://10.0.2.2:3008/batch?...
  // PROD:   GET http://206.189.147.242/media/batch?...  → service: /batch?...
  // ─────────────────────────────────────────────────────────────────────────

  /// Get files by owner (public endpoint)
  Future<List<MediaFile>> getByOwner({required String ownerType, required String ownerId, String? type}) async {
    try {
      final queryParams = {'ownerType': ownerType, 'ownerId': ownerId, if (type != null) 'type': type};
      final uri = Uri.parse('$_base/batch').replace(queryParameters: queryParams);
      final response = await http.get(uri);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['items'] as List).map((i) => MediaFile.fromJson(i)).toList();
      }
      throw Exception('Failed to get files');
    } catch (e) {
      print('❌ Get by owner error: $e');
      rethrow;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL:  DELETE http://10.0.2.2:3008/:id
  // PROD:   DELETE http://206.189.147.242/media/:id  → service: /:id
  // ─────────────────────────────────────────────────────────────────────────

  /// Delete file (protected endpoint)
  Future<void> deleteFile(String fileId) async {
    try {
      final token = await _getAuthToken();
      if (token == null) throw Exception('Authentication required');

      final response = await http.delete(Uri.parse('$_base/$fileId'), headers: {'Authorization': 'Bearer $token'});
      if (response.statusCode == 200) {
        print('✅ File deleted successfully');
      } else {
        final err = jsonDecode(response.body);
        throw Exception(err['message'] ?? 'Failed to delete file');
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
