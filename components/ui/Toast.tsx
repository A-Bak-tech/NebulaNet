import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react-native';
import { cn } from '@/utils/helpers';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const typeConfig = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: '#10b981',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: '#ef4444',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
      iconColor: '#f59e0b',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: AlertCircle,
      iconColor: '#0ea5e9',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <View className="absolute top-16 left-4 right-4 z-50">
      <View
        className={cn(
          'flex-row items-center p-4 rounded-lg border',
          config.bg,
          config.text
        )}
      >
        <Icon size={20} color={config.iconColor} />
        <Text className={cn('flex-1 ml-3 font-medium', config.text)}>
          {message}
        </Text>
        <TouchableOpacity onPress={onClose} className="p-1">
          <X size={16} color={config.iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};