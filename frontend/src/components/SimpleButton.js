import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SimpleButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 24 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.border : theme.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.border : theme.success,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.border : theme.danger,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return {
          ...baseTextStyle,
          color: disabled ? theme.textSecondary : '#ffffff',
        };
      case 'secondary':
      case 'ghost':
        return {
          ...baseTextStyle,
          color: disabled ? theme.textSecondary : theme.text,
        };
      default:
        return baseTextStyle;
    }
  };

  const styles = StyleSheet.create({
    button: getButtonStyle(),
    text: getTextStyle(),
    icon: {
      marginRight: title ? 8 : 0,
      fontSize: size === 'small' ? 16 : size === 'large' ? 20 : 18,
    },
    loadingText: {
      opacity: 0.7,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={styles.text.color} />
      ) : (
        <>
          {icon && <Text style={[styles.icon, { color: styles.text.color }]}>{icon}</Text>}
          <Text style={[styles.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default SimpleButton;