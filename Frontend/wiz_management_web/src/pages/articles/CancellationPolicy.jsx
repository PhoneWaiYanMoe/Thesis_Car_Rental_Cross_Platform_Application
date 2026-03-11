import React from "react";
import {
  XCircle,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-12">
          {/* Logo with decorative background */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-[#6679C0]/20 rounded-full blur-2xl scale-150" />
              {/* Logo container */}
              <div className="relative bg-white rounded-2xl p-1 shadow-2xl border border-gray-100">
                <img
                  src="/images/wiz_logo.png"
                  alt="Wiz Car Rental"
                  className="h-12 sm:h-15 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-[#131A34] mb-3">
            Cancellation Policy
          </h1>
          <p className="text-[#717685] text-sm">
            Wiz Rental Car Management System
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Overview */}
          <section>
            <div className="bg-[#F8F9FF] rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-[#6679C0] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#131A34] mb-2">
                    Important Notice
                  </h3>
                  <p className="text-[#717685]">
                    Our cancellation policy is designed to be fair to both
                    customers and vehicle owners. Refund amounts depend on when
                    you cancel your booking relative to the rental start date.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Customer Cancellations */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Calendar className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  1. Customer Cancellations
                </h2>
                <p className="text-[#717685] mb-4">
                  Cancellation refunds are calculated based on the time between
                  cancellation and the scheduled pickup date:
                </p>

                {/* Refund Timeline with subtle styling */}
                <div className="space-y-3">
                  {/* 48+ hours */}
                  <div className="border-l-4 pl-4 py-3 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-green-900 mb-1">
                          48+ Hours Before Pickup
                        </h4>
                        <p className="text-700 text-sm font-semibold mb-2">
                          Full refund of deposit (100%)
                        </p>
                        <p className="text-[#717685] text-sm">
                          Cancel at least 48 hours before your scheduled pickup
                          time to receive a complete refund of your 30% deposit.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 24-48 hours */}
                  <div className="border-l-4 pl-4 py-3 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-yellow-900 mb-1">
                          24-48 Hours Before Pickup
                        </h4>
                        <p className="text-700 text-sm font-semibold mb-2">
                          50% refund of deposit
                        </p>
                        <p className="text-[#717685] text-sm">
                          Cancellations within 24-48 hours will receive a 50%
                          refund of the deposit paid. The remaining 50% will be
                          retained as a cancellation fee.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Less than 24 hours */}
                  <div className="border-l-4 border-red-500 pl-4 py-3 bg-red-50/30 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 mb-1">
                          Less Than 24 Hours Before Pickup
                        </h4>
                        <p className="text-red-700 text-sm font-semibold mb-2">
                          No refund (0%)
                        </p>
                        <p className="text-[#717685] text-sm">
                          Late cancellations within 24 hours of pickup are not
                          eligible for any refund. The full 30% deposit will be
                          retained.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Owner Cancellations */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <XCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  2. Owner Cancellations
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">2.1 Full Refund:</strong>{" "}
                    If a vehicle owner cancels a confirmed booking, the customer
                    receives a full 100% refund of the deposit, regardless of
                    timing.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">2.2 Penalty:</strong>{" "}
                    Owners who cancel bookings may receive penalties affecting
                    their account standing and visibility on the platform.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.3 Alternative Vehicle:
                    </strong>{" "}
                    Owners are encouraged to provide an alternative vehicle of
                    equal or greater value when possible.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <DollarSign className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  3. Refund Process
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.1 Processing Time:
                    </strong>{" "}
                    Refunds are processed within 5-10 business days from the
                    cancellation date.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.2 Refund Method:
                    </strong>{" "}
                    Refunds are issued to the original payment method used for
                    booking.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.3 Notification:
                    </strong>{" "}
                    You will receive email and in-app notifications confirming
                    your cancellation and refund status.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Special Circumstances */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <AlertTriangle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  4. Special Circumstances
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.1 Emergency Situations:
                    </strong>{" "}
                    In cases of documented emergencies (medical, natural
                    disasters, etc.), contact our customer support for
                    case-by-case evaluation.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.2 Vehicle Issues:
                    </strong>{" "}
                    If a vehicle becomes unavailable due to mechanical issues or
                    accidents, customers receive a full refund or are offered a
                    comparable alternative.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.3 License Verification Failure:
                    </strong>{" "}
                    If first-time renters fail license verification, the full
                    deposit is refunded.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* No-Show Policy */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <AlertTriangle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  5. No-Show Policy
                </h2>
                <div className="border-l-4 border-red-500 pl-4 py-3 bg-red-50/30 rounded-r-lg">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-red-900">Important:</strong> If a
                    customer fails to pick up the vehicle without cancelling the
                    booking (no-show), the full deposit (30%) is forfeited and
                    no refund will be issued.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Modification Policy */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Calendar className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  6. Booking Modifications
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      6.1 Date Changes:
                    </strong>{" "}
                    Customers may request to modify rental dates subject to
                    vehicle availability and owner approval. No additional fees
                    apply if modified more than 48 hours before pickup.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      6.2 Extension Requests:
                    </strong>{" "}
                    Rental period extensions must be approved by the owner and
                    may incur additional charges.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Cancel */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  7. How to Cancel Your Booking
                </h2>
                <div className="space-y-2">
                  <p className="text-[#717685] leading-relaxed">
                    To cancel your booking:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-[#717685] ml-4">
                    <li>Navigate to "My Bookings" in your account</li>
                    <li>Select the booking you wish to cancel</li>
                    <li>Click "Cancel Booking" button</li>
                    <li>
                      Confirm cancellation and provide a reason (optional)
                    </li>
                    <li>
                      Receive confirmation via email and in-app notification
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Enhanced Contact Card with decorative circles */}
        <div className="mt-8 bg-gradient-to-br from-[#6679C0] to-[#131A34] rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">
              Questions About Cancellations?
            </h3>
            <p className="text-white/90 mb-4">
              If you have questions about our cancellation policy or need
              assistance with a cancellation, please contact our support team.
            </p>
            <a
              href="mailto:support@wizrental.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6679C0] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              support@wizrental.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}