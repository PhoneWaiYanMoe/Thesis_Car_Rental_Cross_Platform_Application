// src/utils/mockData.js

export const generateMockRequests = () => {
  const titles = [
    'Request to delete my account',
    'Change payment method',
    'Update car availability',
    'Refund request for cancelled booking',
    'Verify car ownership documents',
    'Report inappropriate user behavior',
    'Request insurance claim',
    'Change booking dates',
    'Account verification issue',
    'Dispute resolution needed',
    'Unable to upload car photos',
    'Payment not received',
    'App login issues',
    'Request to update profile',
    'Car rental extension request'
  ];
  
  const categories = [
    'Account Deletion',
    'Payment Issue',
    'Car Management',
    'Booking Issue',
    'Verification',
    'Report',
    'Insurance',
    'Booking Change',
    'Account Issue',
    'Dispute',
    'Technical Issue',
    'Profile Update'
  ];
  
  const statuses = ['pending', 'approved', 'denied'];
  const handlers = ['support1', 'support2', 'support3', 'support4', null];
  
  return Array.from({ length: 50 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hasPhotos = Math.random() > 0.5;
    
    return {
      id: `REQ-${String(i + 1).padStart(4, '0')}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      body: `I would like to ${titles[Math.floor(Math.random() * titles.length)].toLowerCase()}. This is important for me because of various reasons. Please process this request as soon as possible. I have attached relevant documents and photos for your review.`,
      status: status,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      handledBy: status !== 'pending' ? handlers[Math.floor(Math.random() * (handlers.length - 1))] : null,
      handledAt: status !== 'pending' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : null,
      denialReason: status === 'denied' ? 'This request cannot be processed due to policy violations or incomplete information. Please provide additional documentation and resubmit your request.' : null,
      photos: hasPhotos ? [
        'https://www.fabcars.in/assets/images/blog/luxury-car-for-your-indian-getaway.jpg',
        'https://img1.wsimg.com/isteam/ip/6837e201-1f74-479e-8062-2a6019e79045/113.jpg/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1160,h:522',
        'https://img1.wsimg.com/isteam/ip/6837e201-1f74-479e-8062-2a6019e79045/115.jpg/:/cr=t:0%25,l:0%25,w:100%25,h:100%25'
      ] : [],
      customerName: `Customer ${Math.floor(Math.random() * 100) + 1}`,
      customerEmail: `customer${Math.floor(Math.random() * 100) + 1}@email.com`,
      customerPhone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
    };
  });
};