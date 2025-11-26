# Application State Flow

## Authentication State Machine

```typescript
type AuthState = {
  // Core states
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User progression
  user: User | null;
  userProfile: UserProfile | null;
  
  // Flow control
  currentStage: 'waitlist' | 'pending' | 'onboarding' | 'main';
}

// State transitions:
const stateTransitions = {
  INITIAL: { 
    user: null, 
    profile: null, 
    stage: 'waitlist' 
  },
  WAITLIST_SUBMITTED: { 
    user: null, 
    profile: null, 
    stage: 'waitlist' 
  },
  REGISTERED: { 
    user: User, 
    profile: null, 
    stage: 'pending' 
  },
  APPROVED: { 
    user: User, 
    profile: UserProfile, 
    stage: 'onboarding' 
  },
  ONBOARDED: { 
    user: User, 
    profile: UserProfile, 
    stage: 'main' 
  }
};