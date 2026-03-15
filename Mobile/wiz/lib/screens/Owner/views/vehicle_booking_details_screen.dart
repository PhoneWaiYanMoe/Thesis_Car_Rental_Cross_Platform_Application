// lib/screens/Owner/views/vehicle_booking_details_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import 'package:path_provider/path_provider.dart';
import 'package:wiz/constants/app_styles.dart';
import 'package:wiz/screens/Booking/services/booking_api_service.dart';
import 'package:wiz/screens/Owner/models/owner_vehicle_model.dart';
import 'package:wiz/screens/Owner/views/owner_contract_upload_screen.dart';
import 'package:wiz/screens/Owner/views/owner_return_confirmation_screen.dart';
import 'package:wiz/services/media_api_service.dart';

class VehicleBookingsDetailScreen extends StatefulWidget {
  final OwnerVehicle vehicle;

  const VehicleBookingsDetailScreen({super.key, required this.vehicle});

  @override
  State<VehicleBookingsDetailScreen> createState() => _VehicleBookingsDetailScreenState();
}

class _VehicleBookingsDetailScreenState extends State<VehicleBookingsDetailScreen> {
  final BookingApiService _bookingApi = BookingApiService();
  final MediaApiService _mediaApiService = MediaApiService();

  List<OwnerBooking> _bookings = [];
  List<OwnerBooking> _filteredBookings = [];
  bool _isLoading = false;
  String? _error;

  String _selectedStatus = 'all';
  String _sortBy = 'recent';

  int _currentPage = 1;
  final int _bookingsPerPage = 10;

  // Media URLs cache for each booking
  Map<String, Map<String, String>> _bookingMediaUrls = {};
  Set<String> _loadingMediaForBookings = {};

  // Full booking details cache (for contract info on 'booking' status)
  Map<String, BookingDetailsResponse> _bookingDetails = {};
  Set<String> _loadingDetailsForBookings = {};

  // Track bookings where owner has already signed this session
  Set<String> _ownerSignedBookings = {};

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _bookingApi.getOwnerBookings(vehicleId: widget.vehicle.id, status: _selectedStatus);

      setState(() {
        _bookings = response.bookings;
        _applyFilters();
        _isLoading = false;
      });

      print('✅ Loaded ${_bookings.length} bookings for vehicle ${widget.vehicle.name}');

      // Load media for return/completed bookings
      _loadMediaForBookings();
      // Load full details for 'booking' status (to get contract info)
      _loadDetailsForConfirmedBookings();
    } catch (e) {
      print('❌ Error loading bookings: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadDetailsForConfirmedBookings() async {
    for (var booking in _bookings) {
      if (booking.status == 'booking') {
        _loadBookingDetails(booking.id);
      }
    }
  }

  Future<void> _loadBookingDetails(String bookingId) async {
    if (_loadingDetailsForBookings.contains(bookingId)) return;

    setState(() => _loadingDetailsForBookings.add(bookingId));

    try {
      final details = await _bookingApi.getBookingDetails(bookingId);
      if (mounted) {
        setState(() {
          _bookingDetails[bookingId] = details;
          _loadingDetailsForBookings.remove(bookingId);
        });
        print('✅ Loaded details for booking $bookingId — contract: ${details.contract != null}');
      }
    } catch (e) {
      print('❌ Error loading details for booking $bookingId: $e');
      if (mounted) setState(() => _loadingDetailsForBookings.remove(bookingId));
    }
  }

  Future<void> _loadMediaForBookings() async {
    for (var booking in _bookings) {
      if (booking.status == 'return_submitted' || booking.status == 'completed' || booking.status == 'picked_up') {
        _loadBookingMedia(booking.id);
      }
    }
  }

  Future<void> _loadBookingMedia(String bookingId) async {
    if (_loadingMediaForBookings.contains(bookingId)) return;

    setState(() => _loadingMediaForBookings.add(bookingId));

    try {
      final bookingDetails = await _bookingApi.getBookingDetails(bookingId);
      Map<String, String> urls = {};

      if (bookingDetails.returnPhotos != null) {
        for (int i = 0; i < bookingDetails.returnPhotos!.length; i++) {
          try {
            final photoFile = await _mediaApiService.getFileById(bookingDetails.returnPhotos![i]);
            urls['owner_return_$i'] = photoFile.url;
          } catch (e) {
            print('❌ Failed to load owner return photo $i: $e');
          }
        }
      }

      if (bookingDetails.pickupPhotos != null) {
        for (int i = 0; i < bookingDetails.pickupPhotos!.length; i++) {
          try {
            final photoFile = await _mediaApiService.getFileById(bookingDetails.pickupPhotos![i]);
            urls['customer_pickup_$i'] = photoFile.url;
          } catch (e) {
            print('❌ Failed to load customer pickup photo $i: $e');
          }
        }
      }

      if (mounted) {
        setState(() {
          _bookingMediaUrls[bookingId] = urls;
          _loadingMediaForBookings.remove(bookingId);
        });
        print('📦 Total media URLs loaded for booking $bookingId: ${urls.length}');
      }
    } catch (e) {
      print('❌ Error loading media for booking $bookingId: $e');
      if (mounted) setState(() => _loadingMediaForBookings.remove(bookingId));
    }
  }

  void _applyFilters() {
    _filteredBookings = List.from(_bookings);

    switch (_sortBy) {
      case 'recent':
        _filteredBookings.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'active':
        _filteredBookings.sort((a, b) {
          final aActive = ['booking', 'picked_up'].contains(a.status);
          final bActive = ['booking', 'picked_up'].contains(b.status);
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          return b.createdAt.compareTo(a.createdAt);
        });
        break;
      case 'pending':
        _filteredBookings.sort((a, b) {
          if (a.needsAction && !b.needsAction) return -1;
          if (!a.needsAction && b.needsAction) return 1;
          return b.createdAt.compareTo(a.createdAt);
        });
        break;
      case 'amount':
        _filteredBookings.sort((a, b) => b.totalAmount.compareTo(a.totalAmount));
        break;
    }

    _currentPage = 1;
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.tune, color: AppStyles.primary),
                const SizedBox(width: 12),
                Text('Filter & Sort Bookings', style: AppStyles.h2(context)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 24),
            Text('Booking Status', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    {'label': 'All', 'value': 'all'},
                    {'label': 'Pending', 'value': 'pending'},
                    {'label': 'Confirmed', 'value': 'booking'},
                    {'label': 'In Progress', 'value': 'picked_up'},
                    {'label': 'Awaiting Return', 'value': 'return_submitted'},
                    {'label': 'Completed', 'value': 'completed'},
                  ].map((s) {
                    final selected = _selectedStatus == s['value'];
                    return FilterChip(
                      label: Text(s['label'] as String),
                      selected: selected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: selected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _selectedStatus = s['value'] as String);
                        Navigator.pop(context);
                        _loadBookings();
                      },
                    );
                  }).toList(),
            ),
            const SizedBox(height: 24),
            Text('Sort By', style: AppStyles.h3(context)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    {'label': 'Most Recent', 'value': 'recent', 'icon': Icons.access_time},
                    {'label': 'Active First', 'value': 'active', 'icon': Icons.local_shipping},
                    {'label': 'Needs Action', 'value': 'pending', 'icon': Icons.notification_important},
                    {'label': 'Highest Amount', 'value': 'amount', 'icon': Icons.attach_money},
                  ].map((s) {
                    final selected = _sortBy == s['value'];
                    return FilterChip(
                      avatar: Icon(s['icon'] as IconData, size: 18, color: selected ? Colors.white : AppStyles.primary),
                      label: Text(s['label'] as String),
                      selected: selected,
                      selectedColor: AppStyles.primary,
                      checkmarkColor: Colors.white,
                      labelStyle: TextStyle(color: selected ? Colors.white : AppStyles.textPrimary(context)),
                      onSelected: (_) {
                        setState(() => _sortBy = s['value'] as String);
                        Navigator.pop(context);
                        _applyFilters();
                      },
                    );
                  }).toList(),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                style: AppStyles.primaryButtonStyle(context),
                icon: const Icon(Icons.check),
                label: const Text('Apply Filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleUploadContract(OwnerBooking booking) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            OwnerContractUploadScreen(bookingId: booking.id, vehicleName: booking.vehicle['name'] ?? 'Vehicle'),
      ),
    );

    if (result == true && mounted) {
      showDialog(
        context: context,
        builder: (dialogContext) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          backgroundColor: Theme.of(context).colorScheme.surface, // or Colors.grey[900]
          title: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 64),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(height: 12),
              Text(
                'Custom contract uploaded successfully!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16),
              Text('The booking has been updated.', style: TextStyle(fontSize: 16), textAlign: TextAlign.center),
            ],
          ),
          actionsAlignment: MainAxisAlignment.center,
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                // Reload logic after dialog is closed
                setState(() {
                  _bookingDetails.remove(booking.id);
                  _loadBookingDetails(booking.id);
                  _loadBookings();
                });
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.green,
                textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
              ),
              child: const Text('Done'),
            ),
          ],
        ),
      );
    }
  }

  Future<void> _handleAccept(OwnerBooking booking) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accept Booking'),
        content: const Text('Are you sure you want to accept this booking request?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          SizedBox(
            width: 100,
            height: 60,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Accept'),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _bookingApi.acceptBooking(booking.id);

      if (mounted) {
        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface, // adapts to light/dark mode
            title: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 64),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: 12),
                Text(
                  'Booking Accepted Successfully!',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),
                Text(
                  'The booking status has been updated.',
                  style: TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.green,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('Done'),
              ),
            ],
          ),
        );

        // Reload immediately after success (UI feels responsive)
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface,
            title: const Icon(Icons.error_outline_rounded, color: Colors.red, size: 64),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                const Text(
                  'Failed to Accept Booking',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'Error: $e',
                  style: const TextStyle(fontSize: 16, color: Colors.redAccent),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.red,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  Future<void> _handleReject(OwnerBooking booking) async {
    final reasonCtrl = TextEditingController();
    final refundCtrl = TextEditingController(text: booking.totalAmount.toString());

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Booking'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Rejection Reason',
                  hintText: 'Why are you rejecting this booking?',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: refundCtrl,
                decoration: const InputDecoration(labelText: 'Refund Amount (VND)', hintText: 'Enter refund amount'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 8),
              Text(
                'Max refund: ${booking.totalAmount} VND',
                style: AppStyles.caption(context).copyWith(color: Colors.grey),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          SizedBox(
            width: 100,
            height: 60,
            child: ElevatedButton(
              onPressed: () {
                final reason = reasonCtrl.text.trim();
                final refund = int.tryParse(refundCtrl.text) ?? 0;
                if (reason.isEmpty) {
                  showDialog(
                    context: context,
                    builder: (dialogContext) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      backgroundColor: Theme.of(context).colorScheme.surface, // light/dark mode friendly
                      title: const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 64),
                      content: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(height: 12),
                          Text(
                            'Missing Reason',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'Please provide a reason to continue.',
                            style: TextStyle(fontSize: 16),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                      actionsAlignment: MainAxisAlignment.center,
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(dialogContext).pop(),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.orange,
                            textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                          ),
                          child: const Text('OK'),
                        ),
                      ],
                    ),
                  );
                  return;
                }
                Navigator.pop(context, {'reason': reason, 'refundAmount': refund});
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Reject'),
            ),
          ),
        ],
      ),
    );

    if (result == null) return;

    try {
      await _bookingApi.rejectBooking(
        bookingId: booking.id,
        reason: result['reason'],
        refundAmount: result['refundAmount'],
      );

      if (mounted) {
        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface,
            title: const Icon(
              Icons.block_rounded, // or Icons.cancel_rounded / Icons.warning_amber_rounded
              color: Colors.orange,
              size: 64,
            ),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: 12),
                Text(
                  'Booking Rejected',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),
                Text(
                  'The booking has been successfully rejected.\nRelevant parties have been notified.',
                  style: TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.orange,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('Done'),
              ),
            ],
          ),
        );

        // Refresh list immediately after success
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface,
            title: const Icon(Icons.error_outline_rounded, color: Colors.red, size: 64),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                const Text(
                  'Failed to Reject Booking',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'Error: $e',
                  style: const TextStyle(fontSize: 16, color: Colors.redAccent),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.red,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  Future<void> _handleConfirmReturn(OwnerBooking booking) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (_) => OwnerReturnConfirmationScreen(booking: booking)),
    );

    if (result != null && result['success'] == true && mounted) {
      _loadBookings();
    }
  }

  /// Owner signs the contract with a signature pad
  Future<void> _handleOwnerSignContract(OwnerBooking booking) async {
    final signatureController = SignatureController(
      penStrokeWidth: 3,
      penColor: Colors.black,
      exportBackgroundColor: Colors.white,
    );

    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.draw, color: AppStyles.primary),
                  const SizedBox(width: 10),
                  Text('Sign Contract', style: AppStyles.h2(context)),
                  const Spacer(),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context, false)),
                ],
              ),
              const SizedBox(height: 8),
              Text('Draw your signature below to confirm this rental agreement.', style: AppStyles.caption(context)),
              const SizedBox(height: 16),
              Container(
                height: 200,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300, width: 2),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.white,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Signature(controller: signatureController, backgroundColor: Colors.white),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: () => signatureController.clear(),
                    icon: const Icon(Icons.refresh, size: 18),
                    label: const Text('Clear'),
                    style: TextButton.styleFrom(foregroundColor: Colors.grey),
                  ),
                  const Spacer(),
                  TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () => Navigator.pop(context, true),
                    style: AppStyles.primaryButtonStyle(context),
                    icon: const Icon(Icons.check, size: 18),
                    label: const Text('Sign'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed != true) {
      signatureController.dispose();
      return;
    }

    if (signatureController.isEmpty) {
      signatureController.dispose();
      if (mounted) {
        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface, // light/dark mode friendly
            title: const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 64),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: 12),
                Text(
                  'Signature Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),
                Text(
                  'Please draw your signature first to continue.',
                  style: TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.orange,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
      return;
    }

    // Show loading
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const Center(child: CircularProgressIndicator()),
      );
    }

    // Export bytes BEFORE disposing
    final signatureBytes = await signatureController.toPngBytes();
    signatureController.dispose(); // dispose once, right here

    if (signatureBytes == null) {
      if (mounted) Navigator.pop(context); // dismiss loading
      if (mounted) {
        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Export Failed'),
            content: const Text('Failed to export signature.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
      return;
    }

    try {
      // Save to temp file
      final tempDir = await getTemporaryDirectory();
      final signatureFile = File('${tempDir.path}/owner_signature_${DateTime.now().millisecondsSinceEpoch}.png');
      await signatureFile.writeAsBytes(signatureBytes);

      // Upload signature to media service
      final signatureFileId = await _mediaApiService.uploadSingle(
        file: signatureFile,
        ownerId: booking.id,
        ownerType: 'REQUEST',
        type: 'contract',
      );

      // Submit to booking service using OWNER endpoint
      await _bookingApi.ownerSignContract(
        bookingId: booking.id,
        signedContractFileId: signatureFileId,
        agreedToTerms: true,
      );

      // Clean up temp file
      try {
        await signatureFile.delete();
      } catch (_) {}

      if (mounted) {
        Navigator.pop(context); // dismiss loading

        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface,
            title: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 64),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: 12),
                Text(
                  'Contract Signed Successfully!',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),
                Text(
                  'Your signature has been recorded.\nThe booking is now confirmed.',
                  style: TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.green,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('Done'),
              ),
            ],
          ),
        );

        setState(() => _ownerSignedBookings.add(booking.id));
        _bookingDetails.remove(booking.id);
        _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // dismiss loading

        showDialog(
          context: context,
          builder: (dialogContext) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            backgroundColor: Theme.of(context).colorScheme.surface,
            title: const Icon(Icons.error_outline_rounded, color: Colors.red, size: 64),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                const Text(
                  'Failed to Sign Contract',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'Error: $e',
                  style: const TextStyle(fontSize: 16, color: Colors.redAccent),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.red,
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    }
  }

  void _showPhotoDialog(List<String> urls, int initialIndex, String title) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            PageView.builder(
              itemCount: urls.length,
              controller: PageController(initialPage: initialIndex),
              itemBuilder: (context, index) => InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: Image.network(
                    urls[index],
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) =>
                        const Center(child: Icon(Icons.error_outline, color: Colors.white, size: 48)),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<OwnerBooking> get _paginatedBookings {
    final start = (_currentPage - 1) * _bookingsPerPage;
    final end = start + _bookingsPerPage;
    if (start >= _filteredBookings.length) return [];
    return _filteredBookings.sublist(start, end.clamp(0, _filteredBookings.length));
  }

  int get _totalPages => (_filteredBookings.length / _bookingsPerPage).ceil();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bookings', style: AppStyles.h3(context)),
            Text(widget.vehicle.name, style: AppStyles.caption(context).copyWith(fontSize: 12)),
          ],
        ),
        actions: [IconButton(icon: const Icon(Icons.tune), onPressed: _showFilterSheet)],
      ),
      body: Column(
        children: [
          // Vehicle header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppStyles.surface(context),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            child: Row(
              children: [
                if (widget.vehicle.primaryPhoto != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      widget.vehicle.primaryPhoto!,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[300],
                        child: const Icon(Icons.directions_car),
                      ),
                    ),
                  )
                else
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.directions_car),
                  ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.vehicle.name,
                        style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text('${widget.vehicle.totalRentals} total rentals', style: AppStyles.caption(context)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (_filteredBookings.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Text(
                    '${_filteredBookings.length} booking${_filteredBookings.length != 1 ? 's' : ''}',
                    style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  if (_selectedStatus != 'all')
                    TextButton.icon(
                      onPressed: () {
                        setState(() => _selectedStatus = 'all');
                        _loadBookings();
                      },
                      icon: const Icon(Icons.clear_all, size: 18),
                      label: const Text('Clear Filters'),
                      style: TextButton.styleFrom(foregroundColor: AppStyles.primary),
                    ),
                ],
              ),
            ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildErrorState()
                : _filteredBookings.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadBookings,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _paginatedBookings.length,
                      itemBuilder: (context, i) => _buildBookingCard(_paginatedBookings[i]),
                    ),
                  ),
          ),

          if (_filteredBookings.isNotEmpty && _totalPages > 1) _buildPaginationControls(),
        ],
      ),
    );
  }

  Widget _buildBookingCard(OwnerBooking booking) {
    final hasMedia = _bookingMediaUrls.containsKey(booking.id);
    final isLoadingMedia = _loadingMediaForBookings.contains(booking.id);
    final mediaUrls = _bookingMediaUrls[booking.id] ?? {};

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status + action badge
            Row(
              children: [
                _buildStatusBadgeBooking(booking.status),
                const Spacer(),
                if (booking.needsAction)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'ACTION NEEDED',
                      style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            Text('Booking ID: ${booking.id.substring(0, 8)}...', style: AppStyles.caption(context)),
            const SizedBox(height: 8),
            Text(
              'Customer: ${booking.customerId.substring(0, 8)}...',
              style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${_formatDate(booking.startDate)} - ${_formatDate(booking.endDate)}',
                  style: AppStyles.caption(context),
                ),
                const SizedBox(width: 12),
                Text('(${booking.duration})', style: AppStyles.caption(context)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Total: ${_formatPrice(booking.totalAmount)} ₫',
              style: AppStyles.body(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.bold),
            ),

            // Photos for return/completed/picked_up
            if ((booking.status == 'completed' ||
                    booking.status == 'return_submitted' ||
                    booking.status == 'picked_up') &&
                hasMedia) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              _buildReturnPhotosSection(booking.id, mediaUrls),
            ] else if ((booking.status == 'completed' ||
                    booking.status == 'return_submitted' ||
                    booking.status == 'picked_up') &&
                isLoadingMedia) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              _buildLoadingPhotosSection(),
            ],

            const SizedBox(height: 16),

            // ==================== ACTION AREA ====================
            if (booking.status == 'pending')
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _handleReject(booking),
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _handleAccept(booking),
                      style: AppStyles.primaryButtonStyle(context),
                      child: const Text('Accept'),
                    ),
                  ),
                ],
              )
            else if (booking.status == 'booking')
              _buildConfirmedBookingActions(booking)
            else if (booking.status == 'return_submitted')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _handleConfirmReturn(booking),
                  style: AppStyles.primaryButtonStyle(context),
                  child: const Text('Confirm Return'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfirmedBookingActions(OwnerBooking booking) {
    final isLoadingDetails = _loadingDetailsForBookings.contains(booking.id);
    final details = _bookingDetails[booking.id];

    if (isLoadingDetails && details == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(8)),
        child: const Row(
          children: [
            SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 12),
            Text('Loading contract info...'),
          ],
        ),
      );
    }

    final hasContract = details?.contract != null;

    if (hasContract) {
      final contract = details!.contract!;
      final ownerAlreadySigned = contract.ownerHasSigned; // ← KEY CHECK

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          const SizedBox(height: 12),

          // Contract info card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.description, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Contract Ready',
                      style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600, color: Colors.green),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Customer Signed ✓',
                        style: AppStyles.caption(context).copyWith(color: Colors.green, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Customer signed: ${_formatDateTime(contract.signedAt)}', style: AppStyles.caption(context)),
                if (ownerAlreadySigned) ...[
                  const SizedBox(height: 6),
                  Text(
                    'You signed: ${_formatDateTime(contract.ownerSignedAt!)}',
                    style: AppStyles.caption(context).copyWith(color: Colors.green),
                  ),
                ],
                // Customer signature image preview
                if (contract.signedContractUrl != null &&
                    contract.signedContractUrl!.isNotEmpty &&
                    !contract.signedContractUrl!.endsWith('.pdf')) ...[
                  const SizedBox(height: 12),
                  Text('Customer Signature:', style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  _buildSignaturePreview(contract.signedContractUrl!, 'Customer Signature'),
                ],
                // Owner signature image preview (if signed)
                if (ownerAlreadySigned &&
                    contract.ownerSignedContractUrl != null &&
                    contract.ownerSignedContractUrl!.isNotEmpty &&
                    !contract.ownerSignedContractUrl!.endsWith('.pdf')) ...[
                  const SizedBox(height: 12),
                  Text('Your Signature:', style: AppStyles.caption(context).copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  _buildSignaturePreview(contract.ownerSignedContractUrl!, 'Owner Signature'),
                ],
              ],
            ),
          ),

          const SizedBox(height: 12),

          if (details.pickupPhotos != null && details.pickupPhotos!.isNotEmpty) ...[
            _buildPickupPhotosFetcher(details.pickupPhotos!),
            const SizedBox(height: 12),
          ],

          // Show signed confirmation OR sign button
          if (ownerAlreadySigned)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'You have signed this contract',
                          style: AppStyles.body(context).copyWith(color: Colors.green, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Waiting for customer to pickup the vehicle.',
                          style: AppStyles.caption(context).copyWith(color: Colors.green.shade700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _handleOwnerSignContract(booking),
                style: AppStyles.primaryButtonStyle(context),
                icon: const Icon(Icons.draw, size: 20),
                label: const Text('Sign Contract as Owner'),
              ),
            ),
        ],
      );
    } else {
      // No contract yet
      return Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Customer has not signed yet. You can upload a custom contract (optional).',
                    style: AppStyles.caption(context).copyWith(color: Colors.blue.shade700),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _handleUploadContract(booking),
              style: AppStyles.primaryButtonStyle(context),
              icon: const Icon(Icons.upload_file, size: 20),
              label: const Text('Upload Custom Contract'),
            ),
          ),
        ],
      );
    }
  }

  Widget _buildSignaturePreview(String url, String label) {
    return GestureDetector(
      onTap: () => _showPhotoDialog([url], 0, label),
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
          color: Colors.white,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            url,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return const Center(child: CircularProgressIndicator(strokeWidth: 2));
            },
          ),
        ),
      ),
    );
  }

  /// Inline pickup photos fetcher widget (uses FutureBuilder to resolve IDs → URLs)
  Widget _buildPickupPhotosFetcher(List<String> photoIds) {
    return FutureBuilder<List<String>>(
      future: Future.wait(
        photoIds.map((id) async {
          try {
            final file = await _mediaApiService.getFileById(id);
            return file.url;
          } catch (_) {
            return '';
          }
        }),
      ),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return _buildLoadingPhotosSection();
        }
        final urls = snapshot.data!.where((u) => u.isNotEmpty).toList();
        if (urls.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.photo_camera, color: Colors.blue, size: 16),
                const SizedBox(width: 6),
                Text('Customer Pickup Photos', style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(width: 6),
                Text('(${urls.length})', style: AppStyles.caption(context)),
              ],
            ),
            const SizedBox(height: 8),
            _buildPhotoGallery(urls, 'Customer Pickup', Colors.blue),
          ],
        );
      },
    );
  }

  Widget _buildReturnPhotosSection(String bookingId, Map<String, String> mediaUrls) {
    List<String> ownerReturnUrls = [];
    List<String> customerPickupUrls = [];

    mediaUrls.forEach((key, value) {
      if (key.startsWith('owner_return_')) ownerReturnUrls.add(value);
      if (key.startsWith('customer_pickup_')) customerPickupUrls.add(value);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (ownerReturnUrls.isNotEmpty) ...[
          Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 16),
              const SizedBox(width: 6),
              Text('Your Return Confirmation', style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          _buildPhotoGallery(ownerReturnUrls, 'Your Return Photos', Colors.green),
        ],
        if (customerPickupUrls.isNotEmpty) ...[
          if (ownerReturnUrls.isNotEmpty) const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.photo_camera, color: Colors.blue, size: 16),
              const SizedBox(width: 6),
              Text('Customer Pickup Photos', style: AppStyles.body(context).copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          _buildPhotoGallery(customerPickupUrls, 'Customer Pickup', Colors.blue),
        ],
        if (ownerReturnUrls.isEmpty && customerPickupUrls.isEmpty)
          Text('No photos available', style: AppStyles.caption(context).copyWith(color: Colors.grey)),
      ],
    );
  }

  Widget _buildPhotoGallery(List<String> urls, String title, Color accentColor) {
    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: urls.length,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => _showPhotoDialog(urls, index, title),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: accentColor.withOpacity(0.3), width: 2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Image.network(
                  urls[index],
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 80,
                    height: 80,
                    color: Colors.grey.shade300,
                    child: const Icon(Icons.broken_image, color: Colors.grey),
                  ),
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey.shade200,
                      child: Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                              : null,
                          strokeWidth: 2,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingPhotosSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
          const SizedBox(width: 12),
          Text('Loading photos...', style: AppStyles.caption(context)),
        ],
      ),
    );
  }

  Widget _buildStatusBadgeBooking(String status) {
    Color color;
    String label;

    switch (status) {
      case 'pending':
        color = Colors.orange;
        label = 'PENDING';
        break;
      case 'booking':
        color = Colors.blue;
        label = 'CONFIRMED';
        break;
      case 'picked_up':
        color = Colors.purple;
        label = 'IN PROGRESS';
        break;
      case 'return_submitted':
        color = Colors.indigo;
        label = 'AWAITING CONFIRMATION';
        break;
      case 'completed':
        color = Colors.green;
        label = 'COMPLETED';
        break;
      case 'cancelled':
        color = Colors.red;
        label = 'CANCELLED';
        break;
      default:
        color = Colors.grey;
        label = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildPaginationControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppStyles.surface(context),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton.icon(
            onPressed: _currentPage > 1 ? () => setState(() => _currentPage--) : null,
            icon: const Icon(Icons.chevron_left),
            label: const Text('Previous'),
            style: TextButton.styleFrom(foregroundColor: AppStyles.primary, disabledForegroundColor: Colors.grey),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppStyles.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Page $_currentPage of $_totalPages',
              style: AppStyles.body(context).copyWith(color: AppStyles.primary, fontWeight: FontWeight.w600),
            ),
          ),
          TextButton.icon(
            onPressed: _currentPage < _totalPages ? () => setState(() => _currentPage++) : null,
            icon: const Icon(Icons.chevron_right),
            label: const Text('Next'),
            style: TextButton.styleFrom(foregroundColor: AppStyles.primary, disabledForegroundColor: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox, size: 64, color: AppStyles.textSecondary(context).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('No bookings yet', style: AppStyles.h3(context)),
          const SizedBox(height: 8),
          Text(
            _selectedStatus != 'all' ? 'No bookings with this status' : 'Bookings will appear here',
            style: AppStyles.caption(context),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text('Failed to load bookings', style: AppStyles.body(context)),
          Text(_error ?? 'Unknown error', style: AppStyles.caption(context)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: _loadBookings,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) => '${date.day}/${date.month}/${date.year}';

  String _formatDateTime(DateTime date) =>
      '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

  String _formatPrice(int price) =>
      price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}
