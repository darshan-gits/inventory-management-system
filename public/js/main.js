let allProducts = [];
let currentPage = 1;
const rowsPerPage = 5; // change this to show more/less per page
let stockChart = null;

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.notif-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('notif-dropdown').style.display = 'none';
  }
});

function showLowStockBanner(products) {
  const lowStockItems = products.filter(p => p.quantity <= p.reorder_level);
  const banner = document.getElementById('low-stock-banner');
  const dot = document.getElementById('notif-dot');
  const list = document.getElementById('notif-list');

  if (lowStockItems.length === 0) {
    banner.style.display = 'none';
    if (dot) dot.style.display = 'none';
    if (list) list.innerHTML = '<div class="notif-empty">No low stock items</div>';
    return;
  }

  const names = lowStockItems.map(p => p.name).join(', ');

  banner.innerHTML = `
    <i class="bi bi-exclamation-triangle-fill"></i>
    <span><strong>Low stock alert:</strong> ${lowStockItems.length} product(s) need reordering — ${names}</span>
    <button onclick="document.getElementById('low-stock-banner').style.display='none'">
      <i class="bi bi-x"></i>
    </button>
  `;
  banner.style.display = 'flex';

  if (dot) dot.style.display = 'block';
  if (list) {
    list.innerHTML = lowStockItems.map(p => `
      <div class="notif-item">
        <strong>${p.name}</strong>
        <span>${p.quantity} left (reorder at ${p.reorder_level})</span>
      </div>
    `).join('');
  }
}

function animateCounter(elementId, endValue, prefix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 800; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(progress * endValue);
    el.textContent = prefix + current.toLocaleString('en-IN');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + endValue.toLocaleString('en-IN');
    }
  }

  requestAnimationFrame(update);
}

// Load products from server
function loadProducts() {
  console.log("Loading products...");

  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      console.log(products);

      allProducts = products;
      currentPage = 1;
      renderProducts(allProducts);
      updateDashboard(allProducts);
      renderChart(allProducts);
      showLowStockBanner(allProducts);
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

<td>
    <img
src="${product.image
    ? '/uploads/' + product.image
    : '/images/no-image.png'}"
class="product-image"
onclick="previewImage(this.src)"
onerror="this.onerror=null;this.src='/images/no-image.png';">
</td>

<td>${product.name}</td>

<td>
  ${product.category_name
    ? `<span class="category-badge">${product.category_name}</span>`
    : `<span class="text-secondary">—</span>`}
</td>

<td>${product.quantity}</td>
<td>₹${product.price}</td>

<td>${product.reorder_level}</td>

<td>

${currentUserRole === 'admin' ? `

<button class="btn btn-sm btn-success me-1" title="Stock In"
onclick="stockIn(${product.id}, '${product.name}')">
<i class="bi bi-box-arrow-in-down"></i>
</button>

<button class="btn btn-sm btn-info me-1" title="Stock Out"
onclick="stockOut(${product.id}, '${product.name}')">
<i class="bi bi-box-arrow-up"></i>
</button>

<button class="btn btn-sm btn-warning me-1" title="Edit"
onclick="editProduct(
${product.id},
'${product.name}',
${product.quantity},
${product.price},
${product.reorder_level}
)">
<i class="bi bi-pencil"></i>
</button>

<button
class="btn btn-sm btn-outline-danger" title="Delete"
onclick="deleteProduct(${product.id})">
<i class="bi bi-trash"></i>
</button>

` : ''}

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

  animateCounter('total-products', totalProducts);
  animateCounter('low-stock', lowStockCount);
  animateCounter('inventory-value', inventoryValue, '₹');
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
let currentUserRole = null; // will be 'admin' or 'staff'

async function checkLoginStatus() {
  const res = await fetch('/api/auth/status');
  const data = await res.json();
  currentUserRole = data.role;

  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.textContent = `Logged in as: ${data.role === 'admin' ? 'Admin' : 'Staff'}`;
  }

  const avatar = document.getElementById('user-avatar');
  if (avatar) {
    avatar.textContent = data.role === 'admin' ? 'A' : 'S';
  }
}
// Initial load
checkLoginStatus().then(() => {
  loadProducts();
  loadCategories();
  loadSupplierCount();
});
// Add new product
document.getElementById('productForm').addEventListener('submit', async (e) => {

    e.preventDefault();

    const formData = new FormData();

    formData.append('name', document.getElementById('name').value);
    formData.append('quantity', document.getElementById('quantity').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('reorder_level', document.getElementById('reorder').value);
    formData.append('category_id', document.getElementById('category').value);

    const image = document.getElementById('image').files[0];

    if (image) {
        formData.append('image', image);
    }

    const response = await fetch('/api/products', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();

    alert(result.message);

    document.getElementById('productForm').reset();

    document.getElementById('preview').style.display = 'none';

    loadProducts();

});

// Delete product
async function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE'
  });

  if (response.status === 403) {
    alert("Only Admin users can delete products.");
    return;
  }

  const result = await response.json();

  alert(result.message);

  loadProducts();
}
// Edit product - opens modal
function editProduct(
    id,
    currentName,
    currentQuantity,
    currentPrice,
    currentReorder,
    currentCategory = '',
    currentImage = ''
) {

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = currentName;
    document.getElementById('edit-quantity').value = currentQuantity;
    document.getElementById('edit-price').value = currentPrice;
    document.getElementById('edit-reorder').value = currentReorder;

    if(document.getElementById('edit-category')){
        document.getElementById('edit-category').value = currentCategory;
    }

    // Show current image
    if(document.getElementById('edit-preview')){

        if(currentImage){
            document.getElementById('edit-preview').src =
                '/uploads/' + currentImage;
        }else{
            document.getElementById('edit-preview').src =
                '/images/no-image.png';
        }

        document.getElementById('edit-preview').style.display = 'block';
    }

    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal(){
    document.getElementById('editModal').style.display='none';
}
async function submitEdit() {

  const id = document.getElementById('edit-id').value;

  const formData = new FormData();

  formData.append('name', document.getElementById('edit-name').value);
  formData.append('quantity', document.getElementById('edit-quantity').value);
  formData.append('price', document.getElementById('edit-price').value);
  formData.append('reorder_level', document.getElementById('edit-reorder').value);

  const image = document.getElementById('edit-image').files[0];

  if (image) {
    formData.append('image', image);
  }

  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    body: formData
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
async function stockIn(id, name) {
  const quantity = prompt(`Enter quantity to add for ${name}:`);

  if (!quantity || quantity <= 0) return;

  const response = await fetch(`/api/products/${id}/stockin`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quantity: Number(quantity)
    })
  });

  const result = await response.json();

  alert(result.message);

  loadProducts();
}async function stockOut(id, name) {

    const quantity = prompt(`Enter quantity to remove from ${name}`);

    if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    const response = await fetch(`/api/products/${id}/stockout`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            quantity: Number(quantity)
        })
    });

    const result = await response.json();

    alert(result.message);

    if (response.ok) {
        loadProducts();
    }
}

async function loadCategories() {
  const response = await fetch('/api/categories');
  const categories = await response.json();

  const select = document.getElementById('category');
  select.innerHTML = '<option value="">Select Category</option>';

  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}
async function loadSupplierCount() {
  const res = await fetch('/api/suppliers');
  const suppliers = await res.json();
  animateCounter('total-suppliers', suppliers.length);
}
function previewImage(src) {
    document.getElementById('previewImage').src = src;

    const modal = new bootstrap.Modal(
        document.getElementById('imageModal')
    );

    modal.show();
}