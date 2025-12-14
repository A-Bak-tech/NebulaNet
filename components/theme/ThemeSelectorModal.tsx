import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  X 
} from 'lucide-react-native';
import { useTheme, useThemeColors, useSetTheme, useThemeType } from '@/contexts/ThemeContext';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ 
  visible, 
  onClose 
}) => {
  const colors = useThemeColors();
  const setTheme = useSetTheme();
  const currentThemeType = useThemeType();

  const themeOptions = [
    {
      id: 'light',
      title: 'Light',
      description: 'Light background with dark text',
      icon: Sun,
      color: '#FFD60A',
    },
    {
      id: 'dark',
      title: 'Dark',
      description: 'Dark background with light text',
      icon: Moon,
      color: '#8E8E93',
    },
    {
      id: 'system',
      title: 'System',
      description: 'Follow your device theme',
      icon: Monitor,
      color: '#007AFF',
    },
  ];

  const handleThemeSelect = async (themeId: string) => {
    await setTheme(themeId as any);
    onClose();
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
      marginTop: Platform.OS === 'ios' ? 44 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.ui.separator,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      marginBottom: 32,
    },
    themeOptions: {
      gap: 12,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.background.secondary,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeOptionSelected: {
      borderColor: colors.ui.primary,
      backgroundColor: colors.background.tertiary,
    },
    themeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    themeContent: {
      flex: 1,
    },
    themeTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    themeDescription: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    checkContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.ui.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar 
        barStyle={colors.text.primary === '#FFFFFF' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background.primary}
      />
      
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Theme</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.icon.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = currentThemeType === option.id;
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.themeOption,
                    isSelected && styles.themeOptionSelected,
                  ]}
                  onPress={() => handleThemeSelect(option.id)}
                >
                  <View 
                    style={[
                      styles.themeIconContainer,
                      { backgroundColor: option.color + '20' }
                    ]}
                  >
                    <Icon size={24} color={option.color} />
                  </View>
                  
                  <View style={styles.themeContent}>
                    <Text style={styles.themeTitle}>{option.title}</Text>
                    <Text style={styles.themeDescription}>{option.description}</Text>
                  </View>
                  
                  {isSelected && (
                    <View style={styles.checkContainer}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ThemeSelectorModal;