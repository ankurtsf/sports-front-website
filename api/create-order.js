import Razorpay from 'razorpay';

// Initialize Razorpay with your credentials
// VITAL: Store these in your Vercel Environment Variables.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { items, customerDetails } = req.body; // Added customerDetails to capture form inputs

    // 1. Calculate Total Price on Server
    const productCatalog = {
      'jersey-rm': 2499,
      'jersey-fcb': 2499,
      'match-ball': 3999,
      'scarf': 799,
      'hoodie': 2499,
      'cap': 599,
      'membership-black-pass': 999 // Added Membership Product
    };

    let totalAmount = 0;
    
    // Safety check for items
    if (items && Array.isArray(items)) {
        items.forEach(item => {
          if (productCatalog[item.id]) {
            totalAmount += productCatalog[item.id] * item.quantity;
          }
        });
    }

    // 2. Create Order in Razorpay
    const options = {
      amount: totalAmount * 100, // Razorpay takes amount in paisa
      currency: 'INR',
      receipt: 'order_rcptid_' + Date.now(),
      notes: customerDetails || {} // Attach customer info (Name on Card, Email, etc.) to the order
    };

    try {
      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
    } catch (error) {
      console.error("Razorpay Error:", error);
      res.status(500).json({ error: 'Error creating order' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}