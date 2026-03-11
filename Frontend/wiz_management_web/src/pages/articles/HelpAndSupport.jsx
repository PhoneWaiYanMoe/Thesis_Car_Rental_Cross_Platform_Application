import React, { useState } from "react";
import {
  HelpCircle,
  Mail,
  ChevronDown,
  Search,
  MessageCircle,
} from "lucide-react";

export default function HelpAndSupport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: 1,
      category: "Getting Started",
      question: "Do I need to create an account to browse cars?",
      answer:
        "No, you can browse available cars without creating an account. However, to book a vehicle, you must register and verify your email address.",
    },
    {
      id: 2,
      category: "Getting Started",
      question: "How do I become a car owner on the platform?",
      answer:
        "Click the 'Become a Car Owner' button on the home screen. You'll need to register (if you haven't already) and verify your email. Then you can add your vehicle by filling in the required information and uploading necessary documents. Your listing will go live after customer support approval.",
    },
    {
      id: 3,
      category: "Booking & Rentals",
      question: "How do I search for available cars?",
      answer:
        "On the home screen, select your desired rental dates and pickup location, then click 'Search Car'. You'll see a list of available vehicles that match your criteria. You can further filter by rating, vehicle type, fuel type, transmission, seating capacity, and more.",
    },
    {
      id: 4,
      category: "Booking & Rentals",
      question: "What is the license verification process?",
      answer:
        "First-time renters must upload photos of their driving license and selfies (front and both sides) during booking. Customer support will review and approve these documents. This verification is required only once - subsequent bookings won't need re-verification.",
    },
    {
      id: 5,
      category: "Booking & Rentals",
      question: "What insurance options are available?",
      answer:
        "We offer 5 insurance coverage levels: 0%, 30%, 50%, 80%, and 100%. Additional fees apply based on your selected coverage level. Choose the option that best suits your needs during the booking process.",
    },
    {
      id: 6,
      category: "Booking & Rentals",
      question: "What payment methods are accepted?",
      answer:
        "We only accept online payment methods. Cash payments are not permitted. You can manage multiple payment methods in your account settings.",
    },
    {
      id: 7,
      category: "Payments",
      question: "When do I need to pay?",
      answer:
        "You pay in two stages: 1) 30% deposit before booking confirmation is sent to customer support and the owner. 2) The remaining 70% final payment must be made right before you submit return proof photos.",
    },
    {
      id: 8,
      category: "Payments",
      question: "How do I manage my payment methods?",
      answer:
        "Go to your account settings to add new payment methods, view your saved payment options, update existing methods, or remove payment methods you no longer use.",
    },
    {
      id: 9,
      category: "Vehicle Pickup & Return",
      question: "What happens after the owner confirms my booking?",
      answer:
        "You'll receive notifications via email, in-app message, and push notification. You must sign a rental contract with the owner after confirmation and before pickup. Then you can either pick up the vehicle or wait for the owner to drop it off at the scheduled time.",
    },
    {
      id: 10,
      category: "Vehicle Pickup & Return",
      question: "What do I need to do at pickup?",
      answer:
        "When you receive the vehicle, you must upload photos to confirm that the car's condition matches what the owner described. This protects both you and the owner.",
    },
    {
      id: 11,
      category: "Vehicle Pickup & Return",
      question: "How do I return the vehicle?",
      answer:
        "You'll receive a notification when the return time is near. Return the car at the scheduled time, then upload proof photos confirming you've returned the vehicle. After uploading return proof, make your final 70% payment.",
    },
    {
      id: 12,
      category: "Reviews & Ratings",
      question: "Can I rate and review vehicles and owners?",
      answer:
        "Yes, but only after you've completed a rental. You can rate and review the vehicle and the owner after your booking is finished. This helps other customers make informed decisions.",
    },
    {
      id: 13,
      category: "Reviews & Ratings",
      question: "Can I report a vehicle or owner without renting?",
      answer:
        "Yes, you can report vehicles or owners at any time without needing to rent from them. Customer support will review all reports.",
    },
    {
      id: 14,
      category: "For Car Owners",
      question: "How do I list my vehicle?",
      answer:
        "After verifying your email, click 'Add New Car' and fill in all required information including vehicle details and necessary documents. Your listing will be reviewed by customer support and goes live only after approval.",
    },
    {
      id: 15,
      category: "For Car Owners",
      question: "Do I need to update my car information regularly?",
      answer:
        "Yes, you must update or confirm your vehicle information every month. If you don't update within the month, your car will be delisted until you confirm the information is still accurate.",
    },
    {
      id: 16,
      category: "For Car Owners",
      question: "Can I accept or decline booking requests?",
      answer:
        "Yes, as a car owner, you have the right to accept or decline booking requests. The customer will be notified of your decision via email, in-app message, and push notification.",
    },
    {
      id: 17,
      category: "For Car Owners",
      question: "What do I need to confirm during rentals?",
      answer:
        "You must confirm two things: 1) When the vehicle is picked up for rental, and 2) When the vehicle is returned. This helps track your vehicle's status accurately.",
    },
    {
      id: 18,
      category: "For Car Owners",
      question: "Can I see analytics for my vehicles?",
      answer:
        "Yes! If you have 1 car, you'll see analysis of earnings and trips. With 2+ cars, you'll see total analytics plus comparison graphs between your vehicles.",
    },
    {
      id: 19,
      category: "For Car Owners",
      question: "What happens when I update my vehicle information?",
      answer:
        "Any updates to your vehicle information must be approved by customer support. During the pending approval period, your car will be temporarily removed from customer view.",
    },
    {
      id: 20,
      category: "Account & Settings",
      question: "What features can I customize in my account?",
      answer:
        "You can change the app theme (light/dark), change language, manage payment methods, view booking history, update personal information, and manage notification preferences.",
    },
    {
      id: 21,
      category: "Account & Settings",
      question: "How do I add vehicles to my favorites?",
      answer:
        "When viewing a vehicle's details, click the heart/favorite icon. You can access your saved favorites anytime from your account.",
    },
    {
      id: 22,
      category: "Account & Settings",
      question: "Can I share vehicle listings with others?",
      answer:
        "Yes, each vehicle detail page has a share icon that lets you share the listing with friends and family through various channels.",
    },
    {
      id: 23,
      category: "Communication",
      question: "How can I communicate with the car owner?",
      answer:
        "After your booking is confirmed, you can have conversations with the owner through our in-app messaging system. You'll also receive important updates via email and push notifications.",
    },
    {
      id: 24,
      category: "Communication",
      question: "What notifications will I receive?",
      answer:
        "You'll receive notifications for booking confirmations, approval/denial updates, pickup reminders, return reminders, messages from owners, and payment confirmations - all via email, in-app messages, and push notifications.",
    },
    {
      id: 25,
      category: "Search & Filters",
      question: "How can I filter search results?",
      answer:
        "You can filter by: rating range, hourly availability, quick book option, vehicle type, fuel type, transmission type, number of seats, and discounts. You can also sort by price (low to high or high to low), rating (high to low), or distance from your location (if location is enabled).",
    },
    {
      id: 26,
      category: "Search & Filters",
      question: "Can I search for specific car owners?",
      answer:
        "Yes, you can search for car owners by name and view a list of all owners. Click on any owner to see their profile with ratings, reviews, response time, and other details.",
    },
  ];

  const categories = [...new Set(faqs.map((faq) => faq.category))];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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
          <h1 className="text-3xl font-bold text-[#131A34] mb-3">
            Help & Support
          </h1>
          <p className="text-[#717685] text-sm">
            Find answers to common questions
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#717685]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all text-[#131A34] placeholder-[#717685]"
            />
          </div>
        </div>

        {/* FAQs by Category */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryFaqs = filteredFaqs.filter(
              (faq) => faq.category === category,
            );

            if (categoryFaqs.length === 0) return null;

            return (
              <div
                key={category}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-[#F8F9FF] px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-[#131A34]">
                    {category}
                  </h2>
                </div>

                {/* FAQs */}
                <div className="divide-y divide-gray-100">
                  {categoryFaqs.map((faq) => (
                    <div key={faq.id} className="transition-all">
                      <button
                        onClick={() => toggleExpand(faq.id)}
                        className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#F8F9FF] transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#131A34] mb-1">
                            {faq.question}
                          </h3>
                          {expandedId === faq.id && (
                            <p className="text-[#717685] leading-relaxed mt-3 pr-4">
                              {faq.answer}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-[#6679C0] flex-shrink-0 mt-1 transition-transform ${
                            expandedId === faq.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredFaqs.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <HelpCircle className="w-16 h-16 text-[#B2BCE0] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#131A34] mb-2">
              No results found
            </h3>
            <p className="text-[#717685]">
              Try different keywords or contact support
            </p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-br from-[#6679C0] to-[#131A34] rounded-2xl p-8 sm:p-10 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
              <p className="text-white/90 mb-4">
                Can't find the answer you're looking for? Our support team is
                here to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:support@wizrental.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#6679C0] rounded-xl font-semibold hover:bg-white/90 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  support@wizrental.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/terms"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#6679C0] hover:shadow-md transition-all text-center"
          >
            <h3 className="font-semibold text-[#131A34] mb-1">
              Terms & Conditions
            </h3>
            <p className="text-sm text-[#717685]">Read our terms of service</p>
          </a>
          <a
            href="/cancellation-policy"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#6679C0] hover:shadow-md transition-all text-center"
          >
            <h3 className="font-semibold text-[#131A34] mb-1">
              Cancellation Policy
            </h3>
            <p className="text-sm text-[#717685]">Learn about refunds</p>
          </a>
          <a
            href="/privacy-policy"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#6679C0] hover:shadow-md transition-all text-center"
          >
            <h3 className="font-semibold text-[#131A34] mb-1">
              Privacy Policy
            </h3>
            <p className="text-sm text-[#717685]">How we protect your data</p>
          </a>
        </div>
      </div>
    </div>
  );
}