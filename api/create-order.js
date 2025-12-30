const Razorpay = require('razorpay');

// Initialize Razorpay with your credentials
// VITAL: Store these in your Vercel Environment Variables, NOT here in plain text for production.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { items } = req.body;

    // 1. Calculate Total Price on Server (Security measure: don't trust client-side prices)
    // In a real app, fetch these prices from a database based on item IDs.
    // For this MVP, we define the catalog here.
    const productCatalog = {
      'jersey-rm': 2499,
      'jersey-fcb': 2499,
      'match-ball': 3999,
      'scarf': 799,
      'hoodie': 2499,
      'cap': 599
    };

    let totalAmount = 0;
    items.forEach(item => {
      if (productCatalog[item.id]) {
        totalAmount += productCatalog[item.id] * item.quantity;
      }
    });

    // 2. Create Order in Razorpay
    const options = {
      amount: totalAmount * 100, // Razorpay takes amount in paisa (e.g., 10000 = ₹100)
      currency: 'INR',
      receipt: 'order_rcptid_' + Date.now(),
    };

    try {
      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error creating order' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}