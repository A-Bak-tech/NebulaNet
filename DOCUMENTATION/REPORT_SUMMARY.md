# NebulaNet Flow Architecture - Report Summary

## 🎯 Core User Journey
1. **Entry** → Waitlist (public users)
2. **Authentication** → Register with invite code
3. **Approval** → Admin moderation queue
4. **Onboarding** → Profile setup
5. **Main App** → Full social features

## 🔧 Technical Implementation
- **Framework**: Expo Router with file-based routing
- **State Management**: React Context + Hooks
- **Authentication**: Supabase Auth with custom claims
- **Flow Control**: Conditional routing in root layout

## 📁 Critical Files for Flow
- `app/_layout.tsx` - Flow decision engine
- `contexts/AuthContext.tsx` - Global state management
- `app/(auth)/` - Authentication screens
- `app/(tabs)/` - Main application

## 🚀 Flow Advantages
1. **Progressive Access** - Users gain features gradually
2. **Admin Control** - Manual approval for quality control
3. **Smooth Onboarding** - Guided profile setup
4. **Modular Architecture** - Each flow stage is isolated