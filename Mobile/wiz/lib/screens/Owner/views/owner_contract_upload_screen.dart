import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';

class OwnerContractUploadScreen extends StatefulWidget {
  final String bookingId;
  final String vehicleName;

  const OwnerContractUploadScreen({super.key, required this.bookingId, required this.vehicleName});

  @override
  State<OwnerContractUploadScreen> createState() => _OwnerContractUploadScreenState();
}

class _OwnerContractUploadScreenState extends State<OwnerContractUploadScreen> {
  final _bookingApiService = BookingApiService();

  File? _contractFile;
  bool _isUploading = false;
  String? _errorMessage;

  Future<void> _pickContractFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _contractFile = File(result.files.single.path!);
          _errorMessage = null;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to pick file: $e';
      });
    }
  }

  Future<void> _uploadContract() async {
    if (_contractFile == null) {
      setState(() {
        _errorMessage = 'Please select a contract file first';
      });
      return;
    }

    setState(() {
      _isUploading = true;
      _errorMessage = null;
    });

    try {
      await _bookingApiService.uploadOwnerContract(bookingId: widget.bookingId, contractFile: _contractFile!);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contract uploaded successfully! Customer has been notified.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isUploading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to upload contract: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Upload Custom Contract', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Booking Info
            Card(
              color: AppStyles.surface(context),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.description, color: AppStyles.primary, size: 24),
                        const SizedBox(width: 12),
                        Expanded(child: Text('Custom Rental Contract', style: AppStyles.h3(context))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text('Vehicle: ${widget.vehicleName}', style: AppStyles.body(context)),
                    const SizedBox(height: 4),
                    Text('Booking ID: ${widget.bookingId.substring(0, 8)}...', style: AppStyles.caption(context)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Instructions
            Card(
              color: Colors.blue.shade50,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                        const SizedBox(width: 8),
                        Text('Instructions', style: AppStyles.h1(context).copyWith(color: Colors.blue.shade700)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '• Upload your custom rental agreement (PDF or image)\n'
                      '• This will replace the platform-generated contract\n'
                      '• Customer will be notified to review and sign\n'
                      '• Accepted formats: PDF, JPG, PNG',
                      style: AppStyles.caption(context),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // File Picker
            Text('Contract File', style: AppStyles.h3(context)),
            const SizedBox(height: 12),

            if (_contractFile == null)
              GestureDetector(
                onTap: _pickContractFile,
                child: Container(
                  width: double.infinity,
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppStyles.surface(context),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300, width: 2, style: BorderStyle.solid),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.upload_file, size: 48, color: AppStyles.primary.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      Text('Tap to Select Contract File', style: AppStyles.body(context)),
                      const SizedBox(height: 8),
                      Text('PDF, JPG, or PNG', style: AppStyles.caption(context)),
                    ],
                  ),
                ),
              )
            else
              Card(
                color: AppStyles.surface(context),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(
                            _contractFile!.path.endsWith('.pdf') ? Icons.picture_as_pdf : Icons.image,
                            color: _contractFile!.path.endsWith('.pdf') ? Colors.red : Colors.blue,
                            size: 40,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _contractFile!.path.split('/').last,
                                  style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${(_contractFile!.lengthSync() / 1024).toStringAsFixed(1)} KB',
                                  style: AppStyles.caption(context),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.red),
                            onPressed: () => setState(() => _contractFile = null),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _pickContractFile,
                          icon: const Icon(Icons.swap_horiz),
                          label: const Text('Choose Different File'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppStyles.primary,
                            side: BorderSide(color: AppStyles.primary),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),

            // Error Message
            if (_errorMessage != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade300),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red.shade700, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: AppStyles.caption(context).copyWith(color: Colors.red.shade700),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            // Upload Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: AppStyles.primaryButtonStyle(context),
                onPressed: _isUploading ? null : _uploadContract,
                icon: _isUploading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.cloud_upload, color: Colors.white),
                label: Text(_isUploading ? 'Uploading...' : 'Upload Contract', style: AppStyles.button),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
