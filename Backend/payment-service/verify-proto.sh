#!/bin/bash
# Backend/payment-service/verify-proto.sh
# Run this script to verify proto files are correctly set up

echo "========================================="
echo "🔍 Verifying Proto File Setup"
echo "========================================="
echo ""

# Check if booking.proto exists
PROTO_FILE="./proto/booking.proto"

if [ -f "$PROTO_FILE" ]; then
    echo "✅ booking.proto exists at: $PROTO_FILE"
    echo ""
    
    # Show file size
    SIZE=$(wc -c < "$PROTO_FILE")
    echo "📊 File size: $SIZE bytes"
    echo ""
    
    # Check for required service definitions
    echo "🔍 Checking for required gRPC service definitions:"
    echo ""
    
    if grep -q "service BookingService" "$PROTO_FILE"; then
        echo "  ✅ BookingService found"
    else
        echo "  ❌ BookingService NOT found!"
    fi
    
    if grep -q "rpc GetBookingDetails" "$PROTO_FILE"; then
        echo "  ✅ GetBookingDetails method found"
    else
        echo "  ❌ GetBookingDetails method NOT found!"
    fi
    
    if grep -q "rpc UpdateBookingAfterDepositPayment" "$PROTO_FILE"; then
        echo "  ✅ UpdateBookingAfterDepositPayment method found"
    else
        echo "  ❌ UpdateBookingAfterDepositPayment method NOT found!"
    fi
    
    if grep -q "rpc UpdateBookingAfterFinalPayment" "$PROTO_FILE"; then
        echo "  ✅ UpdateBookingAfterFinalPayment method found"
    else
        echo "  ❌ UpdateBookingAfterFinalPayment method NOT found!"
    fi
    
    echo ""
    echo "📋 All service methods in booking.proto:"
    grep "rpc " "$PROTO_FILE" | sed 's/^/  - /'
    
else
    echo "❌ booking.proto NOT FOUND at: $PROTO_FILE"
    echo ""
    echo "📂 Current directory structure:"
    ls -la proto/ 2>/dev/null || echo "  proto/ directory does not exist!"
    echo ""
    echo "⚠️  ACTION REQUIRED:"
    echo "  1. Copy booking.proto from booking-service to payment-service"
    echo "  2. Run: cp ../booking-service/proto/booking.proto ./proto/"
fi

echo ""
echo "========================================="
echo "✅ Verification Complete"
echo "========================================="