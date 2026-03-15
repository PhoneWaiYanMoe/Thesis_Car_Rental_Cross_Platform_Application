import React from "react";
import { FileText, Shield, AlertCircle, CheckCircle } from "lucide-react";

export default function TermsAndConditions() {
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
            Terms and Conditions
          </h1>
          <p className="text-[#717685] text-sm">
            Wiz Rental Car Management System
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  1. Acceptance of Terms
                </h2>
                <p className="text-[#717685] leading-relaxed">
                  By accessing and using our car rental platform, you accept and
                  agree to be bound by these Terms and Conditions. If you do not
                  agree to these terms, please do not use our services.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  2. User Accounts
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.1 Registration:
                    </strong>{" "}
                    You may browse our platform without registration. However,
                    to book a vehicle or list a car as an owner, you must create
                    an account and verify your email address.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.2 Account Security:
                    </strong>{" "}
                    You are responsible for maintaining the confidentiality of
                    your account credentials and for all activities under your
                    account.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.3 Account Types:
                    </strong>{" "}
                    Our platform supports Customer and Owner accounts. Users may
                    upgrade to Owner status after email verification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  3. Customer Responsibilities
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.1 License Verification:
                    </strong>{" "}
                    First-time renters must upload valid driving license photos
                    and selfies for verification by customer support. This is
                    required only once.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.2 Deposit Payment:
                    </strong>{" "}
                    A 30% deposit of the total rental fee is required before
                    booking confirmation. The remaining 70% must be paid before
                    returning the vehicle.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.3 Vehicle Inspection:
                    </strong>{" "}
                    Customers must verify and upload photos confirming the
                    vehicle's condition matches the owner's description at
                    pickup.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.4 Return Proof:
                    </strong>{" "}
                    Customers must upload proof photos confirming the vehicle
                    has been returned in the same condition.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.5 Contract Agreement:
                    </strong>{" "}
                    Both parties must sign a rental contract after booking
                    confirmation and before vehicle pickup.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  4. Car Owner Responsibilities
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.1 Vehicle Listing:
                    </strong>{" "}
                    All vehicle listings require customer support approval.
                    Owners must provide accurate information and necessary
                    documents.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.2 Monthly Updates:
                    </strong>{" "}
                    Owners must update or confirm vehicle information monthly.
                    Unconfirmed vehicles will be delisted until updated.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.3 Rental Confirmation:
                    </strong>{" "}
                    Owners must confirm when vehicles are picked up and
                    returned.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      4.4 Booking Acceptance:
                    </strong>{" "}
                    Owners have the right to accept or decline booking requests.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  5. Insurance and Payment
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      5.1 Insurance Options:
                    </strong>{" "}
                    Customers can choose insurance coverage levels: 0%, 30%,
                    50%, 80%, or 100%. Additional fees apply based on selected
                    coverage.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      5.2 Payment Methods:
                    </strong>{" "}
                    Only online payment methods are accepted. Cash payments are
                    not permitted.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      5.3 Payment Schedule:
                    </strong>{" "}
                    30% deposit before confirmation, 70% final payment before
                    return.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  6. Reviews and Ratings
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    Customers may rate and review vehicles and owners only after
                    completing a rental. All reviews must be honest and based on
                    actual experience.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <AlertCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  7. Reporting and Disputes
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    Users may report vehicles or owners at any time. Customer
                    support will review all reports and take appropriate action.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  8. Account Status and Moderation
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      8.1 Account States:
                    </strong>{" "}
                    Accounts may be in Normal, Suspended, or Banned status.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      8.2 Suspension/Ban:
                    </strong>{" "}
                    Administrators reserve the right to suspend or ban accounts
                    that violate these terms or engage in fraudulent activity.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  9. Liability and Disclaimers
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    Our platform acts as an intermediary between customers and
                    vehicle owners. We are not responsible for the condition of
                    vehicles or the conduct of users.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  10. Changes to Terms
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    We reserve the right to modify these terms at any time.
                    Users will be notified of significant changes via email and
                    in-app notifications.
                  </p>
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
              Questions About These Terms?
            </h3>
            <p className="text-white/90 mb-4">
              For questions about these Terms and Conditions, please contact us
              at:
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