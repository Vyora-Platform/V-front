// Referrals Page JavaScript

let allSellers = [];

// Load sellers
async function loadSellers() {
    try {
        allSellers = await apiCall('/sellers');
        populateSellerSelect();
    } catch (error) {
        console.error('Error loading sellers:', error);
        showToast('Failed to load sellers', 'error');
    }
}

// Populate seller select dropdown
function populateSellerSelect() {
    const select = document.getElementById('sellerSelect');
    select.innerHTML = '<option value="">-- Choose a Seller --</option>';
    
    allSellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller.id;
        option.textContent = `${seller.name} (${seller.businessName || seller.email})`;
        select.appendChild(option);
    });
}

// Load referral information
async function loadReferralInfo() {
    const sellerId = document.getElementById('sellerSelect').value;
    const container = document.getElementById('referralContent');
    
    if (!sellerId) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-share-nodes"></i>
                <h3>Select a Seller</h3>
                <p>Choose a seller from the dropdown above to view their referral network</p>
            </div>
        `;
        return;
    }
    
    try {
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading referral information...</div>';
        
        const referralInfo = await apiCall(`/sellers/${sellerId}/referrals`);
        const seller = allSellers.find(s => s.id === sellerId);
        
        displayReferralInfo(seller, referralInfo);
        
    } catch (error) {
        console.error('Error loading referral info:', error);
        showToast('Failed to load referral information', 'error');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Data</h3>
                <p>Failed to load referral information</p>
            </div>
        `;
    }
}

// Display referral information
function displayReferralInfo(seller, referralInfo) {
    const container = document.getElementById('referralContent');
    
    let html = `
        <!-- Seller Info Card -->
        <div class="referral-info">
            <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-user-circle"></i> ${seller.name}
            </h2>
            
            <!-- Referral Code Display -->
            <div class="referral-code-display">
                <h3>My Referral Code</h3>
                <div class="referral-code">${referralInfo.myReferralCode}</div>
                <p style="margin-top: 1rem; opacity: 0.9;">Share this code with others to grow your network</p>
            </div>
            
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Used Referral Code</div>
                    <div class="detail-value">${referralInfo.usedReferralCode || 'None (Direct Registration)'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Referrals</div>
                    <div class="detail-value"><strong style="font-size: 1.5rem; color: var(--primary-color);">${referralInfo.totalReferrals}</strong></div>
                </div>
            </div>
        </div>
    `;
    
    // Referred By Section
    if (referralInfo.referredBy) {
        html += `
            <div class="referral-info">
                <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-user-check"></i> Referred By
                </h3>
                <div class="referral-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${referralInfo.referredBy.name}</h4>
                            <p style="color: #718096; margin-bottom: 0.25rem;">
                                <i class="fas fa-envelope"></i> ${referralInfo.referredBy.email}
                            </p>
                            <p style="color: #718096;">
                                <i class="fas fa-briefcase"></i> ${referralInfo.referredBy.businessName || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <code style="background: linear-gradient(135deg, #1877F2, #42B72A); color: white; padding: 0.5rem 1rem; border-radius: 8px; display: inline-block;">
                                ${referralInfo.referredBy.referralCode}
                            </code>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <div>
                            <div style="font-size: 0.875rem; color: #718096;">Customers</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${referralInfo.referredBy.totalCustomers || 0}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096;">Referrals</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${referralInfo.referredBy.totalReferrals || 0}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096;">Status</div>
                            <div style="margin-top: 0.5rem;">${getStatusBadge(referralInfo.referredBy.status)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Referred Sellers Section
    if (referralInfo.referredSellers && referralInfo.referredSellers.length > 0) {
        html += `
            <div class="referral-info">
                <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-users"></i> My Referrals (${referralInfo.referredSellers.length})
                </h3>
                <div class="referral-grid">
        `;
        
        referralInfo.referredSellers.forEach(referredSeller => {
            html += `
                <div class="referral-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${referredSeller.name}</h4>
                            <p style="color: #718096; font-size: 0.875rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-envelope"></i> ${referredSeller.email}
                            </p>
                            <p style="color: #718096; font-size: 0.875rem;">
                                <i class="fas fa-briefcase"></i> ${referredSeller.businessName || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <div>
                            <div style="font-size: 0.75rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Customers</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${referredSeller.totalCustomers || 0}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Referrals</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${referredSeller.totalReferrals || 0}</div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <code style="background: #f7fafc; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.875rem; display: inline-block;">
                            ${referredSeller.referralCode}
                        </code>
                        ${getStatusBadge(referredSeller.status)}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="referral-info">
                <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-users"></i> My Referrals
                </h3>
                <div class="empty-state" style="padding: 2rem;">
                    <i class="fas fa-user-plus"></i>
                    <h3>No Referrals Yet</h3>
                    <p>Share your referral code to start building your network</p>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Load sellers when page loads
document.addEventListener('DOMContentLoaded', loadSellers);

