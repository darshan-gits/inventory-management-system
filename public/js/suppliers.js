async function loadSuppliers() {

    const response = await fetch('/api/suppliers');

    const suppliers = await response.json();

    const tbody = document.getElementById('supplier-body');

    tbody.innerHTML = '';

    suppliers.forEach(supplier => {

        tbody.innerHTML += `
        <tr>

        <td>${supplier.id}</td>

        <td>${supplier.supplier_name}</td>

        <td>${supplier.contact_person}</td>

        <td>${supplier.phone}</td>

        <td>${supplier.email}</td>

        <td>${supplier.address}</td>

        <td>
    <button class="btn btn-warning btn-sm me-2"
    onclick="editSupplier(
    ${supplier.id},
    '${supplier.supplier_name}',
            '${supplier.contact_person || ""}',
            '${supplier.phone || ""}',
            '${supplier.email || ""}',
            '${supplier.address || ""}'
        )">
        Edit
    </button>

    <button class="btn btn-danger btn-sm"
        onclick="deleteSupplier(${supplier.id})">
        Delete
    </button>
</td>
        </tr>
        `;

    });

}

document
.getElementById('supplierForm')
.addEventListener('submit', async function(e){

e.preventDefault();

const supplier = {

supplier_name:
document.getElementById('supplier_name').value,

contact_person:
document.getElementById('contact_person').value,

phone:
document.getElementById('phone').value,

email:
document.getElementById('email').value,

address:
document.getElementById('address').value

};

const response = await fetch('/api/suppliers',{

method:'POST',

headers:{
'Content-Type':'application/json'
},

body:JSON.stringify(supplier)

});

const result = await response.json();

alert(result.message);

document.getElementById('supplierForm').reset();

loadSuppliers();

});

async function deleteSupplier(id){

if(!confirm("Delete Supplier?")) return;

const response=await fetch(`/api/suppliers/${id}`,{

method:'DELETE'

});

const result=await response.json();

alert(result.message);

loadSuppliers();

}

loadSuppliers();
async function editSupplier(id, supplierName, contact, phone, email, address) {

    const newName = prompt("Supplier Name", supplierName);
    if (newName === null) return;

    const newContact = prompt("Contact Person", contact);
    if (newContact === null) return;

    const newPhone = prompt("Phone", phone);
    if (newPhone === null) return;

    const newEmail = prompt("Email", email);
    if (newEmail === null) return;

    const newAddress = prompt("Address", address);
    if (newAddress === null) return;

    const response = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            supplier_name: newName,
            contact_person: newContact,
            phone: newPhone,
            email: newEmail,
            address: newAddress
        })
    });

    const result = await response.json();

    alert(result.message);

    if (response.ok) {
        loadSuppliers();
    }
}