// Dashboard JavaScript

let allSellers = [];
let allCustomers = [];

// Load dashboard data
async function loadDashboard() {
    try {
        // Load sellers
        allSellers = await apiCall('/sellers');
        
        // Calculate statistics
        const totalSellers = allSellers.length;
        const activeSellers = allSellers.filter(s => s.status === 'ACTIVE').length;
        const totalReferrals = allSellers.reduce((sum, s) => sum + (s.totalReferrals || 0), 0);
        const totalCustomers = allSellers.reduce((sum, s) => sum + (s.totalCustomers || 0), 0);
        
        // Update stats
        document.getElementById('totalSellers').textContent = totalSellers;
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('totalReferrals').textContent = totalReferrals;
        document.getElementById('activeSellers').textContent = activeSellers;
        
        // Display recent sellers
        displayRecentSellers();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

// Display recent sellers
function displayRecentSellers() {
    const container = document.getElementById('recentSellers');
    
    if (allSellers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Sellers Yet</h3>
                <p>Start by registering your first seller</p>
            </div>
        `;
        return;
    }
    
    // Sort by creation date (newest first)
    const recentSellers = [...allSellers]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>Customers</th>
                    <th>Referrals</th>
                    <th>Status</th>
                    <th>Joined</th>
                </tr>
            </thead>
            <tbody>
                ${recentSellers.map(seller => `
                    <tr>
                        <td><strong>${seller.name}</strong></td>
                        <td>${seller.email}</td>
                        <td>${seller.businessName || 'N/A'}</td>
                        <td><strong>${seller.totalCustomers || 0}</strong></td>
                        <td><strong>${seller.totalReferrals || 0}</strong></td>
                        <td>${getStatusBadge(seller.status)}</td>
                        <td>${formatDate(seller.createdAt)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Load dashboard when page loads
document.addEventListener('DOMContentLoaded', loadDashboard);

