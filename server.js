const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Demo Products
const products = [
  { id: 'p1', name: 'Scooter Front Fender (Fibre)', price: 2750, img: 'https://via.placeholder.com/400x300?text=Front+Fender' },
  { id: 'p2', name: 'Bike Full Fairing (Fibre)', price: 11250, img: 'https://via.placeholder.com/400x300?text=Full+Fairing' },
  { id: 'p3', name: 'Scooter Side Panel (Fibre)', price: 1850, img: 'https://via.placeholder.com/400x300?text=Side+Panel' },
  { id: 'p4', name: 'Universal Seat Cowl (Fibre)', price: 4200, img: 'https://via.placeholder.com/400x300?text=Seat+Cowl' }
];

const orders = {};

function computeAdvance(price) {
  const percent = price > 8000 ? 10 : 7;
  const advanceAmount = Math.round((percent / 100) * price);
  return { percent, advanceAmount };
}

app.get('/api/products', (req, res) => res.json(products));

app.post('/api/orders', (req, res) => {
  const { productId, customer } = req.body;
  if (!productId || !customer || !customer.name || !customer.phone || !customer.address) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { percent, advanceAmount } = computeAdvance(product.price);
  const id = uuidv4();

  const order = {
    id,
    product,
    customer,
    advancePercent: percent,
    advanceAmount,
    price: product.price,
    status: 'PENDING_ADVANCE',
  };

  orders[id] = order;
  res.json({ order });
});

// UPI Link Generator
app.get('/api/orders/:orderId/upi-link', (req, res) => {
  const order = orders[req.params.orderId];
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const vpa = "yourshop@upi";
  const transactionNote = encodeURIComponent("Advance Payment");
  const upiLink = `upi://pay?pa=${vpa}&pn=FibreParts%20India&am=${order.advanceAmount}&cu=INR&tn=${transactionNote}`;
  const qrUrl = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(upiLink)}`;

  res.json({ upiDeepLink: upiLink, qrUrl });
});

// Simulate UPI Payment
app.post('/api/orders/:orderId/mark-upi-paid', (req, res) => {
  const order = orders[req.params.orderId];
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = "ADVANCE_PAID";
  order.paid = { amount: order.advanceAmount, method: "UPI", at: new Date().toISOString() };
  res.json({ order, message: "UPI Payment Success" });
});

// Confirm COD
app.post('/api/orders/:orderId/confirm-cod', (req, res) => {
  const order = orders[req.params.orderId];
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status !== "ADVANCE_PAID") {
    return res.status(400).json({ error: "Advance not paid yet" });
  }

  const remaining = order.price - order.advanceAmount;
  order.status = "CONFIRMED";
  order.remainingCash = remaining;

  res.json({ order, message: "Order confirmed with COD" });
});

// Fallback to frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
