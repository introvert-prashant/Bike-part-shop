const api = "";

// Load Products
async function loadProducts() {
  const res = await fetch("/api/products");
  const products = await res.json();

  const box = document.getElementById("products");
  box.innerHTML = "";

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>₹ ${p.price}</p>
      <button onclick="buy('${p.id}')">Buy Now</button>
    `;
    box.appendChild(div);
  });
}

loadProducts();

// Buy
async function buy(id) {
  const name = prompt("Your Name?");
  const phone = prompt("Phone Number?");
  const address = prompt("Address?");

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: id,
      customer: { name, phone, address }
    })
  });

  const data = await res.json();
  const order = data.order;

  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
  modal.innerHTML = `
    <div class="card">
      <h3>Advance Required: ₹ ${order.advanceAmount}</h3>
      <button onclick="payUPI('${order.id}')">Pay via UPI</button>
      <button onclick="closeModal()">Close</button>
    </div>
  `;
}

// Pay UPI
async function payUPI(orderId) {
  const res = await fetch(`/api/orders/${orderId}/upi-link`);
  const data = await res.json();

  window.open(data.upiDeepLink);

  setTimeout(async () => {
    await fetch(`/api/orders/${orderId}/mark-upi-paid`, { method: "POST" });

    alert("Advance Paid! Now remaining amount will be COD.");

    const confirmRes = await fetch(`/api/orders/${orderId}/confirm-cod`, {
      method: "POST",
    });

    const final = await confirmRes.json();
    alert("Order Confirmed! COD: ₹ " + final.order.remainingCash);
  }, 5000);
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}
