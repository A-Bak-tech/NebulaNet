import { User } from '@/types/database';

export type Permission = 
  | 'view_admin_panel'
  | 'manage_users'
  | 'moderate_content'
  | 'manage_waitlist'
  | 'view_analytics'
  | 'manage_ai_settings'
  | 'system_config';

export const adminPermissions = {
  can(user: User | null, permission: Permission): boolean {
    if (!user) return false;

    const rolePermissions: Record<string, Permission[]> = {
      admin: [
        'view_admin_panel',
        'manage_users',
        'moderate_content',
        'manage_waitlist',
        'view_analytics',
        'manage_ai_settings',
        'system_config',
      ],
      moderator: [
        'view_admin_panel',
        'moderate_content',
        'view_analytics',
      ],
      user: [],
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  },

  canAccessAdmin(user: User | null): boolean {
    return this.can(user, 'view_admin_panel');
  },

  canModerateContent(user: User | null): boolean {
    return this.can(user, 'moderate_content');
  },

  canManageUsers(user: User | null): boolean {
    return this.can(user, 'manage_users');
  },

  getRoleHierarchy(role: string): number {
    const hierarchy = {
      admin: 3,
      moderator: 2,
      user: 1,
    };
    return hierarchy[role as keyof typeof hierarchy] || 0;
  },

  canManageRole(manager: User | null, targetRole: string): boolean {
    if (!manager) return false;
    
    const managerLevel = this.getRoleHierarchy(manager.role);
    const targetLevel = this.getRoleHierarchy(targetRole);
    
    return managerLevel > targetLevel;
  },
};