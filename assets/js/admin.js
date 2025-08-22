// ===== ADMIN PANEL JAVASCRIPT =====

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminComponents();
    setupAdminEventListeners();
    initializeCharts();
});

// ===== COMPONENT INITIALIZATION =====
function initializeAdminComponents() {
    // Initialize tooltips
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Initialize popovers
    if (typeof bootstrap !== 'undefined') {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
    
    // Initialize modals
    if (typeof bootstrap !== 'undefined') {
        const modalTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="modal"]'));
        modalTriggerList.map(function (modalTriggerEl) {
            return new bootstrap.Modal(modalTriggerEl);
        });
    }
    
    // Initialize sidebar functionality
    initializeSidebar();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize image uploads
    initializeImageUploads();
    
    // Initialize data tables
    initializeDataTables();
}

// ===== EVENT LISTENERS =====
function setupAdminEventListeners() {
    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Form submissions
    const forms = document.querySelectorAll('form[data-ajax]');
    forms.forEach(form => {
        form.addEventListener('submit', handleAjaxFormSubmit);
    });
    
    // Delete confirmations
    const deleteButtons = document.querySelectorAll('[data-delete]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteConfirmation);
    });
    
    // Bulk actions
    const bulkActionForms = document.querySelectorAll('.bulk-actions-form');
    bulkActionForms.forEach(form => {
        form.addEventListener('submit', handleBulkActions);
    });
    
    // Search functionality
    const searchInputs = document.querySelectorAll('[data-search]');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleSearch, 300));
    });
    
    // Filter changes
    const filterSelects = document.querySelectorAll('[data-filter]');
    filterSelects.forEach(select => {
        select.addEventListener('change', handleFilterChange);
    });
    
    // Sort functionality
    const sortButtons = document.querySelectorAll('[data-sort]');
    sortButtons.forEach(button => {
        button.addEventListener('click', handleSort);
    });
}

// ===== SIDEBAR FUNCTIONALITY =====
function initializeSidebar() {
    // Handle sidebar collapse on mobile
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        // Add overlay for mobile
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay d-lg-none';
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
        });
        document.body.appendChild(overlay);
        
        // Handle sidebar state changes
        sidebar.addEventListener('show.bs.collapse', () => {
            overlay.style.display = 'block';
        });
        
        sidebar.addEventListener('hide.bs.collapse', () => {
            overlay.style.display = 'none';
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// ===== FORM VALIDATION =====
function initializeFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        form.addEventListener('submit', validateForm);
    });
    
    // Real-time validation
    const inputs = document.querySelectorAll('input[data-validate], textarea[data-validate], select[data-validate]');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function validateForm(event) {
    const form = event.target;
    let isValid = true;
    
    // Clear previous errors
    clearFormErrors(form);
    
    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });
    
    // Validate email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        if (field.value && !isValidEmail(field.value)) {
            showFieldError(field, 'Please enter a valid email address');
            isValid = false;
        }
    });
    
    // Validate URL fields
    const urlFields = form.querySelectorAll('input[type="url"]');
    urlFields.forEach(field => {
        if (field.value && !isValidUrl(field.value)) {
            showFieldError(field, 'Please enter a valid URL');
            isValid = false;
        }
    });
    
    if (!isValid) {
        event.preventDefault();
        showNotification('Please fix the errors in the form', 'error');
    }
    
    return isValid;
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Required validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    // URL validation
    if (field.type === 'url' && value && !isValidUrl(value)) {
        showFieldError(field, 'Please enter a valid URL');
        return false;
    }
    
    // Custom validation
    const validationRule = field.dataset.validate;
    if (validationRule && !validateCustomRule(field, validationRule, value)) {
        showFieldError(field, field.dataset.errorMessage || 'Invalid value');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

function validateCustomRule(field, rule, value) {
    switch (rule) {
        case 'minLength':
            const minLength = parseInt(field.dataset.minLength);
            return value.length >= minLength;
        case 'maxLength':
            const maxLength = parseInt(field.dataset.maxLength);
            return value.length <= maxLength;
        case 'pattern':
            const pattern = new RegExp(field.dataset.pattern);
            return pattern.test(value);
        default:
            return true;
    }
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.classList.add('is-invalid');
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function clearFormErrors(form) {
    const errorFields = form.querySelectorAll('.is-invalid');
    errorFields.forEach(field => {
        clearFieldError(field);
    });
}

// ===== IMAGE UPLOAD FUNCTIONALITY =====
function initializeImageUploads() {
    const imageUploads = document.querySelectorAll('[data-image-upload]');
    imageUploads.forEach(upload => {
        upload.addEventListener('change', handleImageUpload);
    });
    
    // Drag and drop functionality
    const dropZones = document.querySelectorAll('[data-drop-zone]');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const uploadId = event.target.dataset.uploadId;
        const preview = document.querySelector(`[data-preview="${uploadId}"]`);
        
        if (preview) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
        
        // Show upload progress
        showUploadProgress(uploadId, file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    const zone = event.currentTarget;
    zone.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const uploadInput = zone.querySelector('input[type="file"]');
        if (uploadInput) {
            uploadInput.files = files;
            uploadInput.dispatchEvent(new Event('change'));
        }
    }
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function showUploadProgress(uploadId, file) {
    // Create progress bar
    const progressContainer = document.querySelector(`[data-progress="${uploadId}"]`);
    if (progressContainer) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = '0%';
        progressContainer.appendChild(progressBar);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    progressContainer.remove();
                }, 1000);
            }
            progressBar.style.width = progress + '%';
        }, 200);
    }
}

// ===== DATA TABLES =====
function initializeDataTables() {
    const tables = document.querySelectorAll('[data-table]');
    tables.forEach(table => {
        initializeTable(table);
    });
}

function initializeTable(table) {
    // Add search functionality
    const searchInput = table.querySelector('[data-table-search]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTable(table, e.target.value);
        });
    }
    
    // Add pagination
    const pagination = table.querySelector('[data-table-pagination]');
    if (pagination) {
        initializePagination(table, pagination);
    }
    
    // Add sorting
    const sortableHeaders = table.querySelectorAll('[data-sortable]');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            sortTable(table, header);
        });
    });
}

function filterTable(table, searchTerm) {
    const rows = table.querySelectorAll('tbody tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(term)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function sortTable(table, header) {
    const column = header.dataset.column;
    const direction = header.dataset.direction === 'asc' ? 'desc' : 'asc';
    
    // Update header direction
    header.dataset.direction = direction;
    
    // Update header icon
    const icon = header.querySelector('.sort-icon');
    if (icon) {
        icon.className = `sort-icon fas fa-sort-${direction === 'asc' ? 'up' : 'down'}`;
    }
    
    // Sort table rows
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.querySelector(`[data-column="${column}"]`).textContent;
        const bValue = b.querySelector(`[data-column="${column}"]`).textContent;
        
        if (direction === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // Reorder rows
    rows.forEach(row => tbody.appendChild(row));
}

// ===== AJAX FORM HANDLING =====
function handleAjaxFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const url = form.action || window.location.href;
    const method = form.method || 'POST';
    
    // Show loading state
    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Make AJAX request
    fetch(url, {
        method: method,
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message || 'Operation completed successfully', 'success');
            
            // Handle success actions
            if (data.redirect) {
                window.location.href = data.redirect;
            } else if (data.reload) {
                window.location.reload();
            }
        } else {
            showNotification(data.message || 'Operation failed', 'error');
        }
    })
    .catch(error => {
        console.error('Form submission error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    });
}

// ===== DELETE CONFIRMATION =====
function handleDeleteConfirmation(event) {
    event.preventDefault();
    
    const button = event.target;
    const itemName = button.dataset.itemName || 'this item';
    const confirmMessage = button.dataset.confirmMessage || `Are you sure you want to delete ${itemName}?`;
    
    if (confirm(confirmMessage)) {
        const url = button.dataset.deleteUrl || button.href;
        const method = button.dataset.deleteMethod || 'DELETE';
        
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        // Make delete request
        fetch(url, {
            method: method,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message || 'Item deleted successfully', 'success');
                
                // Remove from DOM or reload
                if (data.reload) {
                    window.location.reload();
                } else {
                    const row = button.closest('tr');
                    if (row) {
                        row.remove();
                    }
                }
            } else {
                showNotification(data.message || 'Delete failed', 'error');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        })
        .finally(() => {
            // Reset button state
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || 'Delete';
        });
    }
}

// ===== BULK ACTIONS =====
function handleBulkActions(event) {
    event.preventDefault();
    
    const form = event.target;
    const action = form.querySelector('[name="bulk_action"]').value;
    const selectedItems = form.querySelectorAll('input[name="selected_items[]"]:checked');
    
    if (selectedItems.length === 0) {
        showNotification('Please select items to perform bulk actions', 'warning');
        return;
    }
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedItems.length} selected items?`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Submit form
    form.submit();
}

// ===== SEARCH FUNCTIONALITY =====
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchTarget = event.target.dataset.search;
    const targetElement = document.querySelector(searchTarget);
    
    if (targetElement) {
        const items = targetElement.querySelectorAll('[data-search-item]');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// ===== FILTER FUNCTIONALITY =====
function handleFilterChange(event) {
    const filterValue = event.target.value;
    const filterTarget = event.target.dataset.filter;
    const targetElement = document.querySelector(filterTarget);
    
    if (targetElement) {
        const items = targetElement.querySelectorAll('[data-filter-item]');
        items.forEach(item => {
            const itemValue = item.dataset.filterValue;
            if (filterValue === 'all' || itemValue === filterValue) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// ===== SORT FUNCTIONALITY =====
function handleSort(event) {
    event.preventDefault();
    
    const button = event.target;
    const sortField = button.dataset.sort;
    const currentOrder = button.dataset.order || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    
    // Update button state
    button.dataset.order = newOrder;
    
    // Update URL and reload
    const url = new URL(window.location);
    url.searchParams.set('sort', sortField);
    url.searchParams.set('order', newOrder);
    window.location.href = url.toString();
}

// ===== CHART INITIALIZATION =====
function initializeCharts() {
    // Dashboard charts
    const dashboardCharts = document.querySelectorAll('[data-chart]');
    dashboardCharts.forEach(chartElement => {
        const chartType = chartElement.dataset.chart;
        const chartData = JSON.parse(chartElement.dataset.chartData || '{}');
        
        switch (chartType) {
            case 'line':
                createLineChart(chartElement, chartData);
                break;
            case 'bar':
                createBarChart(chartElement, chartData);
                break;
            case 'doughnut':
                createDoughnutChart(chartElement, chartData);
                break;
        }
    });
}

function createLineChart(element, data) {
    if (typeof Chart === 'undefined') return;
    
    new Chart(element, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createBarChart(element, data) {
    if (typeof Chart === 'undefined') return;
    
    new Chart(element, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createDoughnutChart(element, data) {
    if (typeof Chart === 'undefined') return;
    
    new Chart(element, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===== EXPORT FOR GLOBAL USE =====
window.AdminPanel = {
    showNotification,
    validateForm,
    handleImageUpload,
    initializeCharts
};