export const CONFIG = {
    APP: {
        NAME: 'NebulaNet',
        VERSION: '1.0.0',
        DOMAIN: 'nebulanet.space',
    },
    API: {
        TIMEOUT: 10000, // in milliseconds
        RETRY_ATTEMPTS: 3,
    },
    FEATURES: {
        AI_ENHANCEMENT: true,
        REAL_TIME_UPDATES: true,
        ADMIN_PANEL: true,
        WAITLIST: true,
    },
} as const;