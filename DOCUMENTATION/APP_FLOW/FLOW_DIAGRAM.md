# NebulaNet App Flow Architecture

## 🎯 Overall User Journey

```mermaid
graph TD
    A[App Entry] --> B{User Logged In?}
    B -->|No| C[Waitlist Landing]
    B -->|Yes| D{User Approved?}
    
    C --> E[Submit Waitlist]
    E --> F[Wait for Invite]
    F --> G[Register with Code]
    
    D -->|No| H[Pending Approval]
    D -->|Yes| I{Onboarding Complete?}
    
    I -->|No| J[Onboarding Flow]
    I -->|Yes| K[Main App Tabs]
    
    G --> K
    J --> K
    
    K --> L[Feed]
    K --> M[Search]
    K --> N[Create]
    K --> O[Notifications]
    K --> P[Profile]