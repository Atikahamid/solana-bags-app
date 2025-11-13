import { StyleSheet } from 'react-native';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';
import { LinearGradient } from 'expo-linear-gradient';

// Renamed function to reflect it only provides base styles
export function getThreadBaseStyles() {
  return StyleSheet.create({
    // Root styles
    threadRootContainer: {
      backgroundColor: COLORS.background,
      flex: 1,
    },
    fixedSearch: {
      position: "absolute",
      bottom: 63,
      left: 0,
      right: 0,
    },
    // Header styles
    header: {
      width: '100%',
      backgroundColor: COLORS.background,
      alignItems: 'center',
    },

    // Thread list container
    threadListContainer: {
      paddingBottom: 100, // Space for composer at bottom
    },
    // -------------------------------------------

    // card: {
    //   backgroundColor: '#111',
    //   marginHorizontal: 12,
    //   marginVertical: 8,
    //   padding: 12,
    //   borderRadius: 12,
    // },
    // topRow: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    //   justifyContent: 'space-between',
    // },
    // wallet: { color: '#fff', fontWeight: 'bold' },
    // tag: {
    //   paddingHorizontal: 8,
    //   paddingVertical: 4,
    //   borderRadius: 6,
    // },
    // buyTag: { backgroundColor: 'green' },
    // sellTag: { backgroundColor: 'red' },
    // tagText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    // time: { color: '#aaa', fontSize: 12 },


    // middleRow: {
    //   flexDirection: 'row',
    //   justifyContent: 'space-between',
    //   alignItems: 'center',
    //   marginTop: 8,
    // },
    // tokenInfo: { flexDirection: 'row', alignItems: 'center' },
    // tokenIcon: {
    //   width: 32,
    //   height: 32,
    //   borderRadius: 16,
    //   backgroundColor: '#444',
    //   marginRight: 8,
    // },
    // token: { color: '#fff', fontWeight: 'bold' },
    // description: { color: '#aaa', fontSize: 12 },
    // pnlBox: { alignItems: 'flex-end' },
    // pnl: { color: '#f55', fontWeight: 'bold' },
    // pnlPercent: { color: '#f5f', fontSize: 12 },


    // bottomRow: {
    //   marginTop: 8,
    // },
    // marketCap: { color: '#fff', fontWeight: '600' },
    // sol: { color: '#aaa', fontSize: 12 },

    // --------------------------------------------------------
    card: {
      backgroundColor: '#1A1F25',
      marginHorizontal: 12,
      marginVertical: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 15,
      borderColor: '#3f433bf8',
      borderWidth: 0.75,
      gap: 4, // Space between top row and middle row
      boxShadow: '0 4px 6px 3px #e0d4d4ad',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      // justifyContent: 'space-between',
      gap: 8, // Space between user icon and details
    },
    userIcon: {
      width: 36,
      height: 36,
      borderRadius: 50,
      marginRight: 6,
    },
    userDetails: {
      // display: 'flex',
      // flex: 1,
      flexDirection: 'column',
      gap: 4, // Space between wallet and tag
      // borderWidth: 1,
      // justifyContent: 'space-between',
    },
    walletAndTagOuter: {
      // display: 'flex',
      // flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // alignItems: 'center',

    },
    walletAndTag: {
      // display: 'flex',
      // flex: 1,
      flexDirection: 'row',
      // justifyContent: 'space-between',
      alignItems: 'center',
      // alignItems: 'center',
    },
    wallet: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginLeft: 8,
      borderRadius: 6,
    },
    buyTag: { backgroundColor: '#38c71eff', },
    sellTag: { backgroundColor: '#e15c5cff' },
    tagText: { color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    time: { color: '#fffafaff', fontSize: 12, paddingBottom: 4, marginBottom: 20, paddingRight: 7 },


    middleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // marginTop: 8,
      // borderWidth: 0.5,
      // borderColor: '#717d66f8',
      // borderRadius: 12,
      marginHorizontal: 1,
      marginVertical: 1,
      padding: 8,
    },
    upperMiddleRow: {
      flexDirection: 'column',
      borderWidth: 0.5,
      borderColor: '#3f433bf8',
      borderRadius: 15,
    },
    button: {
      marginVertical: 8,
      marginHorizontal: 12,
    },

    tokenInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tokenIcon: {
      width: 36,
      height: 36,
      borderRadius: 50,
      marginRight: 8,
    },
    token: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    description: { color: '#fff', fontSize: 14, width: 100, overflow: 'hidden' },
    pnlBox: { alignItems: 'flex-end', flexDirection: 'row' },
    pnl: { color: '#fc7979ff', fontWeight: 'bold' },
    pnlPercent: { color: '#fc7979ff', fontSize: 13 },
    arrowPnl: {paddingTop: 5, paddingBottom: 0, marginBottom: 0},
    pnlBoxOuter: {
      flexDirection: 'column',
      gap: 4, // Space between pnl and marketCap
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#374151',
      borderWidth: 0.5,
      borderColor: '#3f433bf8',
      borderRadius: 15,
      padding: 8,
      gap: 4, // Space between left SVG and title
    },
    text: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },

    // bottomRow: {
    //   marginTop: 8,
    // },
    marketCap: { color: '#fff', fontWeight: '600', alignSelf: 'flex-end' },
    sol: { color: '#fff', fontSize: 14 },
  });
  // Merging logic removed, will be handled by the utility function
}

// Header styles
export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
    // backgroundColor: COLORS.greyDark,
  },
  profileContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    // backgroundColor: COLORS.greyDark,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: COLORS.greyDark,
  },
  absoluteLogoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingHorizontal: 4,
  },
});

// Tab styles
export const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    width: '100%',
    borderBottomWidth: 0,
    backgroundColor: COLORS.background,
    position: 'relative',
    overflow: 'scroll'
  },
  tab: {
    // flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.medium),
    color: COLORS.greyMid,
    letterSpacing: TYPOGRAPHY.letterSpacing,
  },
  activeTabText: {
    color: COLORS.brandBlue,
    fontWeight: TYPOGRAPHY.fontWeightToString(TYPOGRAPHY.semiBold),
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '80%',
    backgroundColor: COLORS.brandBlue,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    alignSelf: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    zIndex: -2,
  },
}); 