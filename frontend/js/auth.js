// Incro4 FinTech Platform - Main Application
// State Management & API Integration

// ============================================================================
// AUTHENTICATION STATE
// ============================================================================
const AuthState = {
  isAuthenticated: false,
  user: null,
  userRole: null, // 'PE' | 'MA' | 'VC' | 'BANKS'
  authStep: 'login', // 'login' | 'register' | 'verify' | 'password' | 'role'
  tempEmail: null,
  loading: false
};

// ============================================================================
// STATE MANAGER
// ============================================================================
const AppState = {
  currentTab: 'analysis',
  currentView: 'viewAnalysis',
  selectedCompany: null,
  theme: 'light',
  
  // Mock Data
  companies: [
    { ticker: 'AAPL', name: 'Apple Inc.', price: 178.50, market_cap: 2800000000000, industry: 'Technology' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', price: 380.20, market_cap: 2850000000000, industry: 'Technology' },
    { ticker: 'JPM', name: 'JPMorgan Chase', price: 156.75, market_cap: 450000000000, industry: 'Financial Services' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 140.25, market_cap: 1750000000000, industry: 'Technology' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 145.80, market_cap: 1500000000000, industry: 'E-commerce' },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: 245.60, market_cap: 780000000000, industry: 'Automotive' }
  ],
  
  financialMetrics: [
    { name: 'P/E Ratio', value: 18.5, change: 2.3, status: 'stable' },
    { name: 'P/B Ratio', value: 2.1, change: -1.2, status: 'stable' },
    { name: 'ROE', value: 15.8, change: 0.5, status: 'improving' },
    { name: 'Debt/Equity', value: 0.45, change: -0.1, status: 'improving' },
    { name: 'Current Ratio', value: 1.8, change: 0.2, status: 'improving' },
    { name: 'Gross Margin', value: 42.5, change: 1.5, status: 'improving' }
  ],
  
  portfolioHoldings: [
    { ticker: 'AAPL', shares: 100, avgCost: 150.00, currentPrice: 178.50, totalValue: 17850 },
    { ticker: 'MSFT', shares: 50, avgCost: 320.00, currentPrice: 380.20, totalValue: 19010 },
    { ticker: 'GOOGL', shares: 75, avgCost: 120.00, currentPrice: 140.25, totalValue: 10518.75 }
  ],
  
  timeSeries: [
    { date: '2024-01-01', value: 150.00 },
    { date: '2024-01-15', value: 155.25 },
    { date: '2024-02-01', value: 162.50 },
    { date: '2024-02-15', value: 170.00 },
    { date: '2024-03-01', value: 178.50 },
    { date: '2024-03-15', value: 175.00 },
    { date: '2024-04-01', value: 180.25 }
  ],
  
  reportTemplates: [
    { id: 1, name: 'Financial Analysis', description: 'Comprehensive financial metrics and ratios' },
    { id: 2, name: 'Stress Test', description: 'Scenario analysis under different conditions' },
    { id: 3, name: 'Peer Comparison', description: 'Compare with industry peers' }
  ],
  
  uploads: [],
  
  // Private Companies Data
  privateCompanies: [
    {
      id: 'pc-001',
      name: 'TechStartup Inc',
      sector: 'SaaS',
      stage: 'Series B',
      location: 'San Francisco, CA',
      founded_year: 2020,
      team_size: 45,
      revenue: 5000000,
      funding_total: 15000000,
      description: 'Leading SaaS platform for enterprise workflow automation'
    },
    {
      id: 'pc-002',
      name: 'FinTech Solutions',
      sector: 'FinTech',
      stage: 'Series A',
      location: 'New York, NY',
      founded_year: 2022,
      team_size: 20,
      revenue: 1000000,
      funding_total: 3000000,
      description: 'Next-generation payment processing for small businesses'
    },
    {
      id: 'pc-003',
      name: 'AI Research Lab',
      sector: 'Artificial Intelligence',
      stage: 'Seed',
      location: 'Boston, MA',
      founded_year: 2023,
      team_size: 8,
      revenue: 0,
      funding_total: 500000,
      description: 'Cutting-edge AI models for healthcare diagnostics'
    },
    {
      id: 'pc-004',
      name: 'GreenEnergy Tech',
      sector: 'CleanTech',
      stage: 'Series B',
      location: 'Austin, TX',
      founded_year: 2021,
      team_size: 35,
      revenue: 3500000,
      funding_total: 12000000,
      description: 'Renewable energy solutions for commercial buildings'
    },
    {
      id: 'pc-005',
      name: 'E-Commerce Plus',
      sector: 'E-commerce',
      stage: 'Series C',
      location: 'Seattle, WA',
      founded_year: 2019,
      team_size: 120,
      revenue: 25000000,
      funding_total: 45000000,
      description: 'AI-powered personalized shopping experiences'
    }
  ],
  
  // Deal Search State
  dealSearchFilters: {
    stage: [],
    sector: '',
    location: '',
    teamSize: 500
  },
  
  dealSearchResults: [],
  dealSearchPage: 1,
  dealSearchPageSize: 20
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const Utils = {
  formatCurrency: (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  },
  
  formatLargeNumber: (value) => {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
  },
  
  formatPercent: (value) => {
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
  },
  
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  
  debounce: (func, wait) => {
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
};

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
const Toast = {
  show: (title, message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// ============================================================================
// MODAL MANAGER
// ============================================================================
const Modal = {
  show: (title, body, onConfirm = null) => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalConfirm = document.getElementById('modalConfirm');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modal.classList.add('active');
    
    if (onConfirm) {
      modalConfirm.onclick = () => {
        onConfirm();
        Modal.hide();
      };
    }
  },
  
  hide: () => {
    document.getElementById('modal').classList.remove('active');
  }
};

// ============================================================================
// CHART MANAGER
// ============================================================================
const ChartManager = {
  charts: {},
  
  createLineChart: (canvasId, labels, data, label) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    if (ChartManager.charts[canvasId]) {
      ChartManager.charts[canvasId].destroy();
    }
    
    ChartManager.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: '#2180A1',
          backgroundColor: 'rgba(33, 128, 141, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  },
  
  createBarChart: (canvasId, labels, data, label) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    if (ChartManager.charts[canvasId]) {
      ChartManager.charts[canvasId].destroy();
    }
    
    ChartManager.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  },
  
  createPieChart: (canvasId, labels, data) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    if (ChartManager.charts[canvasId]) {
      ChartManager.charts[canvasId].destroy();
    }
    
    ChartManager.charts[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
};

// ============================================================================
// AUTHENTICATION MANAGER
// ============================================================================
const AuthManager = {
  init: () => {
    // Check if user is already authenticated
    const savedAuth = AuthManager.checkSession();
    if (savedAuth) {
      AuthState.isAuthenticated = true;
      AuthState.user = savedAuth.user;
      AuthState.userRole = savedAuth.role;
      AuthManager.showDashboard();
    } else {
      AuthManager.showAuthScreen();
    }
    
    AuthManager.setupEventListeners();
  },
  
  setupEventListeners: () => {
    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-auth-tab');
        AuthManager.switchAuthTab(tabName);
      });
    });
    
    // Login
    document.getElementById('btnLogin')?.addEventListener('click', () => {
      AuthManager.handleLogin();
    });
    
    // Send verification
    document.getElementById('btnSendVerification')?.addEventListener('click', () => {
      AuthManager.handleSendVerification();
    });
    
    // Verify code
    document.getElementById('btnVerifyCode')?.addEventListener('click', () => {
      AuthManager.handleVerifyCode();
    });
    
    // Set password
    document.getElementById('btnSetPassword')?.addEventListener('click', () => {
      AuthManager.handleSetPassword();
    });
    
    // Role selection
    document.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        const role = card.getAttribute('data-role');
        AuthManager.handleRoleSelection(role);
      });
    });
    
    // Back button
    document.getElementById('btnBackToAuth')?.addEventListener('click', () => {
      AuthManager.showAuthForm();
    });
    
    // Logout
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      AuthManager.handleLogout();
    });
  },
  
  switchAuthTab: (tabName) => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-auth-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tabName === 'login' ? 'loginPanel' : 'registerPanel').classList.add('active');
  },
  
  handleLogin: () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      Toast.show('Error', 'Please enter email and password', 'error');
      return;
    }
    
    // Simulate API call
    Toast.show('Signing In', 'Verifying credentials...', 'info');
    
    setTimeout(() => {
      // Mock successful login
      const user = {
        email: email,
        name: 'Demo User',
        company: 'Demo Company',
        role: 'PE' // Default role
      };
      
      AuthState.isAuthenticated = true;
      AuthState.user = user;
      AuthState.userRole = user.role;
      
      AuthManager.saveSession(user, user.role);
      AuthManager.showDashboard();
      
      Toast.show('Welcome Back', `Logged in as ${email}`, 'success');
    }, 1000);
  },
  
  handleSendVerification: () => {
    const email = document.getElementById('registerEmail').value;
    
    if (!email || !email.includes('@')) {
      Toast.show('Error', 'Please enter a valid email', 'error');
      return;
    }
    
    AuthState.tempEmail = email;
    Toast.show('Code Sent', `Verification code sent to ${email}`, 'success');
    
    document.getElementById('verificationEmail').textContent = email;
    AuthManager.showVerificationForm();
  },
  
  handleVerifyCode: () => {
    const code = document.getElementById('verificationCode').value;
    
    if (!code || code.length !== 6) {
      Toast.show('Error', 'Please enter a valid 6-digit code', 'error');
      return;
    }
    
    Toast.show('Verifying', 'Checking verification code...', 'info');
    
    setTimeout(() => {
      Toast.show('Verified', 'Email verified successfully', 'success');
      AuthManager.showPasswordForm();
    }, 1000);
  },
  
  handleSetPassword: () => {
    const name = document.getElementById('userName').value;
    const company = document.getElementById('userCompany').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !company || !password || !confirmPassword) {
      Toast.show('Error', 'Please fill all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      Toast.show('Error', 'Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 8) {
      Toast.show('Error', 'Password must be at least 8 characters', 'error');
      return;
    }
    
    Toast.show('Creating Account', 'Setting up your profile...', 'info');
    
    setTimeout(() => {
      AuthState.user = {
        email: AuthState.tempEmail,
        name: name,
        company: company
      };
      
      Toast.show('Account Created', 'Please select your product', 'success');
      AuthManager.showRoleSelection();
    }, 1000);
  },
  
  handleRoleSelection: (role) => {
    Toast.show('Setting Up', `Configuring Incrolink for ${role}...`, 'info');
    
    setTimeout(() => {
      AuthState.userRole = role;
      AuthState.user.role = role;
      AuthState.isAuthenticated = true;
      
      AuthManager.saveSession(AuthState.user, role);
      AuthManager.showDashboard();
      
      const roleNames = {
        'PE': 'Private Equity',
        'MA': 'M&A',
        'VC': 'Venture Capital',
        'BANKS': 'Banking'
      };
      
      Toast.show('Welcome', `Welcome to Incrolink for ${roleNames[role]}`, 'success');
    }, 1000);
  },
  
  handleLogout: () => {
    AuthState.isAuthenticated = false;
    AuthState.user = null;
    AuthState.userRole = null;
    
    // Clear session
    const sessionData = {};
    Object.keys(sessionData).forEach(key => {
      if (key.startsWith('incro_')) {
        delete sessionData[key];
      }
    });
    
    AuthManager.showAuthScreen();
    Toast.show('Logged Out', 'You have been logged out', 'info');
  },
  
  showAuthScreen: () => {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    AuthManager.showAuthForm();
  },
  
  showDashboard: () => {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Update UI based on role
    AuthManager.updateUIForRole();
    
    // Update profile info in settings
    if (AuthState.user) {
      document.getElementById('userProfileInfo').textContent = 
        `${AuthState.user.name} (${AuthState.user.email})`;
      
      const roleNames = {
        'PE': 'Incrolink for PE',
        'MA': 'Incrolink for M&A',
        'VC': 'Incrolink for VC',
        'BANKS': 'Incrolink for Banks'
      };
      document.getElementById('userRoleInfo').textContent = roleNames[AuthState.userRole];
    }
  },
  
  showAuthForm: () => {
    document.getElementById('authForm').style.display = 'block';
    document.getElementById('verificationForm').style.display = 'none';
    document.getElementById('passwordForm').style.display = 'none';
    document.getElementById('roleSelectionForm').style.display = 'none';
  },
  
  showVerificationForm: () => {
    document.getElementById('authForm').style.display = 'none';
    document.getElementById('verificationForm').style.display = 'block';
    document.getElementById('passwordForm').style.display = 'none';
    document.getElementById('roleSelectionForm').style.display = 'none';
  },
  
  showPasswordForm: () => {
    document.getElementById('authForm').style.display = 'none';
    document.getElementById('verificationForm').style.display = 'none';
    document.getElementById('passwordForm').style.display = 'block';
    document.getElementById('roleSelectionForm').style.display = 'none';
  },
  
  showRoleSelection: () => {
    document.getElementById('authForm').style.display = 'none';
    document.getElementById('verificationForm').style.display = 'none';
    document.getElementById('passwordForm').style.display = 'none';
    document.getElementById('roleSelectionForm').style.display = 'block';
  },
  
  updateUIForRole: () => {
    const dealSearchTab = document.querySelector('[data-tab="deal-search"]');
    const onboardingTab = document.querySelector('[data-tab="onboarding"]');
    
    if (AuthState.userRole === 'BANKS') {
      // Banking mode: hide deal search, show onboarding
      if (dealSearchTab) dealSearchTab.style.display = 'none';
      
      // Add onboarding tab if not exists
      if (!onboardingTab) {
        const ribbonTabs = document.querySelector('.ribbon-tabs');
        const onboardingTabElement = document.createElement('button');
        onboardingTabElement.className = 'ribbon-tab';
        onboardingTabElement.setAttribute('data-tab', 'onboarding');
        onboardingTabElement.innerHTML = '<span class="ribbon-tab-text">ONBOARDING</span>';
        ribbonTabs.insertBefore(onboardingTabElement, ribbonTabs.firstChild);
        
        // Add panel
        const ribbonContent = document.getElementById('ribbonContent');
        const onboardingPanel = document.createElement('div');
        onboardingPanel.className = 'ribbon-panel';
        onboardingPanel.setAttribute('data-panel', 'onboarding');
        onboardingPanel.innerHTML = '<div class="ribbon-group"><div class="ribbon-group-title">Setup</div></div>';
        ribbonContent.appendChild(onboardingPanel);
        
        // Re-init ribbon navigation
        RibbonNav.init();
      }
    } else {
      // PE/MA/VC mode: show deal search, hide onboarding
      if (dealSearchTab) dealSearchTab.style.display = 'block';
      if (onboardingTab) onboardingTab.style.display = 'none';
    }
  },
  
  saveSession: (user, role) => {
    // Use in-memory storage (not localStorage due to sandbox)
    const sessionData = { user, role, timestamp: Date.now() };
    // In a real app, this would use sessionStorage or cookies
    AuthState.sessionData = sessionData;
  },
  
  checkSession: () => {
    // Check for existing session
    // In a real app, this would check sessionStorage
    return AuthState.sessionData || null;
  }
};

// ============================================================================
// RIBBON NAVIGATION
// ============================================================================
const RibbonNav = {
  init: () => {
    const tabs = document.querySelectorAll('.ribbon-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        RibbonNav.switchTab(tabName);
      });
    });
  },
  
  switchTab: (tabName) => {
    // Prevent access to restricted tabs based on role
    if (tabName === 'deal-search' && AuthState.userRole === 'BANKS') {
      Toast.show('Access Restricted', 'Deal Search not available for Banking mode', 'warning');
      return;
    }
    
    if (tabName === 'onboarding' && AuthState.userRole !== 'BANKS') {
      Toast.show('Access Restricted', 'Onboarding only available for Banking mode', 'warning');
      return;
    }
    
    // Update tab active state
    document.querySelectorAll('.ribbon-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update panel active state
    document.querySelectorAll('.ribbon-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
    
    // Update view
    const viewMap = {
      'analysis': 'viewAnalysis',
      'deal-search': 'viewDealSearch',
      'data': 'viewData',
      'reports': 'viewReports',
      'portfolio': 'viewPortfolio',
      'settings': 'viewSettings',
      'onboarding': 'viewOnboarding'
    };
    
    Dashboard.switchView(viewMap[tabName]);
    AppState.currentTab = tabName;
  }
};

// ============================================================================
// DASHBOARD MANAGER
// ============================================================================
const Dashboard = {
  switchView: (viewId) => {
    document.querySelectorAll('.dashboard-view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    AppState.currentView = viewId;
    
    // Trigger view-specific initialization
    if (viewId === 'viewAnalysis') AnalysisView.init();
    if (viewId === 'viewDealSearch') DealSearchView.init();
    if (viewId === 'viewOnboarding') OnboardingView.init();
    if (viewId === 'viewData') DataView.init();
    if (viewId === 'viewReports') ReportsView.init();
    if (viewId === 'viewPortfolio') PortfolioView.init();
    if (viewId === 'viewSettings') SettingsView.init();
  }
};

// ============================================================================
// ANALYSIS VIEW
// ============================================================================
const AnalysisView = {
  init: () => {
    AnalysisView.setupSearch();
    AnalysisView.loadMetricsTable();
    AnalysisView.loadPriceChart();
    AnalysisView.setupChartTypeSelector();
    
    // Load default company
    if (AppState.selectedCompany) {
      AnalysisView.loadCompanyData(AppState.selectedCompany);
    } else {
      AnalysisView.loadCompanyData(AppState.companies[0]);
    }
  },
  
  setupSearch: () => {
    const searchInput = document.getElementById('companySearch');
    const searchResults = document.getElementById('searchResults');
    
    const debouncedSearch = Utils.debounce((query) => {
      if (!query) {
        searchResults.classList.remove('active');
        return;
      }
      
      const results = AppState.companies.filter(company => 
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.ticker.toLowerCase().includes(query.toLowerCase())
      );
      
      if (results.length > 0) {
        searchResults.innerHTML = results.map(company => `
          <div class="search-result-item" data-ticker="${company.ticker}">
            <div class="search-result-ticker">${company.ticker}</div>
            <div class="search-result-name">${company.name}</div>
          </div>
        `).join('');
        searchResults.classList.add('active');
        
        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const ticker = item.getAttribute('data-ticker');
            const company = AppState.companies.find(c => c.ticker === ticker);
            AnalysisView.loadCompanyData(company);
            searchInput.value = `${company.ticker} - ${company.name}`;
            searchResults.classList.remove('active');
          });
        });
      } else {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResults.classList.add('active');
      }
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
      }
    });
  },
  
  loadCompanyData: (company) => {
    AppState.selectedCompany = company;
    
    // Update stats cards
    document.getElementById('statPrice').textContent = Utils.formatCurrency(company.price);
    document.getElementById('statPriceChange').textContent = Utils.formatPercent(2.5);
    document.getElementById('statPriceChange').className = 'stat-change positive';
    
    document.getElementById('statPB').textContent = '2.1';
    document.getElementById('statPBChange').textContent = Utils.formatPercent(-1.2);
    
    document.getElementById('statMktCap').textContent = '$' + Utils.formatLargeNumber(company.market_cap);
    document.getElementById('statMktCapChange').textContent = Utils.formatPercent(1.8);
    
    document.getElementById('statPE').textContent = '18.5';
    document.getElementById('statPEChange').textContent = Utils.formatPercent(2.3);
    
    Toast.show('Company Selected', `Loaded data for ${company.name}`, 'success');
  },
  
  loadMetricsTable: () => {
    const tbody = document.getElementById('metricsTableBody');
    tbody.innerHTML = AppState.financialMetrics.map(metric => `
      <tr>
        <td>${metric.name}</td>
        <td><strong>${metric.value}</strong></td>
        <td class="${metric.change >= 0 ? 'stat-change positive' : 'stat-change negative'}">
          ${Utils.formatPercent(metric.change)}
        </td>
        <td><span class="status-badge ${metric.status}">${metric.status}</span></td>
      </tr>
    `).join('');
  },
  
  loadPriceChart: () => {
    const labels = AppState.timeSeries.map(d => Utils.formatDate(d.date));
    const data = AppState.timeSeries.map(d => d.value);
    ChartManager.createLineChart('priceChart', labels, data, 'Price');
  },
  
  setupChartTypeSelector: () => {
    const selector = document.getElementById('chartTypeSelect');
    selector.addEventListener('change', (e) => {
      const labels = AppState.timeSeries.map(d => Utils.formatDate(d.date));
      const data = AppState.timeSeries.map(d => d.value);
      
      if (e.target.value === 'line') {
        ChartManager.createLineChart('priceChart', labels, data, 'Price');
      } else if (e.target.value === 'bar') {
        ChartManager.createBarChart('priceChart', labels, data, 'Price');
      }
    });
  }
};

// ============================================================================
// DATA VIEW
// ============================================================================
const DataView = {
  init: () => {
    DataView.setupUploadArea();
    DataView.loadUploadsTable();
  },
  
  setupUploadArea: () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        DataView.handleFileUpload(files[0]);
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        DataView.handleFileUpload(e.target.files[0]);
      }
    });
  },
  
  handleFileUpload: (file) => {
    const upload = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      date: new Date().toLocaleString(),
      status: 'processing'
    };
    
    AppState.uploads.push(upload);
    DataView.loadUploadsTable();
    Toast.show('Upload Started', `Uploading ${file.name}...`, 'info');
    
    // Simulate upload process
    setTimeout(() => {
      upload.status = 'completed';
      DataView.loadUploadsTable();
      Toast.show('Upload Complete', `${file.name} uploaded successfully`, 'success');
    }, 2000);
  },
  
  loadUploadsTable: () => {
    const tbody = document.getElementById('uploadsTableBody');
    
    if (AppState.uploads.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No uploads yet. Upload a file to get started.</td></tr>';
      return;
    }
    
    tbody.innerHTML = AppState.uploads.map(upload => `
      <tr>
        <td>${upload.name}</td>
        <td>${upload.size}</td>
        <td>${upload.date}</td>
        <td><span class="status-badge ${upload.status}">${upload.status}</span></td>
        <td>
          <button class="btn-secondary" onclick="DataView.deleteUpload(${upload.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  },
  
  deleteUpload: (id) => {
    const index = AppState.uploads.findIndex(u => u.id === id);
    if (index !== -1) {
      const upload = AppState.uploads[index];
      AppState.uploads.splice(index, 1);
      DataView.loadUploadsTable();
      Toast.show('Upload Deleted', `${upload.name} has been removed`, 'info');
    }
  },
  
  exportData: () => {
    Toast.show('Export Started', 'Preparing CSV file...', 'info');
    setTimeout(() => {
      Toast.show('Export Complete', 'Data exported successfully', 'success');
    }, 1000);
  }
};

// ============================================================================
// REPORTS VIEW
// ============================================================================
const ReportsView = {
  init: () => {
    ReportsView.loadTemplates();
    ReportsView.setupReportForm();
  },
  
  loadTemplates: () => {
    const grid = document.getElementById('templatesGrid');
    grid.innerHTML = AppState.reportTemplates.map(template => `
      <div class="template-card" data-template-id="${template.id}">
        <div class="template-name">${template.name}</div>
        <div class="template-description">${template.description}</div>
      </div>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const templateId = parseInt(card.getAttribute('data-template-id'));
        const template = AppState.reportTemplates.find(t => t.id === templateId);
        document.getElementById('reportType').value = template.name.toLowerCase().replace(' ', '');
        document.getElementById('reportTemplate').innerHTML = `
          <option value="${template.id}" selected>${template.name}</option>
        `;
        Toast.show('Template Selected', template.name, 'info');
      });
    });
  },
  
  setupReportForm: () => {
    const reportType = document.getElementById('reportType');
    const reportTemplate = document.getElementById('reportTemplate');
    
    reportType.addEventListener('change', (e) => {
      const templates = AppState.reportTemplates;
      reportTemplate.innerHTML = '<option value="">Select template...</option>' + 
        templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    });
    
    document.getElementById('btnGenerateReportAction').addEventListener('click', () => {
      const type = document.getElementById('reportType').value;
      const company = document.getElementById('reportCompany').value;
      
      if (!type || !company) {
        Toast.show('Missing Information', 'Please fill all fields', 'warning');
        return;
      }
      
      Toast.show('Generating Report', 'Please wait...', 'info');
      setTimeout(() => {
        Toast.show('Report Ready', 'Your report is ready for download', 'success');
      }, 2000);
    });
  },
  
  downloadReport: () => {
    Toast.show('Download Started', 'Preparing PDF file...', 'info');
    setTimeout(() => {
      Toast.show('Download Complete', 'Report downloaded successfully', 'success');
    }, 1500);
  }
};

// ============================================================================
// DEAL SEARCH VIEW
// ============================================================================
const DealSearchView = {
  init: () => {
    DealSearchView.loadDeals();
    DealSearchView.setupFilters();
    DealSearchView.setupControls();
  },
  
  setupFilters: () => {
    // Team size slider
    const teamSizeSlider = document.getElementById('filterTeamSize');
    const teamSizeValue = document.getElementById('teamSizeValue');
    
    teamSizeSlider?.addEventListener('input', (e) => {
      teamSizeValue.textContent = e.target.value;
      AppState.dealSearchFilters.teamSize = parseInt(e.target.value);
    });
    
    // Apply filters
    document.getElementById('btnApplyFiltersAction')?.addEventListener('click', () => {
      DealSearchView.applyFilters();
    });
    
    // Clear filters
    document.getElementById('btnClearFiltersAction')?.addEventListener('click', () => {
      DealSearchView.clearFilters();
    });
  },
  
  setupControls: () => {
    // Sort
    document.getElementById('sortResults')?.addEventListener('change', (e) => {
      DealSearchView.sortDeals(e.target.value);
    });
  },
  
  loadDeals: (companies = null) => {
    const deals = companies || AppState.privateCompanies;
    AppState.dealSearchResults = deals;
    
    document.getElementById('resultsCount').textContent = 
      `${deals.length} companies found`;
    
    const dealCards = document.getElementById('dealCards');
    dealCards.innerHTML = deals.map(company => `
      <div class="deal-card" data-company-id="${company.id}">
        <div class="deal-card-header">
          <div>
            <div class="deal-card-title">${company.name}</div>
          </div>
          <span class="deal-card-stage">${company.stage}</span>
        </div>
        <div class="deal-card-info">
          <div class="deal-card-info-item">
            <span class="deal-card-info-label">Sector</span>
            <span class="deal-card-info-value">${company.sector}</span>
          </div>
          <div class="deal-card-info-item">
            <span class="deal-card-info-label">Location</span>
            <span class="deal-card-info-value">${company.location}</span>
          </div>
          <div class="deal-card-info-item">
            <span class="deal-card-info-label">Team Size</span>
            <span class="deal-card-info-value">${company.team_size} employees</span>
          </div>
          <div class="deal-card-info-item">
            <span class="deal-card-info-label">Founded</span>
            <span class="deal-card-info-value">${company.founded_year}</span>
          </div>
          <div class="deal-card-info-item">
            <span class="deal-card-info-label">Funding</span>
            <span class="deal-card-info-value">$${Utils.formatLargeNumber(company.funding_total)}</span>
          </div>
        </div>
        <div class="deal-card-actions">
          <button class="btn btn--primary" onclick="DealSearchView.viewDetails('${company.id}')">View Details</button>
          <button class="btn btn--secondary" onclick="DealSearchView.addToPortfolio('${company.id}')">Add to Portfolio</button>
        </div>
      </div>
    `).join('');
  },
  
  applyFilters: () => {
    const stageFilter = Array.from(document.getElementById('filterStage').selectedOptions).map(o => o.value);
    const sectorFilter = document.getElementById('filterSector').value;
    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
    const teamSizeFilter = parseInt(document.getElementById('filterTeamSize').value);
    
    let filtered = AppState.privateCompanies;
    
    if (stageFilter.length > 0) {
      filtered = filtered.filter(c => stageFilter.includes(c.stage));
    }
    
    if (sectorFilter) {
      filtered = filtered.filter(c => c.sector === sectorFilter);
    }
    
    if (locationFilter) {
      filtered = filtered.filter(c => c.location.toLowerCase().includes(locationFilter));
    }
    
    filtered = filtered.filter(c => c.team_size <= teamSizeFilter);
    
    DealSearchView.loadDeals(filtered);
    Toast.show('Filters Applied', `Found ${filtered.length} companies`, 'success');
  },
  
  clearFilters: () => {
    document.getElementById('filterStage').selectedIndex = -1;
    document.getElementById('filterSector').value = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('filterTeamSize').value = 500;
    document.getElementById('teamSizeValue').textContent = '500';
    
    DealSearchView.loadDeals();
    Toast.show('Filters Cleared', 'Showing all companies', 'info');
  },
  
  sortDeals: (sortBy) => {
    let sorted = [...AppState.dealSearchResults];
    
    switch (sortBy) {
      case 'funding':
        sorted.sort((a, b) => b.funding_total - a.funding_total);
        break;
      case 'stage':
        sorted.sort((a, b) => a.stage.localeCompare(b.stage));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    DealSearchView.loadDeals(sorted);
  },
  
  viewDetails: (companyId) => {
    const company = AppState.privateCompanies.find(c => c.id === companyId);
    if (!company) return;
    
    Modal.show(
      company.name,
      `
        <div style="margin-bottom: 16px;">
          <span class="deal-card-stage">${company.stage}</span>
        </div>
        <p style="margin-bottom: 16px; color: var(--color-text-secondary);">${company.description}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div><strong>Sector:</strong> ${company.sector}</div>
          <div><strong>Location:</strong> ${company.location}</div>
          <div><strong>Founded:</strong> ${company.founded_year}</div>
          <div><strong>Team Size:</strong> ${company.team_size}</div>
          <div><strong>Revenue:</strong> $${Utils.formatLargeNumber(company.revenue)}</div>
          <div><strong>Total Funding:</strong> $${Utils.formatLargeNumber(company.funding_total)}</div>
        </div>
      `,
      () => {
        DealSearchView.addToPortfolio(companyId);
      }
    );
    
    document.getElementById('modalConfirm').textContent = 'Add to Portfolio';
  },
  
  addToPortfolio: (companyId) => {
    const company = AppState.privateCompanies.find(c => c.id === companyId);
    if (!company) return;
    
    Toast.show('Added to Portfolio', `${company.name} added to your portfolio`, 'success');
  }
};

// ============================================================================
// ONBOARDING VIEW
// ============================================================================
const OnboardingView = {
  init: () => {
    // Placeholder for banking onboarding
    console.log('Onboarding view initialized');
  }
};

// ============================================================================
// PORTFOLIO VIEW
// ============================================================================
const PortfolioView = {
  init: () => {
    PortfolioView.updateStats();
    PortfolioView.loadHoldingsTable();
    PortfolioView.loadAllocationChart();
  },
  
  updateStats: () => {
    const totalValue = AppState.portfolioHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalCost = AppState.portfolioHoldings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
    const gainLoss = totalValue - totalCost;
    const gainLossPercent = (gainLoss / totalCost) * 100;
    
    document.getElementById('portfolioTotalValue').textContent = Utils.formatCurrency(totalValue);
    document.getElementById('portfolioTotalChange').textContent = Utils.formatPercent(5.2);
    document.getElementById('portfolioTotalChange').className = 'stat-change positive';
    
    document.getElementById('portfolioGainLoss').textContent = Utils.formatCurrency(gainLoss);
    document.getElementById('portfolioGainLossChange').textContent = Utils.formatPercent(gainLossPercent);
    document.getElementById('portfolioGainLossChange').className = gainLoss >= 0 ? 'stat-change positive' : 'stat-change negative';
    
    document.getElementById('portfolioHoldings').textContent = AppState.portfolioHoldings.length;
    
    document.getElementById('portfolioDayChange').textContent = Utils.formatCurrency(456.78);
    document.getElementById('portfolioDayChangePercent').textContent = Utils.formatPercent(1.2);
    document.getElementById('portfolioDayChangePercent').className = 'stat-change positive';
  },
  
  loadHoldingsTable: () => {
    const tbody = document.getElementById('portfolioTableBody');
    
    if (AppState.portfolioHoldings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No holdings yet. Add a position to get started.</td></tr>';
      return;
    }
    
    tbody.innerHTML = AppState.portfolioHoldings.map(holding => {
      const gainLoss = holding.totalValue - (holding.shares * holding.avgCost);
      const gainLossPercent = (gainLoss / (holding.shares * holding.avgCost)) * 100;
      
      return `
        <tr>
          <td><strong>${holding.ticker}</strong></td>
          <td>${holding.shares}</td>
          <td>${Utils.formatCurrency(holding.avgCost)}</td>
          <td>${Utils.formatCurrency(holding.currentPrice)}</td>
          <td>${Utils.formatCurrency(holding.totalValue)}</td>
          <td class="${gainLoss >= 0 ? 'stat-change positive' : 'stat-change negative'}">
            ${Utils.formatCurrency(gainLoss)} (${Utils.formatPercent(gainLossPercent)})
          </td>
        </tr>
      `;
    }).join('');
  },
  
  loadAllocationChart: () => {
    const labels = AppState.portfolioHoldings.map(h => h.ticker);
    const data = AppState.portfolioHoldings.map(h => h.totalValue);
    ChartManager.createPieChart('allocationChart', labels, data);
  },
  
  addPosition: () => {
    Modal.show(
      'Add Position',
      `
        <div class="form-group">
          <label class="form-label">Ticker Symbol</label>
          <input type="text" class="form-control" id="newPositionTicker" placeholder="e.g., AAPL">
        </div>
        <div class="form-group">
          <label class="form-label">Shares</label>
          <input type="number" class="form-control" id="newPositionShares" placeholder="e.g., 100">
        </div>
        <div class="form-group">
          <label class="form-label">Average Cost</label>
          <input type="number" class="form-control" id="newPositionCost" placeholder="e.g., 150.00" step="0.01">
        </div>
      `,
      () => {
        const ticker = document.getElementById('newPositionTicker').value.toUpperCase();
        const shares = parseFloat(document.getElementById('newPositionShares').value);
        const avgCost = parseFloat(document.getElementById('newPositionCost').value);
        
        if (!ticker || !shares || !avgCost) {
          Toast.show('Invalid Input', 'Please fill all fields', 'error');
          return;
        }
        
        const company = AppState.companies.find(c => c.ticker === ticker);
        if (!company) {
          Toast.show('Company Not Found', `${ticker} not found in database`, 'error');
          return;
        }
        
        AppState.portfolioHoldings.push({
          ticker: ticker,
          shares: shares,
          avgCost: avgCost,
          currentPrice: company.price,
          totalValue: shares * company.price
        });
        
        PortfolioView.init();
        Toast.show('Position Added', `${ticker} added to portfolio`, 'success');
      }
    );
  }
};

// ============================================================================
// SETTINGS VIEW
// ============================================================================
const SettingsView = {
  init: () => {
    SettingsView.setupThemeToggle();
    SettingsView.setupOtherSettings();
  },
  
  setupThemeToggle: () => {
    const themeToggle = document.getElementById('themeToggleInput');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    themeToggle.checked = currentTheme === 'dark';
    
    themeToggle.addEventListener('change', (e) => {
      SettingsView.toggleTheme(e.target.checked ? 'dark' : 'light');
    });
  },
  
  toggleTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    AppState.theme = theme;
    Toast.show('Theme Changed', `Switched to ${theme} mode`, 'info');
  },
  
  setupOtherSettings: () => {
    document.getElementById('btnExportUserData').addEventListener('click', () => {
      const data = JSON.stringify(AppState, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'incro4-data.json';
      a.click();
      Toast.show('Export Complete', 'User data exported successfully', 'success');
    });
  }
};

// ============================================================================
// RIBBON BUTTON HANDLERS
// ============================================================================
const RibbonHandlers = {
  init: () => {
    // Deal Search commands
    document.getElementById('btnSearchDeals')?.addEventListener('click', () => {
      DealSearchView.applyFilters();
    });
    
    document.getElementById('btnApplyFilters')?.addEventListener('click', () => {
      DealSearchView.applyFilters();
    });
    
    document.getElementById('btnClearFilters')?.addEventListener('click', () => {
      DealSearchView.clearFilters();
    });
    
    document.getElementById('btnToggleView')?.addEventListener('click', () => {
      Toast.show('View Toggle', 'Grid/List view toggle coming soon', 'info');
    });
    
    // Analysis commands
    document.getElementById('btnSearch')?.addEventListener('click', () => {
      document.getElementById('companySearch').focus();
    });
    
    document.getElementById('btnMetrics')?.addEventListener('click', () => {
      Toast.show('Metrics', 'Displaying financial metrics', 'info');
    });
    
    document.getElementById('btnCharts')?.addEventListener('click', () => {
      Toast.show('Charts', 'Displaying chart visualization', 'info');
    });
    
    document.getElementById('btnCompare')?.addEventListener('click', () => {
      Toast.show('Compare', 'Peer comparison feature coming soon', 'info');
    });
    
    // Data commands
    document.getElementById('btnUpload')?.addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    
    document.getElementById('btnExtract')?.addEventListener('click', () => {
      Toast.show('Extract', 'Data extraction in progress...', 'info');
    });
    
    document.getElementById('btnExport')?.addEventListener('click', () => {
      DataView.exportData();
    });
    
    // Reports commands
    document.getElementById('btnGenerateReport')?.addEventListener('click', () => {
      Toast.show('Generate Report', 'Opening report generator', 'info');
    });
    
    document.getElementById('btnTemplates')?.addEventListener('click', () => {
      Toast.show('Templates', 'Viewing report templates', 'info');
    });
    
    document.getElementById('btnDownload')?.addEventListener('click', () => {
      ReportsView.downloadReport();
    });
    
    // Portfolio commands
    document.getElementById('btnAddPosition')?.addEventListener('click', () => {
      PortfolioView.addPosition();
    });
    
    document.getElementById('btnRemovePosition')?.addEventListener('click', () => {
      Toast.show('Remove Position', 'Select a position to remove', 'info');
    });
    
    document.getElementById('btnPerformance')?.addEventListener('click', () => {
      Toast.show('Performance', 'Viewing portfolio performance', 'info');
    });
    
    document.getElementById('btnAlerts')?.addEventListener('click', () => {
      Toast.show('Alerts', 'Alert configuration coming soon', 'info');
    });
    
    // Settings commands
    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const themeToggle = document.getElementById('themeToggleInput');
      themeToggle.checked = !themeToggle.checked;
      SettingsView.toggleTheme(themeToggle.checked ? 'dark' : 'light');
    });
    
    document.getElementById('btnRefresh')?.addEventListener('click', () => {
      Toast.show('Refreshing', 'Updating market data...', 'info');
      setTimeout(() => {
        Toast.show('Refresh Complete', 'Data updated successfully', 'success');
      }, 1500);
    });
    
    document.getElementById('btnAccount')?.addEventListener('click', () => {
      Toast.show('Account', 'Profile settings coming soon', 'info');
    });
    
    // Additional button handlers
    document.getElementById('btnAddPositionAction')?.addEventListener('click', () => {
      PortfolioView.addPosition();
    });
    
    document.getElementById('btnSortMetrics')?.addEventListener('click', () => {
      Toast.show('Sort', 'Sorting metrics by value', 'info');
    });
  }
};

// ============================================================================
// MODAL HANDLERS
// ============================================================================
const ModalHandlers = {
  init: () => {
    document.getElementById('modalClose').addEventListener('click', () => {
      Modal.hide();
    });
    
    document.getElementById('modalCancel').addEventListener('click', () => {
      Modal.hide();
    });
    
    document.getElementById('modalOverlay').addEventListener('click', () => {
      Modal.hide();
    });
  }
};

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize authentication first
  AuthManager.init();
  
  // Initialize components (only if authenticated)
  if (AuthState.isAuthenticated) {
    RibbonNav.init();
  } else {
    // Just init ribbon for when user logs in
    RibbonNav.init();
  }
  RibbonHandlers.init();
  ModalHandlers.init();
  
  // Load initial view
  Dashboard.switchView('viewAnalysis');
  
  // Welcome message handled by auth flow
  
  console.log('Incro4 FinTech Platform initialized successfully');
});
