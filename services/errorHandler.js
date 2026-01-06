// services/errorHandler.js
import { Alert } from 'react-native';

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  log(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      context,
    };

    console.error('Error logged:', errorEntry);
    
    // Store error (in production, send to analytics)
    this.errors.push(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Return sanitized error for UI
    return this.sanitizeError(error);
  }

  sanitizeError(error) {
    if (error instanceof Error) {
      // Hide sensitive information in production
      if (__DEV__) {
        return {
          message: error.message,
          stack: error.stack,
          type: error.name,
        };
      } else {
        return {
          message: 'An unexpected error occurred',
          type: 'UnknownError',
        };
      }
    }
    return {
      message: String(error),
      type: 'UnknownError',
    };
  }

  showAlert(error, title = 'Error') {
    const sanitized = this.sanitizeError(error);
    
    Alert.alert(
      title,
      sanitized.message,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  }

  handleApiError(error, operation = 'API operation') {
    const context = { operation };
    
    // Supabase errors
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique violation
          return this.log(new Error('This item already exists'), context);
        case '42501': // Insufficient privilege
          return this.log(new Error('You do not have permission to perform this action'), context);
        case 'PGRST116': // No rows returned
          return this.log(new Error('Item not found'), context);
        default:
          return this.log(error, context);
      }
    }

    // Network errors
    if (error.message?.includes('Network request failed')) {
      return this.log(new Error('Network error. Please check your connection'), context);
    }

    // Authentication errors
    if (error.message?.includes('JWT')) {
      return this.log(new Error('Session expired. Please sign in again'), context);
    }

    return this.log(error, context);
  }

  clear() {
    this.errors = [];
  }

  getErrors() {
    return [...this.errors];
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;