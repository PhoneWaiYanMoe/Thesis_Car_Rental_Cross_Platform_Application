import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/services/media_api_service.dart';
import 'package:signature/signature.dart';

class ContractSigningScreen extends StatefulWidget {
  final String bookingId;

  const ContractSigningScreen({super.key, required this.bookingId});

  @override
  State<ContractSigningScreen> createState() => _ContractSigningScreenState();
}

class _ContractSigningScreenState extends State<ContractSigningScreen> {
  final _bookingApiService = BookingApiService();
  final _mediaApiService = MediaApiService();
  final _imagePicker = ImagePicker();

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _contractUrl;
  String? _contractType;

  // Signing method
  bool _useDigitalSignature = true; // true = draw signature, false = upload scan
  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
  );

  File? _scannedContract;
  bool _agreedToTerms = false;

  @override
  void initState() {
    super.initState();
    _loadContractPreview();
  }

  @override
  void dispose() {
    _signatureController.dispose();
    super.dispose();
  }

  Future<void> _loadContractPreview() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final preview = await _bookingApiService.previewContract(widget.bookingId);
      setState(() {
        _contractUrl = preview['contractUrl'];
        _contractType = preview['contractType'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _pickScannedContract() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _scannedContract = File(image.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _submitSignature() async {
    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to the terms and conditions'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      String signedContractFileId;

      if (_useDigitalSignature) {
        // Convert signature to image
        final signatureImage = await _signatureController.toPngBytes();
        
        if (signatureImage == null || _signatureController.isEmpty) {
          throw Exception('Please draw your signature');
        }

        // Create temporary file
        final tempDir = Directory.systemTemp;
        final tempFile = File('${tempDir.path}/signature_${DateTime.now().millisecondsSinceEpoch}.png');
        await tempFile.writeAsBytes(signatureImage);

        // Upload signature to media service
        signedContractFileId = await _mediaApiService.uploadSingle(
          file: tempFile,
          ownerId: widget.bookingId,
          ownerType: 'REQUEST',
          type: 'contract',
        );

        // Clean up temp file
        await tempFile.delete();
      } else {
        // Upload scanned contract
        if (_scannedContract == null) {
          throw Exception('Please upload a scanned copy of the signed contract');
        }

        signedContractFileId = await _mediaApiService.uploadSingle(
          file: _scannedContract!,
          ownerId: widget.bookingId,
          ownerType: 'REQUEST',
          type: 'contract',
        );
      }

      // Submit to booking service
      await _bookingApiService.signContract(
        bookingId: widget.bookingId,
        signedContractFileId: signedContractFileId,
        agreedToTerms: _agreedToTerms,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contract signed successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return success
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isSubmitting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to sign contract: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Text('Sign Contract', style: AppStyles.h2(context)),
        centerTitle: true,
        backgroundColor: AppStyles.background(context),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? _buildErrorView()
              : _buildSigningView(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text('Error loading contract', style: AppStyles.h3(context)),
            const SizedBox(height: 8),
            Text(_errorMessage ?? 'Unknown error', style: AppStyles.caption(context), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              style: AppStyles.primaryButtonStyle(context),
              onPressed: _loadContractPreview,
              child: Text('Retry', style: AppStyles.button),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSigningView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Contract Preview Card
          _buildContractPreviewCard(),
          const SizedBox(height: 24),

          // Signing Method Selector
          _buildSigningMethodSelector(),
          const SizedBox(height: 24),

          // Signature Area
          if (_useDigitalSignature) _buildDigitalSignatureArea() else _buildScanUploadArea(),
          const SizedBox(height: 24),

          // Terms Agreement
          _buildTermsAgreement(),
          const SizedBox(height: 24),

          // Submit Button
          _buildSubmitButton(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildContractPreviewCard() {
    return Card(
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
                Expanded(
                  child: Text('Rental Contract', style: AppStyles.h3(context)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _contractType == 'owner_custom' ? Colors.purple.withOpacity(0.1) : Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _contractType == 'owner_custom' ? 'Custom' : 'Standard',
                    style: AppStyles.caption(context).copyWith(
                      color: _contractType == 'owner_custom' ? Colors.purple : Colors.blue,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppStyles.background(context),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  Icon(Icons.picture_as_pdf, color: Colors.red, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Contract Document', style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('Tap to view full contract', style: AppStyles.caption(context)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.open_in_new, color: AppStyles.primary),
                    onPressed: () {
                      // TODO: Open contract in PDF viewer
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Contract viewer coming soon')),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSigningMethodSelector() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('How would you like to sign?', style: AppStyles.h3(context)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMethodOption(
                    icon: Icons.draw,
                    title: 'Digital Signature',
                    subtitle: 'Draw your signature',
                    isSelected: _useDigitalSignature,
                    onTap: () => setState(() => _useDigitalSignature = true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMethodOption(
                    icon: Icons.camera_alt,
                    title: 'Upload Scan',
                    subtitle: 'Photo of signed copy',
                    isSelected: !_useDigitalSignature,
                    onTap: () => setState(() => _useDigitalSignature = false),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMethodOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppStyles.primary.withOpacity(0.1) : AppStyles.background(context),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppStyles.primary : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? AppStyles.primary : Colors.grey, size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppStyles.caption(context).copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? AppStyles.primary : null,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: AppStyles.caption(context).copyWith(fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDigitalSignatureArea() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Draw Your Signature', style: AppStyles.h3(context)),
                TextButton.icon(
                  onPressed: () => _signatureController.clear(),
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Clear'),
                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300, width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Signature(
                  controller: _signatureController,
                  backgroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Please sign above using your finger or stylus',
              style: AppStyles.caption(context),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScanUploadArea() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Upload Signed Contract', style: AppStyles.h3(context)),
            const SizedBox(height: 16),
            if (_scannedContract == null)
              GestureDetector(
                onTap: _pickScannedContract,
                child: Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppStyles.background(context),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300, width: 2, style: BorderStyle.solid),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.camera_alt, size: 48, color: AppStyles.primary.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      Text('Take Photo of Signed Contract', style: AppStyles.body(context)),
                      const SizedBox(height: 8),
                      Text('Tap to open camera', style: AppStyles.caption(context)),
                    ],
                  ),
                ),
              )
            else
              Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(_scannedContract!, height: 200, fit: BoxFit.cover),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _pickScannedContract,
                    icon: const Icon(Icons.refresh, color: Colors.white),
                    label: Text('Retake Photo', style: AppStyles.button),
                    style: AppStyles.primaryButtonStyle(context),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTermsAgreement() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: _agreedToTerms,
              onChanged: (value) => setState(() => _agreedToTerms = value ?? false),
              activeColor: AppStyles.primary,
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _agreedToTerms = !_agreedToTerms),
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text.rich(
                    TextSpan(
                      text: 'I have read and agree to the ',
                      style: AppStyles.body(context),
                      children: [
                        TextSpan(
                          text: 'terms and conditions',
                          style: TextStyle(color: AppStyles.primary, fontWeight: FontWeight.w600),
                        ),
                        const TextSpan(text: ' of this rental agreement.'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        style: AppStyles.primaryButtonStyle(context),
        onPressed: _isSubmitting ? null : _submitSignature,
        icon: _isSubmitting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : const Icon(Icons.check_circle, color: Colors.white),
        label: Text(_isSubmitting ? 'Signing...' : 'Sign Contract', style: AppStyles.button),
      ),
    );
  }
}