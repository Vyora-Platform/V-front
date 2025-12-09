// Seller Profile Dropdown Functionality

// Store seller data globally for edit modal
let currentSellerData = null;

// Profile dropdown toggle
function toggleProfileDropdown() {
    const menu = document.getElementById('profileDropdownMenu');
    menu.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.profile-dropdown');
    const editModal = document.getElementById('editProfileModal');
    
    if (dropdown && !dropdown.contains(event.target)) {
        const menu = document.getElementById('profileDropdownMenu');
        if (menu) menu.classList.remove('show');
    }
    
    // Close modal if clicking outside
    if (editModal && editModal.classList.contains('active') && event.target === editModal) {
        closeEditProfileModal();
    }
});

// Get initials from name
function getInitials(name) {
    if (!name) return 'S';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Format full date with time
function formatFullDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load seller profile data
async function loadSellerProfile() {
    try {
        const sellerId = localStorage.getItem('sellerId');
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!sellerId) {
            console.error('No seller ID found');
            // Set basic info from localStorage
            document.getElementById('dropdownName').textContent = userName || 'User';
            document.getElementById('dropdownEmail').textContent = userEmail || 'N/A';
            const initials = getInitials(userName);
            document.getElementById('profileInitials').textContent = initials;
            document.getElementById('dropdownInitials').textContent = initials;
            return;
        }
        
        const seller = await apiCall(`/sellers/${sellerId}`);
        const referralInfo = await apiCall(`/sellers/${sellerId}/referrals`);
        
        // Store for edit modal
        currentSellerData = seller;
        
        // Set initials
        const initials = getInitials(seller.name);
        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('dropdownInitials').textContent = initials;
        
        // Set basic info
        document.getElementById('dropdownName').textContent = seller.name || 'N/A';
        document.getElementById('dropdownEmail').textContent = seller.email || 'N/A';
        
        // Set business details
        document.getElementById('dropdownBusinessName').textContent = seller.businessName || 'Not Set';
        document.getElementById('dropdownBusinessType').textContent = seller.businessType || 'Not Set';
        document.getElementById('dropdownPhone').textContent = seller.phoneNumber || 'Not Set';
        document.getElementById('dropdownAddress').textContent = seller.address || 'Not Set';
        
        // Set stats
        document.getElementById('dropdownCustomers').textContent = seller.totalCustomers || 0;
        document.getElementById('dropdownReferrals').textContent = seller.totalReferrals || 0;
        document.getElementById('dropdownReferralCode').textContent = referralInfo.myReferralCode || 'N/A';
        
        // Set status with badge
        const statusElement = document.getElementById('dropdownStatus');
        statusElement.innerHTML = getStatusBadge(seller.status || 'PENDING');
        
        // Set member since
        document.getElementById('dropdownMemberSince').textContent = formatDate(seller.createdAt);
        document.getElementById('dropdownUpdatedAt').textContent = formatDate(seller.updatedAt);
        
        // Set payment information
        document.getElementById('dropdownPaymentMethod').textContent = seller.paymentMethod || 'Not Set';
        document.getElementById('dropdownBankName').textContent = seller.bankName || 'Not Set';
        document.getElementById('dropdownAccountHolder').textContent = seller.accountHolderName || 'Not Set';
        document.getElementById('dropdownAccountNumber').textContent = seller.accountNumber ? maskAccountNumber(seller.accountNumber) : 'Not Set';
        document.getElementById('dropdownIFSC').textContent = seller.ifscCode || 'Not Set';
        document.getElementById('dropdownUPI').textContent = seller.upiId || 'Not Set';
        
        // Set referral info
        document.getElementById('dropdownUsedReferralCode').textContent = seller.usedReferralCode || 'None';
        
    } catch (error) {
        console.error('Error loading seller profile:', error);
        // Set defaults on error
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        document.getElementById('dropdownName').textContent = userName || 'User';
        document.getElementById('dropdownEmail').textContent = userEmail || 'N/A';
        const initials = getInitials(userName);
        document.getElementById('profileInitials').textContent = initials;
        document.getElementById('dropdownInitials').textContent = initials;
    }
}

// Mask account number for security
function maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    const visible = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return masked + visible;
}

// Open edit profile modal
function openEditProfileModal() {
    if (!currentSellerData) {
        showToast('Profile data not loaded yet. Please try again.', 'error');
        return;
    }
    
    // Populate form with current data
    document.getElementById('editProfileName').value = currentSellerData.name || '';
    document.getElementById('editProfileEmail').value = currentSellerData.email || '';
    document.getElementById('editProfilePhone').value = currentSellerData.phoneNumber || '';
    document.getElementById('editProfileBusinessName').value = currentSellerData.businessName || '';
    document.getElementById('editProfileBusinessType').value = currentSellerData.businessType || '';
    document.getElementById('editProfileAddress').value = currentSellerData.address || '';
    
    // Populate type-specific fields
    document.getElementById('editProfileCurrentOccupation').value = currentSellerData.currentOccupation || '';
    document.getElementById('editProfileNumberOfCreators').value = currentSellerData.numberOfCreators || '';
    document.getElementById('editProfileNumberOfFollowers').value = currentSellerData.numberOfFollowers || '';
    
    // Show/hide type-specific fields based on current type
    toggleEditTypeFields();
    
    document.getElementById('editProfilePaymentMethod').value = currentSellerData.paymentMethod || '';
    document.getElementById('editProfileBankName').value = currentSellerData.bankName || '';
    document.getElementById('editProfileAccountHolder').value = currentSellerData.accountHolderName || '';
    document.getElementById('editProfileAccountNumber').value = currentSellerData.accountNumber || '';
    document.getElementById('editProfileIFSC').value = currentSellerData.ifscCode || '';
    document.getElementById('editProfileUPI').value = currentSellerData.upiId || '';
    
    // Show modal
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.add('active');
        // Close dropdown
        const dropdown = document.getElementById('profileDropdownMenu');
        if (dropdown) dropdown.classList.remove('show');
    }
}

// Close edit profile modal
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.remove('active');
}

// Toggle type-specific fields in edit modal
function toggleEditTypeFields() {
    const businessType = document.getElementById('editProfileBusinessType').value;
    const individualField = document.getElementById('editIndividualField');
    const agencyField = document.getElementById('editAgencyField');
    const creatorField = document.getElementById('editCreatorField');
    
    // Hide all conditional fields
    if (individualField) individualField.style.display = 'none';
    if (agencyField) agencyField.style.display = 'none';
    if (creatorField) creatorField.style.display = 'none';
    
    // Show the relevant field based on business type
    if (businessType === 'INDIVIDUAL' && individualField) {
        individualField.style.display = 'block';
    } else if (businessType === 'AGENCY' && agencyField) {
        agencyField.style.display = 'block';
    } else if (businessType === 'CREATOR' && creatorField) {
        creatorField.style.display = 'block';
    }
}

// Save profile changes
async function saveProfileChanges(event) {
    event.preventDefault();
    
    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId) {
        showToast('Seller ID not found. Please login again.', 'error');
        return;
    }
    
    const businessType = document.getElementById('editProfileBusinessType').value;
    const updateData = {
        name: document.getElementById('editProfileName').value,
        email: document.getElementById('editProfileEmail').value,
        phoneNumber: document.getElementById('editProfilePhone').value || null,
        businessName: document.getElementById('editProfileBusinessName').value || null,
        businessType: businessType || null,
        address: document.getElementById('editProfileAddress').value || null,
        paymentMethod: document.getElementById('editProfilePaymentMethod').value || null,
        bankName: document.getElementById('editProfileBankName').value || null,
        accountHolderName: document.getElementById('editProfileAccountHolder').value || null,
        accountNumber: document.getElementById('editProfileAccountNumber').value || null,
        ifscCode: document.getElementById('editProfileIFSC').value || null,
        upiId: document.getElementById('editProfileUPI').value || null
    };
    
    // Add type-specific fields based on business type
    if (businessType === 'INDIVIDUAL') {
        updateData.currentOccupation = document.getElementById('editProfileCurrentOccupation').value || null;
        updateData.numberOfCreators = null;
        updateData.numberOfFollowers = null;
    } else if (businessType === 'AGENCY') {
        updateData.numberOfCreators = document.getElementById('editProfileNumberOfCreators').value || null;
        updateData.currentOccupation = null;
        updateData.numberOfFollowers = null;
    } else if (businessType === 'CREATOR') {
        updateData.numberOfFollowers = document.getElementById('editProfileNumberOfFollowers').value || null;
        updateData.currentOccupation = null;
        updateData.numberOfCreators = null;
    } else {
        updateData.currentOccupation = null;
        updateData.numberOfCreators = null;
        updateData.numberOfFollowers = null;
    }
    
    try {
        // Disable button and show loading
        const submitBtn = document.querySelector('#editProfileForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        await apiCall(`/sellers/${sellerId}`, 'PUT', updateData);
        
        showToast('✅ Profile updated successfully!', 'success');
        
        // Update localStorage if name or email changed
        if (updateData.name) localStorage.setItem('userName', updateData.name);
        if (updateData.email) localStorage.setItem('userEmail', updateData.email);
        
        // Close modal and reload profile
        closeEditProfileModal();
        await loadSellerProfile();
        
        // Restore button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
    } catch (error) {
        showToast(`❌ Failed to update profile: ${error.message}`, 'error');
        // Restore button
        const submitBtn = document.querySelector('#editProfileForm button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
}

// Auto-load profile when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSellerProfile);
} else {
    loadSellerProfile();
}

