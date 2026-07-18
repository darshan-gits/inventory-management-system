let allProducts = [];
let currentPage = 1;
const rowsPerPage = 5; // change this to show more/less per page
let stockChart = null;

// Load products from server
function loadProducts() {
  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      allProducts = products;
      currentPage = 1;
      renderProducts(allProducts);
      updateDashboard(allProducts);
      renderChart(allProducts);
    })
    .catch(err => console.error(err));
}

// Render product rows (paginated)
function renderProducts(products) {
  const tbody = document.getElementById('product-body');
  tbody.innerHTML = '';

  const start = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = products.slice(start, start + rowsPerPage);

  paginatedProducts.forEach(product => {
    const lowStock = product.quantity <= product.reorder_level;
    tbody.innerHTML += `
<tr class="${lowStock ? 'table-danger' : ''}">
    <td>${product.id}</td>
    <td>${product.name}</td>
    <td>${product.quantity}</td>
    <td>₹${product.price}</td>
    <td>${product.reorder_level}</td>
    <td>
    <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id}, '${product.name}', ${product.quantity}, ${product.price}, ${product.reorder_level})">
        Edit
    </button>
    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">
        Delete
    </button>
</td>
</tr>
`;
  });

  renderPagination(products);
}

// Render pagination buttons
function renderPagination(products) {
  const pageCount = Math.ceil(products.length / rowsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (pageCount <= 1) return;

  for (let i = 1; i <= pageCount; i++) {
    pagination.innerHTML += `
<li class="page-item ${i === currentPage ? 'active' : ''}">
  <button class="page-link" onclick="goToPage(${i}, event)">${i}</button>
</li>
`;
  }
}

// Change page
function goToPage(page, event) {
  event.preventDefault();
  currentPage = page;
  renderProducts(getCurrentFilteredProducts());
}

// Helper: get products filtered by current search box value
function getCurrentFilteredProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  return allProducts.filter(p => p.name.toLowerCase().includes(query));
}

// Search filter
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1;
  renderProducts(getCurrentFilteredProducts());
});

// Update dashboard cards
function updateDashboard(products) {
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity <= p.reorder_level).length;
  const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

  document.getElementById('total-products').textContent = totalProducts;
  document.getElementById('low-stock').textContent = lowStockCount;
  document.getElementById('inventory-value').textContent = `₹${inventoryValue.toLocaleString('en-IN')}`;
}

// Render stock chart
function renderChart(products) {
  const ctx = document.getElementById('stockChart').getContext('2d');

  const labels = products.map(p => p.name);
  const quantities = products.map(p => p.quantity);
  const reorderLevels = products.map(p => p.reorder_level);

  if (stockChart) {
    stockChart.destroy();
  }

  stockChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Current Quantity',
          data: quantities,
          backgroundColor: 'rgba(13, 110, 253, 0.7)'
        },
        {
          label: 'Reorder Level',
          data: reorderLevels,
          backgroundColor: 'rgba(220, 53, 69, 0.7)'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Initial load
loadProducts();

// Add new product
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const product = {
    name: document.getElementById('name').value,
    quantity: Number(document.getElementById('quantity').value),
    price: Number(document.getElementById('price').value),
    reorder_level: Number(document.getElementById('reorder').value)
  };

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(product)
  });

  const result = await response.json();

  alert(result.message);

  document.getElementById('productForm').reset();

  loadProducts();
});

// Delete product
async function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE'
  });

  const result = await response.json();

  alert(result.message);

  loadProducts();
}

// Edit product - opens modal
function editProduct(id, currentName, currentQuantity, currentPrice, currentReorder) {
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-name').value = currentName;
  document.getElementById('edit-quantity').value = currentQuantity;
  document.getElementById('edit-price').value = currentPrice;
  document.getElementById('edit-reorder').value = currentReorder;

  document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

async function submitEdit() {
  const id = document.getElementById('edit-id').value;
  const name = document.getElementById('edit-name').value;
  const quantity = Number(document.getElementById('edit-quantity').value);
  const price = Number(document.getElementById('edit-price').value);
  const reorder_level = Number(document.getElementById('edit-reorder').value);

  const response = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, quantity, price, reorder_level })
  });

  const result = await response.json();

  alert(result.message);

  closeEditModal();
  loadProducts();
}
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}