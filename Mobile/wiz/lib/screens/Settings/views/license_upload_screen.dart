import 'package:flutter/material.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Auth/services/auth_api_service.dart';
import 'package:wiz/services/local_storage_service.dart';
import 'package:wiz/utils/app_routes.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class LicenseUploadScreen extends StatefulWidget {
  final bool fromBooking;
  final Map<String, dynamic>? bookingArguments;

  const LicenseUploadScreen({super.key, this.fromBooking = false, this.bookingArguments});

  @override
  State<LicenseUploadScreen> createState() => _LicenseUploadScreenState();
}

class _LicenseUploadScreenState extends State<LicenseUploadScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _licenseNumberController = TextEditingController();
  final _expireDateController = TextEditingController();
  final _localStorageService = LocalStorageService();
  final _imagePicker = ImagePicker();

  File? _frontImage;
  File? _backImage;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadExistingData();
  }

  Future<void> _loadExistingData() async {
    final licenseData = await _localStorageService.getLicenseData();
    if (licenseData != null) {
      setState(() {
        _fullNameController.text = licenseData['fullName'] ?? '';
        _licenseNumberController.text = licenseData['licenseNumber'] ?? '';
        _expireDateController.text = licenseData['expireDate'] ?? '';
      });
    }
  }

  Future<void> _pickImage(bool isFront) async {
    final XFile? image = await _imagePicker.pickImage(source: ImageSource.camera, imageQuality: 80);

    if (image != null) {
      setState(() {
        if (isFront) {
          _frontImage = File(image.path);
        } else {
          _backImage = File(image.path);
        }
      });
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 3650)),
    );

    if (picked != null) {
      setState(() {
        _expireDateController.text = '${picked.day}/${picked.month}/${picked.year}';
      });
    }
  }

  Future<void> _handleUpload() async {
    if (!_formKey.currentState!.validate()) return;

    if (_frontImage == null || _backImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload both front and back of your license'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Save license data
      await _localStorageService.saveLicenseData(
        fullName: _fullNameController.text,
        licenseNumber: _licenseNumberController.text,
        expireDate: _expireDateController.text,
        frontImagePath: _frontImage!.path,
        backImagePath: _backImage!.path,
      );

      if (!mounted) return;

      // If coming from booking, continue to booking
      if (widget.fromBooking && widget.bookingArguments != null) {
        AppRoutes.navigateAndReplace(context, AppRoutes.booking, arguments: widget.bookingArguments);
      } else {
        // Otherwise, go back to settings or previous screen
        Navigator.pop(context, true);
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('License uploaded successfully'), backgroundColor: Colors.green));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _licenseNumberController.dispose();
    _expireDateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Driver License', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'You have to verify your driving license to be able to start renting. This step is only needed for the first time rent.',
                style: AppStyles.caption(context),
              ),
              const SizedBox(height: 24),

              // Info box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppStyles.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppStyles.primary.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.credit_card, color: AppStyles.primary, size: 40),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'You can update or verify your driving license here.',
                        style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Full Name
              TextFormField(
                controller: _fullNameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter your full name',
                  filled: true,
                  fillColor: AppStyles.surface(context),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your full name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // License Number
              TextFormField(
                controller: _licenseNumberController,
                decoration: InputDecoration(
                  labelText: 'License Number',
                  hintText: 'Enter your license number',
                  filled: true,
                  fillColor: AppStyles.surface(context),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your license number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Expire Date
              TextFormField(
                controller: _expireDateController,
                readOnly: true,
                onTap: _selectDate,
                decoration: InputDecoration(
                  labelText: 'Expire Date',
                  hintText: 'Select expire date',
                  filled: true,
                  fillColor: AppStyles.surface(context),
                  suffixIcon: const Icon(Icons.calendar_today),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select expire date';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Upload Front
              _buildUploadBox('Upload Front of Your Driving License', _frontImage, () => _pickImage(true)),
              const SizedBox(height: 16),

              // Upload Back
              _buildUploadBox('Upload Back of Your Driving License', _backImage, () => _pickImage(false)),
              const SizedBox(height: 32),

              // Upload Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: AppStyles.primaryButtonStyle(context),
                  onPressed: _isLoading ? null : _handleUpload,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text('Upload', style: AppStyles.button),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUploadBox(String title, File? image, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppStyles.surface(context),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: image != null ? AppStyles.primary : Colors.grey.shade300,
            width: 2,
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            Text(
              title,
              style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            if (image != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(image, height: 120, width: double.infinity, fit: BoxFit.cover),
              )
            else
              Icon(Icons.camera_alt, size: 64, color: Colors.grey.shade400),
          ],
        ),
      ),
    );
  }
}
