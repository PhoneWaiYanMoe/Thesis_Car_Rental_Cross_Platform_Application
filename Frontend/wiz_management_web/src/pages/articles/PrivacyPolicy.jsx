import React from "react";
import { Shield, Eye, Lock, Database, UserCheck, Bell } from "lucide-react";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-[#717685] text-sm">
            Wiz Rental Car Management System
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Introduction */}
          <section>
            <div className="bg-[#F8F9FF] rounded-xl p-6 mb-6">
              <p className="text-[#717685] leading-relaxed">
                We respect your privacy and are committed to protecting your
                personal data. This privacy policy explains how we collect, use,
                store, and protect your information when you use our car rental
                platform.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Database className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-4">
                  1. Information We Collect
                </h2>

                {/* Account Information */}
                <div className="mb-4">
                  <h3 className="font-semibold text-[#131A34] mb-2">
                    1.1 Account Information
                  </h3>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Full name and email address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Phone number (optional)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Profile photo (optional)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Account preferences (language, theme)</span>
                    </li>
                  </ul>
                </div>

                {/* Verification Documents */}
                <div className="mb-4">
                  <h3 className="font-semibold text-[#131A34] mb-2">
                    1.2 Verification Documents
                  </h3>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        Driving license photos (for first-time renters)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Selfie photos for identity verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Vehicle documentation (for car owners)</span>
                    </li>
                  </ul>
                </div>

                {/* Payment Information */}
                <div className="mb-4">
                  <h3 className="font-semibold text-[#131A34] mb-2">
                    1.3 Payment Information
                  </h3>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Payment method details (encrypted)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Transaction history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Billing information</span>
                    </li>
                  </ul>
                </div>

                {/* Usage Data */}
                <div className="mb-4">
                  <h3 className="font-semibold text-[#131A34] mb-2">
                    1.4 Usage Data
                  </h3>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Booking history and rental details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Search queries and preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Reviews and ratings you provide</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        Messages and communications within the platform
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        Location data (when location services are enabled)
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Vehicle Photos */}
                <div>
                  <h3 className="font-semibold text-[#131A34] mb-2">
                    1.5 Vehicle Condition Photos
                  </h3>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Photos uploaded at vehicle pickup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Photos uploaded at vehicle return</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Eye className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  2. How We Use Your Information
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.1 Service Delivery:
                    </strong>{" "}
                    To facilitate bookings, process payments, verify identities,
                    and enable communication between customers and owners.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.2 Account Management:
                    </strong>{" "}
                    To create and manage your account, provide customer support,
                    and respond to your inquiries.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.3 Safety and Security:
                    </strong>{" "}
                    To verify identities, prevent fraud, resolve disputes, and
                    ensure platform safety.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">2.4 Analytics:</strong>{" "}
                    To analyze platform usage, improve our services, and provide
                    analytics to vehicle owners.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.5 Communications:
                    </strong>{" "}
                    To send booking confirmations, notifications, updates, and
                    important information via email, in-app messages, and push
                    notifications.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      2.6 Legal Compliance:
                    </strong>{" "}
                    To comply with legal obligations and enforce our Terms and
                    Conditions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <UserCheck className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  3. Information Sharing
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.1 With Other Users:
                    </strong>{" "}
                    When you book a vehicle, your name and contact information
                    are shared with the vehicle owner. Vehicle owners'
                    information is similarly shared with customers.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.2 With Customer Support:
                    </strong>{" "}
                    Customer support staff can access your information to verify
                    identities, resolve issues, and approve requests.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.3 With Service Providers:
                    </strong>{" "}
                    We share data with payment processors, cloud storage
                    providers, and other service providers necessary for
                    platform operation.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.4 Legal Requirements:
                    </strong>{" "}
                    We may disclose information when required by law, court
                    order, or government regulation.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      3.5 Business Transfers:
                    </strong>{" "}
                    In case of merger, acquisition, or asset sale, your
                    information may be transferred to the new entity.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Lock className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  4. Data Security
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    We implement industry-standard security measures to protect
                    your personal information:
                  </p>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>SSL/TLS encryption for data transmission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Encrypted storage of sensitive information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Regular security audits and updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>Access controls and authentication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        Secure payment processing through certified providers
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  5. Your Privacy Rights
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">5.1 Access:</strong> You
                    can access and view your personal information in your
                    account settings.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">5.2 Correction:</strong>{" "}
                    You can update or correct your information at any time
                    through your account.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">5.3 Deletion:</strong>{" "}
                    You may request deletion of your account and personal data
                    by contacting support.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">
                      5.4 Data Portability:
                    </strong>{" "}
                    You can request a copy of your data in a portable format.
                  </p>
                  <p className="text-[#717685] leading-relaxed">
                    <strong className="text-[#131A34]">5.5 Opt-Out:</strong> You
                    can opt out of marketing communications while still
                    receiving essential service notifications.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Bell className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  6. Notifications and Communications
                </h2>
                <div className="space-y-3">
                  <p className="text-[#717685] leading-relaxed">
                    We send three types of communications:
                  </p>
                  <ul className="space-y-2 text-[#717685] ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        <strong className="text-[#131A34]">Essential:</strong>{" "}
                        Booking confirmations, payment receipts, and security
                        alerts (cannot opt out)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        <strong className="text-[#131A34]">
                          Service Updates:
                        </strong>{" "}
                        Platform updates and important announcements
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6679C0] mt-1">•</span>
                      <span>
                        <strong className="text-[#131A34]">
                          Push Notifications:
                        </strong>{" "}
                        Reminders and updates (can be disabled in settings)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Database className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  7. Data Retention
                </h2>
                <p className="text-[#717685] leading-relaxed">
                  We retain your personal information for as long as your
                  account is active or as needed to provide services. After
                  account deletion, we may retain certain information for legal,
                  tax, or regulatory purposes for up to 7 years.
                </p>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  8. Children's Privacy
                </h2>
                <p className="text-[#717685] leading-relaxed">
                  Our services are not intended for users under 18 years of age.
                  We do not knowingly collect information from children. If you
                  believe we have collected information from a child, please
                  contact us immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F8F9FF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Bell className="w-5 h-5 text-[#6679C0]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#131A34] mb-3">
                  9. Changes to This Policy
                </h2>
                <p className="text-[#717685] leading-relaxed">
                  We may update this privacy policy from time to time. We will
                  notify you of significant changes via email and in-app
                  notifications. Your continued use of the platform after
                  changes constitutes acceptance of the updated policy.
                </p>
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
              Questions About Your Privacy?
            </h3>
            <p className="text-white/90 mb-4">
              If you have questions about this privacy policy or how we handle
              your data, please contact us:
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:privacy@wizrental.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6679C0] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                privacy@wizrental.com
              </a>
              <a
                href="mailto:support@wizrental.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                support@wizrental.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}