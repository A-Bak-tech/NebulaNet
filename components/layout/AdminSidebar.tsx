import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  Dimensions,
  Modal
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Import your AuthContext
import { 
  X,
  Home,
  Settings,
  Shield,
  Users,
  BarChart3,
  FileText,
  Database,
  LogOut,
  Sparkles,
  Zap
} from 'lucide-react-native';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mobile?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isOpen, 
  onClose, 
  mobile = false 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();
  const { logout } = useAuth(); // Use logout from your AuthContext

  // Handle Android back button
  React.useEffect(() => {
    if (mobile && Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (isOpen) {
            onClose();
            return true;
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }
  }, [mobile, isOpen, onClose]);

  const adminSections = [
    {
      title: 'Main',
      items: [
        {
          id: 'dashboard',
          icon: Home,
          label: 'Dashboard',
          route: '/admin',
        },
        {
          id: 'nebula',
          icon: Sparkles,
          label: 'Nebula AI',
          route: '/admin/nebula-dashboard',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          id: 'users',
          icon: Users,
          label: 'User Management',
          route: '/admin/user-management',
        },
        {
          id: 'moderation',
          icon: Shield,
          label: 'Content Moderation',
          route: '/admin/moderation',
        },
        {
          id: 'waitlist',
          icon: FileText,
          label: 'Waitlist',
          route: '/admin/waitlist-management',
        },
        {
          id: 'models',
          icon: Database,
          label: 'AI Models',
          route: '/admin/nebula-models',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'insights',
          icon: BarChart3,
          label: 'Insights',
          route: '/admin/insights',
        },
        {
          id: 'performance',
          icon: Zap,
          label: 'Performance',
          route: '/admin/performance',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          route: '/(tabs)/settings',
        },
        {
          id: 'logout',
          icon: LogOut,
          label: 'Logout',
          color: colors.status.error,
          action: async () => {
            await logout(); // Use logout from your AuthContext
            router.replace('/(auth)/login');
          },
        },
      ],
    },
  ];

  const handleNavigation = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route);
    }
    
    if (mobile) {
      onClose();
    }
  };

  const isActive = (route: string) => {
    return pathname === route;
  };

  const styles = StyleSheet.create({
    // Mobile modal overlay
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: Dimensions.get('window').width * 0.85,
      height: '100%',
      backgroundColor: colors.background.primary,
    },
    
    // Sidebar container
    sidebarContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
      borderRightWidth: 1,
      borderRightColor: colors.ui.separator,
    },
    
    // Header
    header: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.ui.separator,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    adminBadge: {
      backgroundColor: colors.ui.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    adminBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.ui.primary,
    },
    closeButton: {
      padding: 4,
    },
    
    // Content
    content: {
      flex: 1,
    },
    section: {
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    menuItemActive: {
      backgroundColor: colors.background.tertiary,
      borderRightWidth: 3,
      borderRightColor: colors.ui.primary,
    },
    menuIcon: {
      width: 20,
      marginRight: 12,
    },
    menuLabel: {
      fontSize: 15,
      color: colors.text.primary,
      flex: 1,
    },
    menuLabelActive: {
      fontWeight: '600',
      color: colors.ui.primary,
    },
    
    // Footer
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.ui.separator,
    },
    versionText: {
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
  });

  // For mobile, render as modal
  if (mobile) {
    return (
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContent}>
            <AdminSidebarContent 
              styles={styles}
              adminSections={adminSections}
              isActive={isActive}
              handleNavigation={handleNavigation}
              colors={colors}
              mobile={mobile}
              onClose={onClose}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  // For web/desktop, render as sidebar
  return (
    <View style={[
      styles.sidebarContainer,
      { width: mobile ? '85%' : 280 }
    ]}>
      <AdminSidebarContent 
        styles={styles}
        adminSections={adminSections}
        isActive={isActive}
        handleNavigation={handleNavigation}
        colors={colors}
        mobile={mobile}
        onClose={onClose}
      />
    </View>
  );
};

// Content component to avoid duplication
interface AdminSidebarContentProps {
  styles: any;
  adminSections: any[];
  isActive: (route: string) => boolean;
  handleNavigation: (item: any) => void;
  colors: any;
  mobile: boolean;
  onClose: () => void;
}

const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({
  styles,
  adminSections,
  isActive,
  handleNavigation,
  colors,
  mobile,
  onClose,
}) => {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          </View>
          
          {mobile && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.icon.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {adminSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.route);
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    active && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigation(item)}
                >
                  <View style={styles.menuIcon}>
                    <Icon 
                      size={20} 
                      color={item.color || (active ? colors.ui.primary : colors.icon.secondary)} 
                    />
                  </View>
                  <Text style={[
                    styles.menuLabel,
                    active && styles.menuLabelActive,
                    item.color && { color: item.color }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.versionText}>NebulaNet Admin v1.0.0</Text>
      </View>
    </>
  );
};

export default AdminSidebar;