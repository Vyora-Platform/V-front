// Sellers Page JavaScript

let allSellers = [];
let filteredSellers = [];

// Load all sellers
async function loadSellers() {
    try {
        allSellers = await apiCall('/sellers');
        filteredSellers = [...allSellers];
        displaySellers();
    } catch (error) {
        console.error('Error loading sellers:', error);
        showToast('Failed to load sellers', 'error');
    }
}

// Display sellers
function displaySellers() {
    const container = document.getElementById('sellersContainer');
    
    if (filteredSellers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Sellers Found</h3>
                <p>Start by registering your first seller</p>
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
                    <th>Business</th>
                    <th>Phone</th>
                    <th>Referral Code</th>
                    <th>Customers</th>
                    <th>Referrals</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredSellers.map(seller => `
                    <tr>
                        <td><strong>${seller.name}</strong></td>
                        <td>${seller.email}</td>
                        <td>${seller.businessName || 'N/A'}</td>
                        <td>${seller.phoneNumber}</td>
                        <td><code style="background: #f7fafc; padding: 0.25rem 0.5rem; border-radius: 4px;">${seller.referralCode}</code></td>
                        <td><strong>${seller.totalCustomers || 0}</strong></td>
                        <td><strong>${seller.totalReferrals || 0}</strong></td>
                        <td>${getStatusBadge(seller.status)}</td>
                        <td>
                            <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;" onclick="showSellerDetails('${seller.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Filter sellers
function filterSellers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredSellers = allSellers.filter(seller => {
        const matchesSearch = seller.name.toLowerCase().includes(searchTerm) ||
                            seller.email.toLowerCase().includes(searchTerm) ||
                            (seller.businessName && seller.businessName.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || seller.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    displaySellers();
}

// Show register modal
function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

// Close register modal
function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerForm').reset();
}

// Register seller
async function registerSeller(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        businessName: document.getElementById('businessName').value,
        businessType: document.getElementById('businessType').value,
        address: document.getElementById('address').value,
        usedReferralCode: document.getElementById('usedReferralCode').value || null
    };
    
    try {
        const result = await apiCall('/sellers/register', 'POST', formData);
        showToast('Seller registered successfully!', 'success');
        closeRegisterModal();
        loadSellers();
    } catch (error) {
        showToast(error.message || 'Failed to register seller', 'error');
    }
}

// Show seller details
async function showSellerDetails(sellerId) {
    try {
        const seller = await apiCall(`/sellers/${sellerId}`);
        const referralInfo = await apiCall(`/sellers/${sellerId}/referrals`);
        
        const detailsHTML = `
            <div class="details-card">
                <div class="details-grid">
                    <div>
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                            <i class="fas fa-user"></i> Personal Information
                        </h3>
                        <div class="detail-item">
                            <div class="detail-label">Name</div>
                            <div class="detail-value">${seller.name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Email</div>
                            <div class="detail-value">${seller.email}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone</div>
                            <div class="detail-value">${seller.phoneNumber}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">${getStatusBadge(seller.status)}</div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                            <i class="fas fa-briefcase"></i> Business Information
                        </h3>
                        <div class="detail-item">
                            <div class="detail-label">Business Name</div>
                            <div class="detail-value">${seller.businessName || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Business Type</div>
                            <div class="detail-value">${seller.businessType || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Address</div>
                            <div class="detail-value">${seller.address || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                        <i class="fas fa-share-nodes"></i> Referral Information
                    </h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">My Referral Code</div>
                            <div class="detail-value">
                                <code style="background: linear-gradient(135deg, #1877F2, #42B72A); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 1.25rem; display: inline-block;">
                                    ${seller.referralCode}
                                </code>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Used Referral Code</div>
                            <div class="detail-value">${seller.usedReferralCode || 'None'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Customers</div>
                            <div class="detail-value"><strong>${seller.totalCustomers || 0}</strong></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Referrals</div>
                            <div class="detail-value"><strong>${seller.totalReferrals || 0}</strong></div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Joined</div>
                            <div class="detail-value">${formatDate(seller.createdAt)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Last Updated</div>
                            <div class="detail-value">${formatDate(seller.updatedAt)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('sellerDetailsContent').innerHTML = detailsHTML;
        document.getElementById('detailsModal').style.display = 'block';
        
    } catch (error) {
        showToast('Failed to load seller details', 'error');
    }
}

// Close details modal
function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const registerModal = document.getElementById('registerModal');
    const detailsModal = document.getElementById('detailsModal');
    
    if (event.target === registerModal) {
        closeRegisterModal();
    }
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
};

// Check URL for action parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'register') {
    setTimeout(() => showRegisterModal(), 500);
}

// Load sellers when page loads
document.addEventListener('DOMContentLoaded', loadSellers);

