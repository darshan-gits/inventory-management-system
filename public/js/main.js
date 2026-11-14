let allProducts = [];
let currentPage = 1;
const rowsPerPage = 5;
let stockChart = null;


// =========================================
// NOTIFICATIONS
// =========================================

function toggleNotifDropdown() {

    const dropdown = document.getElementById('notif-dropdown');

    if (!dropdown) return;

    dropdown.style.display =
        dropdown.style.display === 'block'
            ? 'none'
            : 'block';
}


document.addEventListener('click', (e) => {

    const wrapper = document.querySelector('.notif-wrapper');

    if (
        wrapper &&
        !wrapper.contains(e.target)
    ) {

        const dropdown =
            document.getElementById('notif-dropdown');

        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

});


// =========================================
// LOW STOCK NOTIFICATIONS
// =========================================

function showLowStockBanner(products) {

    const lowStockItems =
        products.filter(
            p => p.quantity <= p.reorder_level
        );

    const banner =
        document.getElementById('low-stock-banner');

    const dot =
        document.getElementById('notif-dot');

    const list =
        document.getElementById('notif-list');


    if (lowStockItems.length === 0) {

        if (banner) {
            banner.style.display = 'none';
        }

        if (dot) {
            dot.style.display = 'none';
        }

        if (list) {
            list.innerHTML =
                '<div class="notif-empty">No low stock items</div>';
        }

        return;
    }


    const names =
        lowStockItems
            .map(p => p.name)
            .join(', ');


    if (banner) {

        banner.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill"></i>

            <span>
                <strong>Low stock alert:</strong>
                ${lowStockItems.length}
                product(s) need reordering —
                ${names}
            </span>

            <button
                onclick="document.getElementById('low-stock-banner').style.display='none'">

                <i class="bi bi-x"></i>

            </button>
        `;

        banner.style.display = 'flex';
    }


    if (dot) {
        dot.style.display = 'block';
    }


    if (list) {

        list.innerHTML =
            lowStockItems.map(p => `

                <div class="notif-item">

                    <strong>${p.name}</strong>

                    <span>
                        ${p.quantity}
                        left
                        (reorder at ${p.reorder_level})
                    </span>

                </div>

            `).join('');
    }

}


// =========================================
// COUNTER ANIMATION
// =========================================

function animateCounter(
    elementId,
    endValue,
    prefix = ''
) {

    const el =
        document.getElementById(elementId);

    if (!el) return;


    const duration = 800;

    const startTime =
        performance.now();


    function update(currentTime) {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );

        const current =
            Math.floor(
                progress * endValue
            );


        el.textContent =
            prefix +
            current.toLocaleString('en-IN');


        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            el.textContent =
                prefix +
                endValue.toLocaleString('en-IN');

        }

    }


    requestAnimationFrame(update);

}


// =========================================
// LOAD PRODUCTS
// =========================================

function loadProducts() {

    console.log("Loading products...");


    fetch('/api/products')

        .then(response => response.json())

        .then(products => {

            console.log(products);


            allProducts = products;

            currentPage = 1;


            renderProducts(
                allProducts
            );


            updateDashboard(
                allProducts
            );


            renderChart(
                allProducts
            );


            showLowStockBanner(
                allProducts
            );


            // Refresh category product counts
            if (
                typeof loadCategories ===
                'function'
            ) {

                loadCategories();

            }

        })

        .catch(err =>
            console.error(err)
        );

}


// =========================================
// RENDER PRODUCTS
// =========================================

function renderProducts(products) {

    const tbody =
        document.getElementById(
            'product-body'
        );


    if (!tbody) return;


    tbody.innerHTML = '';


    const start =
        (currentPage - 1) *
        rowsPerPage;


    const paginatedProducts =
        products.slice(
            start,
            start + rowsPerPage
        );


    paginatedProducts.forEach(
        product => {

            const lowStock =
                product.quantity <=
                product.reorder_level;


            tbody.innerHTML += `

                <tr
                    class="${lowStock ? 'table-danger' : ''}">

                    <td>
                        ${product.id}
                    </td>


                    <td>

                        <img
                            src="${
                                product.image
                                    ? '/uploads/' +
                                      product.image
                                    : '/images/no-image.png'
                            }"

                            class="product-image"

                            onclick="previewImage(this.src)"

                            onerror="
                                this.onerror=null;
                                this.src='/images/no-image.png';
                            "
                        >

                    </td>


                    <td>
                        ${product.name}
                    </td>


                    <td>

                        ${
                            product.category_name

                                ? `
                                    <span
                                        class="category-badge">

                                        ${product.category_name}

                                    </span>
                                  `

                                : `
                                    <span
                                        class="text-secondary">

                                        —

                                    </span>
                                  `
                        }

                    </td>


                    <td>
                        ${product.quantity}
                    </td>


                    <td>
                        ₹${product.price}
                    </td>


                    <td>
                        ${product.reorder_level}
                    </td>


                    <td>

                        ${
                            currentUserRole === 'admin'

                                ? `

                                    <button
                                        class="btn btn-sm btn-success me-1"
                                        title="Stock In"

                                        onclick="
                                            stockIn(
                                                ${product.id},
                                                '${product.name}'
                                            )
                                        ">

                                        <i
                                            class="bi bi-box-arrow-in-down">
                                        </i>

                                    </button>


                                    <button
                                        class="btn btn-sm btn-info me-1"
                                        title="Stock Out"

                                        onclick="
                                            stockOut(
                                                ${product.id},
                                                '${product.name}'
                                            )
                                        ">

                                        <i
                                            class="bi bi-box-arrow-up">
                                        </i>

                                    </button>


                                    <button
                                        class="btn btn-sm btn-warning me-1"
                                        title="Edit"

                                        onclick="
                                            editProduct(
                                                ${product.id},
                                                '${product.name}',
                                                ${product.quantity},
                                                ${product.price},
                                                ${product.reorder_level}
                                            )
                                        ">

                                        <i
                                            class="bi bi-pencil">
                                        </i>

                                    </button>


                                    <button
                                        class="btn btn-sm btn-outline-danger"
                                        title="Delete"

                                        onclick="
                                            deleteProduct(
                                                ${product.id}
                                            )
                                        ">

                                        <i
                                            class="bi bi-trash">
                                        </i>

                                    </button>

                                  `

                                : ''
                        }

                    </td>

                </tr>

            `;

        }
    );


    renderPagination(
        products
    );

}


// =========================================
// PRODUCT PAGINATION
// =========================================

function renderPagination(products) {

    const pageCount =
        Math.ceil(
            products.length /
            rowsPerPage
        );


    const pagination =
        document.getElementById(
            'pagination'
        );


    if (!pagination) return;


    pagination.innerHTML = '';


    if (pageCount <= 1) {
        return;
    }


    for (
        let i = 1;
        i <= pageCount;
        i++
    ) {

        pagination.innerHTML += `

            <li
                class="page-item ${
                    i === currentPage
                        ? 'active'
                        : ''
                }">

                <button
                    class="page-link"

                    onclick="
                        goToPage(
                            ${i},
                            event
                        )
                    ">

                    ${i}

                </button>

            </li>

        `;

    }

}


// =========================================
// CHANGE PRODUCT PAGE
// =========================================

function goToPage(
    page,
    event
) {

    if (event) {
        event.preventDefault();
    }


    currentPage = page;


    renderProducts(
        getCurrentFilteredProducts()
    );

}


// =========================================
// PRODUCT SEARCH
// =========================================

function getCurrentFilteredProducts() {

    const searchInput =
        document.getElementById(
            'searchInput'
        );


    if (!searchInput) {
        return allProducts;
    }


    const query =
        searchInput.value
            .toLowerCase();


    return allProducts.filter(
        p =>
            p.name
                .toLowerCase()
                .includes(query)
    );

}


const productSearch =
    document.getElementById(
        'searchInput'
    );


if (productSearch) {

    productSearch.addEventListener(
        'input',
        () => {

            currentPage = 1;

            renderProducts(
                getCurrentFilteredProducts()
            );

        }
    );

}


// =========================================
// DASHBOARD CARDS
// =========================================

function updateDashboard(products) {

    const totalProducts =
        products.length;


    const lowStockCount =
        products.filter(
            p =>
                p.quantity <=
                p.reorder_level
        ).length;


    const inventoryValue =
        products.reduce(
            (sum, p) =>
                sum +
                (
                    p.quantity *
                    p.price
                ),
            0
        );


    animateCounter(
        'total-products',
        totalProducts
    );


    animateCounter(
        'low-stock',
        lowStockCount
    );


    animateCounter(
        'inventory-value',
        inventoryValue,
        '₹'
    );

}


// =========================================
// STOCK CHART
// =========================================

function renderChart(products) {

    const canvas =
        document.getElementById(
            'stockChart'
        );


    if (!canvas) return;


    const ctx =
        canvas.getContext('2d');


    const labels =
        products.map(
            p => p.name
        );


    const quantities =
        products.map(
            p => p.quantity
        );


    const reorderLevels =
        products.map(
            p => p.reorder_level
        );


    if (stockChart) {

        stockChart.destroy();

    }


    stockChart =
        new Chart(
            ctx,
            {

                type: 'bar',

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                'Current Quantity',

                            data:
                                quantities,

                            backgroundColor:
                                'rgba(13, 110, 253, 0.7)'

                        },

                        {

                            label:
                                'Reorder Level',

                            data:
                                reorderLevels,

                            backgroundColor:
                                'rgba(220, 53, 69, 0.7)'

                        }

                    ]

                },


                options: {

                    responsive: true,

                    plugins: {

                        legend: {
                            position: 'top'
                        }

                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }

                    }

                }

            }
        );

}


// =========================================
// LOGIN STATUS
// =========================================

let currentUserRole = null;


// =========================================
// LOGIN STATUS + ROLE ACCESS
// =========================================

async function checkLoginStatus() {

    try {

        const res =
            await fetch('/api/auth/status');


        if (!res.ok) {

            window.location.href =
                '/login.html';

            return;

        }


        const data =
            await res.json();


        currentUserRole =
            data.role;


        // =========================================
        // USER INFORMATION
        // =========================================

        const userInfo =
            document.getElementById('user-info');


        if (userInfo) {

            userInfo.textContent =
                `Logged in as: ${
                    data.role === 'admin'
                        ? 'Admin'
                        : 'Staff'
                }`;

        }


        // =========================================
        // AVATAR
        // =========================================

        const avatar =
            document.getElementById('user-avatar');


        if (avatar) {

            avatar.textContent =
                data.role === 'admin'
                    ? 'A'
                    : 'S';

        }


        // =========================================
        // USER MANAGEMENT
        // ADMIN ONLY
        // =========================================

        const userManagementLinks =
            document.querySelectorAll(
                'a[href="/users.html"]'
            );


        userManagementLinks.forEach(
            link => {

                if (data.role !== 'admin') {

                    link.style.display =
                        'none';

                } else {

                    link.style.display =
                        '';

                }

            }
        );


        // =========================================
        // ADMIN-ONLY SIDEBAR ITEMS
        // =========================================

        const auditLinks =
            document.querySelectorAll(
                'a[href="/audit.html"]'
            );


        const reportLinks =
            document.querySelectorAll(
                'a[href="/reports.html"]'
            );


        if (data.role !== 'admin') {

            auditLinks.forEach(
                link => {
                    link.style.display =
                        'none';
                }
            );


            reportLinks.forEach(
                link => {
                    link.style.display =
                        'none';
                }
            );

        }


        // =========================================
        // ADMIN-ONLY CATEGORY MANAGEMENT
        // =========================================

        const categorySection =
            document.getElementById(
                'categories-section'
            );


        if (
            categorySection &&
            data.role !== 'admin'
        ) {

            categorySection.style.display =
                'none';

        }


        const categoryLinks =
            document.querySelectorAll(
                'a[href="#categories-section"]'
            );


        categoryLinks.forEach(
            link => {

                if (data.role !== 'admin') {

                    link.style.display =
                        'none';

                }

            }
        );


        // =========================================
        // ADMIN-ONLY ADD PRODUCT
        // =========================================

        const addProductSection =
            document.getElementById(
                'add-product-section'
            );


        const addProductLinks =
            document.querySelectorAll(
                'a[href="#add-product-section"]'
            );


        if (data.role !== 'admin') {

            if (addProductSection) {

                addProductSection.style.display =
                    'none';

            }


            addProductLinks.forEach(
                link => {

                    link.style.display =
                        'none';

                }
            );

        }


    } catch (error) {

        console.error(
            'Login status error:',
            error
        );

    }

}


// =========================================
// INITIAL LOAD
// =========================================

checkLoginStatus()
    .then(() => {

        loadProducts();

        loadCategories();

        loadSupplierCount();

    });


// =========================================
// ADD PRODUCT
// =========================================

const productForm =
    document.getElementById(
        'productForm'
    );


if (productForm) {

    productForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();


            const formData =
                new FormData();


            formData.append(
                'name',
                document.getElementById(
                    'name'
                ).value
            );


            formData.append(
                'quantity',
                document.getElementById(
                    'quantity'
                ).value
            );


            formData.append(
                'price',
                document.getElementById(
                    'price'
                ).value
            );


            formData.append(
                'reorder_level',
                document.getElementById(
                    'reorder'
                ).value
            );


            formData.append(
                'category_id',
                document.getElementById(
                    'category'
                ).value
            );


            const image =
                document.getElementById(
                    'image'
                ).files[0];


            if (image) {

                formData.append(
                    'image',
                    image
                );

            }


            const response =
                await fetch(
                    '/api/products',
                    {
                        method: 'POST',
                        body: formData
                    }
                );


            const result =
                await response.json();


            alert(
                result.message
            );


            productForm.reset();


            const preview =
                document.getElementById(
                    'preview'
                );


            if (preview) {
                preview.style.display =
                    'none';
            }


            loadProducts();

        }
    );

}


// =========================================
// DELETE PRODUCT
// =========================================

async function deleteProduct(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmDelete) return;


    const response =
        await fetch(
            `/api/products/${id}`,
            {
                method: 'DELETE'
            }
        );


    if (response.status === 403) {

        alert(
            "Only Admin users can delete products."
        );

        return;

    }


    const result =
        await response.json();


    alert(
        result.message
    );


    loadProducts();

}


// =========================================
// EDIT PRODUCT
// =========================================

function editProduct(
    id,
    currentName,
    currentQuantity,
    currentPrice,
    currentReorder,
    currentCategory = '',
    currentImage = ''
) {

    document.getElementById(
        'edit-id'
    ).value = id;


    document.getElementById(
        'edit-name'
    ).value = currentName;


    document.getElementById(
        'edit-quantity'
    ).value = currentQuantity;


    document.getElementById(
        'edit-price'
    ).value = currentPrice;


    document.getElementById(
        'edit-reorder'
    ).value = currentReorder;


    if (
        document.getElementById(
            'edit-category'
        )
    ) {

        document.getElementById(
            'edit-category'
        ).value =
            currentCategory;

    }


    if (
        document.getElementById(
            'edit-preview'
        )
    ) {

        if (currentImage) {

            document.getElementById(
                'edit-preview'
            ).src =
                '/uploads/' +
                currentImage;

        } else {

            document.getElementById(
                'edit-preview'
            ).src =
                '/images/no-image.png';

        }


        document.getElementById(
            'edit-preview'
        ).style.display =
            'block';

    }


    document.getElementById(
        'editModal'
    ).style.display =
        'block';

}


// =========================================
// CLOSE EDIT PRODUCT MODAL
// =========================================

function closeEditModal() {

    const modal =
        document.getElementById(
            'editModal'
        );


    if (modal) {

        modal.style.display =
            'none';

    }

}


// =========================================
// SUBMIT PRODUCT EDIT
// =========================================

async function submitEdit() {

    const id =
        document.getElementById(
            'edit-id'
        ).value;


    const formData =
        new FormData();


    formData.append(
        'name',
        document.getElementById(
            'edit-name'
        ).value
    );


    formData.append(
        'quantity',
        document.getElementById(
            'edit-quantity'
        ).value
    );


    formData.append(
        'price',
        document.getElementById(
            'edit-price'
        ).value
    );


    formData.append(
        'reorder_level',
        document.getElementById(
            'edit-reorder'
        ).value
    );


    const image =
        document.getElementById(
            'edit-image'
        ).files[0];


    if (image) {

        formData.append(
            'image',
            image
        );

    }


    const response =
        await fetch(
            `/api/products/${id}`,
            {
                method: 'PUT',
                body: formData
            }
        );


    const result =
        await response.json();


    alert(
        result.message
    );


    closeEditModal();


    loadProducts();

}


// =========================================
// LOGOUT
// =========================================

async function logout() {

    await fetch(
        '/api/auth/logout',
        {
            method: 'POST'
        }
    );


    window.location.href =
        '/login.html';

}


// =========================================
// STOCK IN
// =========================================

async function stockIn(
    id,
    name
) {

    const quantity =
        prompt(
            `Enter quantity to add for ${name}:`
        );


    if (
        !quantity ||
        quantity <= 0
    ) {
        return;
    }


    const response =
        await fetch(
            `/api/products/${id}/stockin`,
            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        quantity:
                            Number(quantity)
                    })

            }
        );


    const result =
        await response.json();


    alert(
        result.message
    );


    loadProducts();

}


// =========================================
// STOCK OUT
// =========================================

async function stockOut(
    id,
    name
) {

    const quantity =
        prompt(
            `Enter quantity to remove from ${name}`
        );


    if (
        !quantity ||
        quantity <= 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    const response =
        await fetch(
            `/api/products/${id}/stockout`,
            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        quantity:
                            Number(quantity)
                    })

            }
        );


    const result =
        await response.json();


    alert(
        result.message
    );


    if (response.ok) {

        loadProducts();

    }

}


// =========================================
// CATEGORY MANAGEMENT
// =========================================


// Load categories into:
// 1. Product dropdown
// 2. Categories management table

async function loadCategories() {

    try {

        const response =
            await fetch(
                '/api/categories'
            );


        if (!response.ok) {

            throw new Error(
                'Failed to load categories'
            );

        }


        const categories =
            await response.json();


        // -----------------------------
        // PRODUCT CATEGORY DROPDOWN
        // -----------------------------

        const select =
            document.getElementById(
                'category'
            );


        if (select) {

            select.innerHTML =
                '<option value="">Select Category</option>';


            categories.forEach(
                cat => {

                    select.innerHTML += `

                        <option
                            value="${cat.id}">

                            ${cat.name}

                        </option>

                    `;

                }
            );

        }


        // -----------------------------
        // CATEGORY MANAGEMENT TABLE
        // -----------------------------

        const categoryBody =
            document.getElementById(
                'category-body'
            );


        if (!categoryBody) {
            return;
        }


        categoryBody.innerHTML = '';


        if (categories.length === 0) {

            categoryBody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="empty-supplier">

                        <i class="bi bi-tags"></i>

                        No categories found.

                    </td>

                </tr>

            `;

            return;

        }


        categories.forEach(
            category => {

                const productCount =
                    allProducts.filter(
                        product =>
                            Number(
                                product.category_id
                            ) ===
                            Number(
                                category.id
                            )
                    ).length;


                categoryBody.innerHTML += `

                    <tr>

                        <td>
                            ${category.id}
                        </td>


                        <td>

                            <strong>
                                ${category.name}
                            </strong>

                        </td>


                        <td>

                            <span
                                class="category-badge">

                                ${productCount}

                            </span>

                        </td>


                        <td>

                            <button
                                class="btn btn-sm btn-warning me-1"

                                title="Edit Category"

                                onclick="
                                    editCategory(
                                        ${category.id},
                                        '${escapeCategoryName(
                                            category.name
                                        )}'
                                    )
                                ">

                                <i
                                    class="bi bi-pencil">
                                </i>

                            </button>


                            <button
                                class="btn btn-sm btn-outline-danger"

                                title="Delete Category"

                                onclick="
                                    deleteCategory(
                                        ${category.id},
                                        '${escapeCategoryName(
                                            category.name
                                        )}'
                                    )
                                ">

                                <i
                                    class="bi bi-trash">
                                </i>

                            </button>

                        </td>

                    </tr>

                `;

            }
        );


        // Apply current search
        filterCategories();

    }

    catch (error) {

        console.error(
            'Category loading error:',
            error
        );

    }

}


// =========================================
// ESCAPE CATEGORY NAME
// =========================================

function escapeCategoryName(name) {

    return String(name)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');

}


// =========================================
// OPEN CATEGORY MODAL
// =========================================

function openCategoryModal() {

    const modal =
        document.getElementById(
            'categoryModal'
        );


    const title =
        document.getElementById(
            'categoryModalTitle'
        );


    const idInput =
        document.getElementById(
            'edit-category-id'
        );


    const nameInput =
        document.getElementById(
            'category-name'
        );


    if (!modal) return;


    if (title) {

        title.textContent =
            'Add Category';

    }


    if (idInput) {

        idInput.value = '';

    }


    if (nameInput) {

        nameInput.value = '';

        setTimeout(
            () => nameInput.focus(),
            100
        );

    }


    modal.style.display =
        'block';

}


// =========================================
// CLOSE CATEGORY MODAL
// =========================================

function closeCategoryModal() {

    const modal =
        document.getElementById(
            'categoryModal'
        );


    if (modal) {

        modal.style.display =
            'none';

    }

}


// =========================================
// EDIT CATEGORY
// =========================================

function editCategory(
    id,
    name
) {

    const modal =
        document.getElementById(
            'categoryModal'
        );


    const title =
        document.getElementById(
            'categoryModalTitle'
        );


    const idInput =
        document.getElementById(
            'edit-category-id'
        );


    const nameInput =
        document.getElementById(
            'category-name'
        );


    if (!modal) return;


    if (title) {

        title.textContent =
            'Edit Category';

    }


    if (idInput) {

        idInput.value =
            id;

    }


    if (nameInput) {

        nameInput.value =
            name;

        setTimeout(
            () => nameInput.focus(),
            100
        );

    }


    modal.style.display =
        'block';

}


// =========================================
// SAVE CATEGORY
// =========================================

async function saveCategory() {

    const id =
        document.getElementById(
            'edit-category-id'
        ).value;


    const nameInput =
        document.getElementById(
            'category-name'
        );


    const name =
        nameInput.value.trim();


    if (!name) {

        alert(
            'Please enter a category name.'
        );

        nameInput.focus();

        return;

    }


    try {

        let response;


        // -----------------------------
        // ADD
        // -----------------------------

        if (!id) {

            response =
                await fetch(
                    '/api/categories',
                    {

                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                name: name
                            })

                    }
                );

        }


        // -----------------------------
        // EDIT
        // -----------------------------

        else {

            response =
                await fetch(
                    `/api/categories/${id}`,
                    {

                        method: 'PUT',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                name: name
                            })

                    }
                );

        }


        const result =
            await response.json();


        alert(
            result.message
        );


        if (!response.ok) {
            return;
        }


        closeCategoryModal();


        // Reload categories
        await loadCategories();


        // Refresh products so category names/counts
        // are updated after editing a category
        loadProducts();

    }

    catch (error) {

        console.error(
            'Category save error:',
            error
        );


        alert(
            'Unable to save category.'
        );

    }

}


// =========================================
// DELETE CATEGORY
// =========================================

async function deleteCategory(
    id,
    name
) {

    const confirmDelete =
        confirm(
            `Are you sure you want to delete the category "${name}"?`
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/categories/${id}`,
                {
                    method: 'DELETE'
                }
            );


        const result =
            await response.json();


        alert(
            result.message
        );


        if (!response.ok) {
            return;
        }


        // Refresh category list
        await loadCategories();


        // Refresh products and dashboard
        loadProducts();

    }

    catch (error) {

        console.error(
            'Category delete error:',
            error
        );


        alert(
            'Unable to delete category.'
        );

    }

}


// =========================================
// CATEGORY SEARCH
// =========================================

function filterCategories() {

    const searchInput =
        document.getElementById(
            'categorySearch'
        );


    const categoryBody =
        document.getElementById(
            'category-body'
        );


    if (
        !searchInput ||
        !categoryBody
    ) {
        return;
    }


    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    const rows =
        categoryBody.querySelectorAll(
            'tr'
        );


    rows.forEach(
        row => {

            const text =
                row.textContent
                    .toLowerCase();


            row.style.display =
                text.includes(query)
                    ? ''
                    : 'none';

        }
    );

}


const categorySearch =
    document.getElementById(
        'categorySearch'
    );


if (categorySearch) {

    categorySearch.addEventListener(
        'input',
        filterCategories
    );

}


// =========================================
// SUPPLIER COUNT
// =========================================

async function loadSupplierCount() {

    try {

        const res =
            await fetch(
                '/api/suppliers'
            );


        const suppliers =
            await res.json();


        animateCounter(
            'total-suppliers',
            suppliers.length
        );

    }

    catch (error) {

        console.error(
            'Supplier count error:',
            error
        );

    }

}


// =========================================
// IMAGE PREVIEW
// =========================================

function previewImage(src) {

    const image =
        document.getElementById(
            'previewImage'
        );


    if (!image) return;


    image.src = src;


    const modal =
        new bootstrap.Modal(
            document.getElementById(
                'imageModal'
            )
        );


    modal.show();

}