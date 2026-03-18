// path: src/screens/LoadingScreen.js
import COLORS from '@/assets/colors';
import {LinearGradient} from 'expo-linear-gradient';
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const LoadingScreen = () => {
  // ✅ useRef ensures the value persists across re-renders
  const spinValue = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   const spinAnimation = Animated.loop(
  //     Animated.timing(spinValue, {
  //       toValue: 1,
  //       duration: 1000, // speed of rotation
  //       easing: Easing.linear,
  //       useNativeDriver: true,
  //     }),
  //   );
  //   spinAnimation.start();

  //   return () => spinAnimation.stop(); // cleanup
  // }, [spinValue]);

  // const spin = spinValue.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0deg', '360deg'],
  // });

  return (
    <LinearGradient
      colors={COLORS.backgroundSemiGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.constainerOne}>
        <ActivityIndicator size="small" color={COLORS.brandPrimary} />
        <Text style={styles.text}>Setting up your wallet...</Text>
      </View>
    </LinearGradient>
  ); 
};

const styles = StyleSheet.create({
  constainerOne: {
    // flex: 1,
    // width: '100%'
  },
  container: {
    position: 'absolute', // make it overlay
    top: -360,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // ensure it's above everything
    backgroundColor: '#0A0A0A', // fully opaque to hide background
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 2,
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },
  spinner: {
    width: 60,
    height: 60,
    borderWidth: 6,
    borderColor: '#FFFFFF30',
    borderTopColor: '#00E0FF',
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default LoadingScreen;
