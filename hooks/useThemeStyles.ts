import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColors, useThemeSpacing, useThemeTypography } from '@/contexts/ThemeContext';

export const useThemeStyles = () => {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();

  const styles = useMemo(() => {
    return StyleSheet.create({
      // Container styles
      container: {
        flex: 1,
        backgroundColor: colors.background.primary,
      },
      safeContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        paddingTop: spacing.md,
      },
      
      // Text styles
      textTitle: {
        fontSize: typography.fontSize.xxl,
        fontWeight: 'bold',
        color: colors.text.primary,
        fontFamily: typography.fontFamily.bold,
      },
      textSubtitle: {
        fontSize: typography.fontSize.lg,
        color: colors.text.secondary,
        fontFamily: typography.fontFamily.regular,
      },
      textBody: {
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
        fontFamily: typography.fontFamily.regular,
        lineHeight: 24,
      },
      textCaption: {
        fontSize: typography.fontSize.sm,
        color: colors.text.tertiary,
        fontFamily: typography.fontFamily.regular,
      },
      
      // Button styles
      buttonPrimary: {
        backgroundColor: colors.ui.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: spacing.md,
        alignItems: 'center',
      },
      buttonPrimaryText: {
        color: colors.text.inverse,
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        fontFamily: typography.fontFamily.semiBold,
      },
      
      buttonSecondary: {
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.ui.border,
      },
      buttonSecondaryText: {
        color: colors.text.primary,
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        fontFamily: typography.fontFamily.semiBold,
      },
      
      // Input styles
      inputContainer: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.md,
        borderWidth: 1,
        borderColor: colors.ui.border,
        paddingHorizontal: spacing.md,
      },
      input: {
        height: 48,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
        fontFamily: typography.fontFamily.regular,
      },
      
      // Card styles
      card: {
        backgroundColor: colors.background.secondary,
        borderRadius: spacing.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...colors.shadows.md,
      },
      
      // List item styles
      listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.separator,
      },
      
      // Spacing utilities
      pXs: { padding: spacing.xs },
      pSm: { padding: spacing.sm },
      pMd: { padding: spacing.md },
      pLg: { padding: spacing.lg },
      pXl: { padding: spacing.xl },
      
      pxXs: { paddingHorizontal: spacing.xs },
      pxSm: { paddingHorizontal: spacing.sm },
      pxMd: { paddingHorizontal: spacing.md },
      pxLg: { paddingHorizontal: spacing.lg },
      pxXl: { paddingHorizontal: spacing.xl },
      
      pyXs: { paddingVertical: spacing.xs },
      pySm: { paddingVertical: spacing.sm },
      pyMd: { paddingVertical: spacing.md },
      pyLg: { paddingVertical: spacing.lg },
      pyXl: { paddingVertical: spacing.xl },
      
      mXs: { margin: spacing.xs },
      mSm: { margin: spacing.sm },
      mMd: { margin: spacing.md },
      mLg: { margin: spacing.lg },
      mXl: { margin: spacing.xl },
      
      mxXs: { marginHorizontal: spacing.xs },
      mxSm: { marginHorizontal: spacing.sm },
      mxMd: { marginHorizontal: spacing.md },
      mxLg: { marginHorizontal: spacing.lg },
      mxXl: { marginHorizontal: spacing.xl },
      
      myXs: { marginVertical: spacing.xs },
      mySm: { marginVertical: spacing.sm },
      myMd: { marginVertical: spacing.md },
      myLg: { marginVertical: spacing.lg },
      myXl: { marginVertical: spacing.xl },
      
      // Flex utilities
      flexRow: { flexDirection: 'row' },
      flexCol: { flexDirection: 'column' },
      flex1: { flex: 1 },
      flexCenter: { justifyContent: 'center', alignItems: 'center' },
      flexRowCenter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center' 
      },
      flexRowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      
      // Alignment utilities
      itemsCenter: { alignItems: 'center' },
      itemsStart: { alignItems: 'flex-start' },
      itemsEnd: { alignItems: 'flex-end' },
      justifyCenter: { justifyContent: 'center' },
      justifyBetween: { justifyContent: 'space-between' },
      justifyAround: { justifyContent: 'space-around' },
      
      // Border radius utilities
      roundedSm: { borderRadius: spacing.sm },
      roundedMd: { borderRadius: spacing.md },
      roundedLg: { borderRadius: spacing.lg },
      roundedFull: { borderRadius: 9999 },
    });
  }, [colors, spacing, typography]);

  return styles;
};