import { StyleSheet } from 'react-native';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';

// Renamed function, now accepts theme directly and returns only base styles
export function getThreadItemBaseStyles(
  // Remove theme parameter
) {
  return StyleSheet.create({
    threadItemContainer: {
      flexDirection: 'row',
      padding: 12,
      margin: 4,
      marginRight:4,
      marginLeft:4,
      marginVertical: 8,
      backgroundColor: '#0A0F1C', // dark background
      borderWidth: 1,
      borderColor: '#00E6FF',    // neon cyan border
      borderRadius: 16,
      shadowColor: '#00E6FF',    // glow effect
      shadowOpacity: 0.8,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 10,
    },
    avatarColumn: {
      width: 40,
      alignItems: 'flex-start',
      marginRight: 3,
      paddingTop: 2, // Slight adjustment to align with text baseline
    },
    contentColumn: {
      flex: 1,
      minWidth: 0, // Prevents text overflow issues
    },
    threadItemReplyLine: {
      borderLeftWidth: 1,
      borderLeftColor: COLORS.borderDarkColor,
      marginLeft: 2,
      paddingLeft: 2,
    },
    threadItemAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    replyingContainer: {
      backgroundColor: COLORS.lighterBackground,
      padding: 1,
      marginVertical: 1,
      borderRadius: 6,
    },
    replyingText: {
      fontSize: 13,
      color: COLORS.greyMid,
      fontFamily: TYPOGRAPHY.fontFamily,
    },
    replyingHandle: {
      color: COLORS.brandBlue,
      fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
      fontFamily: TYPOGRAPHY.fontFamily,
    },
  });
}

// Styles previously defined inline in ThreadItem.tsx (remain unchanged)
export const retweetStyles = StyleSheet.create({
  retweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 0,
    paddingTop: 0,
  },
  retweetHeaderText: {
    fontSize: 13,
    color: COLORS.greyMid,
    marginLeft: 6,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  retweetedContent: {
    marginTop: 4,
    width: '100%',
  },
  originalPostContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.lighterBackground,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
    marginTop: 8,
  },
  quoteContent: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    color: COLORS.white,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
}); 