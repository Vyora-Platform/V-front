// Customers Page JavaScript

let allSellers = [];
let allCustomers = [];
let filteredCustomers = [];

// Load initial data
async function loadData() {
    try {
        // Load sellers first
        allSellers = await apiCall('/sellers');
        
        // Populate seller dropdowns
        populateSellerDropdown();
        populateSellerFilter();
        
        // Load all customers
        await loadAllCustomers();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    }
}

// Load all customers
async function loadAllCustomers() {
    allCustomers = [];
    
    // Fetch customers for each seller
    for (const seller of allSellers) {
        try {
            const customers = await apiCall(`/customers/seller/${seller.id}`);
            allCustomers.push(...customers);
        } catch (error) {
            console.error(`Error loading customers for seller ${seller.id}:`, error);
        }
    }
    
    filteredCustomers = [...allCustomers];
    displayCustomers();
}

// Populate seller dropdown in add customer modal
function populateSellerDropdown() {
    const select = document.getElementById('sellerId');
    select.innerHTML = '<option value="">-- Choose a Seller --</option>';
    
    allSellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller.id;
        option.textContent = `${seller.name} (${seller.businessName || seller.email})`;
        select.appendChild(option);
    });
}

// Populate seller filter
function populateSellerFilter() {
    const select = document.getElementById('sellerFilter');
    select.innerHTML = '<option value="">All Sellers</option>';
    
    allSellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller.id;
        option.textContent = `${seller.name} (${seller.businessName || seller.email})`;
        select.appendChild(option);
    });
}

// Display customers
function displayCustomers() {
    const container = document.getElementById('customersContainer');
    
    if (filteredCustomers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>No Customers Found</h3>
                <p>Add your first customer to get started</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredCustomers.map(customer => {
                    const seller = allSellers.find(s => s.id === customer.sellerId);
                    return `
                        <tr>
                            <td><strong>${customer.name}</strong></td>
                            <td>${customer.email}</td>
                            <td>${customer.phoneNumber}</td>
                            <td>${seller ? seller.name : 'Unknown'}</td>
                            <td>${getStatusBadge(customer.status)}</td>
                            <td>${formatDate(customer.createdAt)}</td>
                            <td>
                                <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;" onclick="showCustomerDetails('${customer.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Filter customers
function filterCustomers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sellerFilter = document.getElementById('sellerFilter').value;
    
    filteredCustomers = allCustomers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm) ||
                            customer.email.toLowerCase().includes(searchTerm);
        
        const matchesSeller = !sellerFilter || customer.sellerId === sellerFilter;
        
        return matchesSearch && matchesSeller;
    });
    
    displayCustomers();
}

// Show add customer modal
function showAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'block';
}

// Close add customer modal
function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'none';
    document.getElementById('addCustomerForm').reset();
}

// Add customer
async function addCustomer(event) {
    event.preventDefault();
    
    const sellerId = document.getElementById('sellerId').value;
    const formData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phoneNumber: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
    };
    
    try {
        await apiCall(`/customers/seller/${sellerId}`, 'POST', formData);
        showToast('Customer added successfully!', 'success');
        closeAddCustomerModal();
        await loadAllCustomers();
    } catch (error) {
        showToast(error.message || 'Failed to add customer', 'error');
    }
}

// Show customer details
async function showCustomerDetails(customerId) {
    try {
        const customer = await apiCall(`/customers/${customerId}`);
        const seller = allSellers.find(s => s.id === customer.sellerId);
        
        const detailsHTML = `
            <div class="details-card">
                <div class="details-grid">
                    <div>
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                            <i class="fas fa-user"></i> Customer Information
                        </h3>
                        <div class="detail-item">
                            <div class="detail-label">Name</div>
                            <div class="detail-value">${customer.name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Email</div>
                            <div class="detail-value">${customer.email}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone</div>
                            <div class="detail-value">${customer.phoneNumber}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Address</div>
                            <div class="detail-value">${customer.address || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                            <i class="fas fa-store"></i> Seller Information
                        </h3>
                        <div class="detail-item">
                            <div class="detail-label">Seller Name</div>
                            <div class="detail-value">${seller ? seller.name : 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Business</div>
                            <div class="detail-value">${seller && seller.businessName ? seller.businessName : 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Seller Email</div>
                            <div class="detail-value">${seller ? seller.email : 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">${getStatusBadge(customer.status)}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Added On</div>
                            <div class="detail-value">${formatDate(customer.createdAt)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Last Updated</div>
                            <div class="detail-value">${formatDate(customer.updatedAt)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('customerDetailsContent').innerHTML = detailsHTML;
        document.getElementById('customerDetailsModal').style.display = 'block';
        
    } catch (error) {
        showToast('Failed to load customer details', 'error');
    }
}

// Close customer details modal
function closeCustomerDetailsModal() {
    document.getElementById('customerDetailsModal').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addCustomerModal');
    const detailsModal = document.getElementById('customerDetailsModal');
    
    if (event.target === addModal) {
        closeAddCustomerModal();
    }
    if (event.target === detailsModal) {
        closeCustomerDetailsModal();
    }
};

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadData);

