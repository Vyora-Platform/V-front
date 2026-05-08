/**
 * localStorage Monitor - Debug Tool
 * 
 * This monitors ALL changes to localStorage and logs them with stack traces
 * to help identify what's removing vendorId, userId, and userRole
 * 
 * USAGE: Import and call `monitorLocalStorage()` in your App.tsx
 */

export function monitorLocalStorage() {
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;

  // Monitor setItem
  localStorage.setItem = function(key: string, value: string) {
    console.log(`📝 [localStorage] SET "${key}" =`, value.substring(0, 50));
    console.trace(); // Show stack trace
    return originalSetItem.apply(this, [key, value]);
  };

  // Monitor removeItem
  localStorage.removeItem = function(key: string) {
    console.warn(`🗑️ [localStorage] REMOVE "${key}"`);
    console.trace(); // Show stack trace
    return originalRemoveItem.apply(this, [key]);
  };

  // Monitor clear
  localStorage.clear = function() {
    console.error(`💥 [localStorage] CLEAR ALL`);
    console.trace(); // Show stack trace
    return originalClear.apply(this);
  };

  console.log('👁️ [localStorage] Monitoring enabled - all changes will be logged with stack traces');
}

/**
 * Specific monitor for auth-related keys
 */
export function monitorAuthKeys() {
  const authKeys = ['token', 'user', 'userId', 'vendorId', 'userRole'];
  
  // Check every 100ms if auth keys are present
  setInterval(() => {
    const missing: string[] = [];
    authKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        missing.push(key);
      }
    });

    if (missing.length > 0) {
      console.error(`❌ [AUTH MONITOR] Missing keys:`, missing);
    }
  }, 100);

  console.log('👁️ [AUTH MONITOR] Monitoring auth keys:', authKeys);
}

/**
 * Create a protected localStorage that prevents removal of auth keys
 * except during explicit logout
 */
export function protectAuthKeys() {
  const originalRemoveItem = localStorage.removeItem;
  const authKeys = ['userId', 'vendorId', 'userRole'];
  let allowRemoval = false;

  // Create a function to temporarily allow removal
  (window as any).__allowAuthRemoval = () => {
    allowRemoval = true;
    setTimeout(() => {
      allowRemoval = false;
    }, 100);
  };

  localStorage.removeItem = function(key: string) {
    if (authKeys.includes(key) && !allowRemoval) {
      console.warn(`🛡️ [localStorage] BLOCKED removal of "${key}" - not during logout`);
      console.trace();
      return;
    }
    return originalRemoveItem.apply(this, [key]);
  };

  console.log('🛡️ [localStorage] Auth keys protected:', authKeys);
  console.log('🛡️ To allow removal during logout, call: window.__allowAuthRemoval()');
}

