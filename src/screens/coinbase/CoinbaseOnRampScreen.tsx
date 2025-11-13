// src/screens/OnrampScreen.tsx
import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, Button, StyleSheet, Alert} from 'react-native';
import {WebView} from 'react-native-webview';
import {getOnrampUrl} from './onRampServiceFile';

export default function CoinbaseOnrampScreen() {
  const [onrampUrl, setOnrampUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [webviewVisible, setWebviewVisible] = useState<boolean>(false);

  const loadOnramp = async () => {
    try {
      setLoading(true);
      const url = await getOnrampUrl();
      console.log('onrmpurl on screen: ', url);
      setOnrampUrl(url);
      setWebviewVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch Onramp URL');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    // handle redirect success URL
    if (navState.url.includes('solanabagsapp://MainTabs')) {
      setWebviewVisible(false);
      Alert.alert('Success', 'Coinbase payment completed!');
    }
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      {!loading && !webviewVisible && (
        <Button title="Buy with Coinbase" onPress={loadOnramp} />
      )}

      {webviewVisible && onrampUrl && (
        <WebView
          source={{uri: onrampUrl}}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          startInLoadingState
          onLoadStart={e => console.log('LOAD START:', e.nativeEvent.url)}
          onLoadProgress={e =>
            console.log('LOAD PROGRESS:', e.nativeEvent.progress)
          }
          onLoadEnd={e => console.log('LOAD END:', e.nativeEvent.url)}
          onNavigationStateChange={nav => console.log('NAV CHANGE:', nav.url)}
          onError={e => console.log('❌ onError:', e.nativeEvent)}
          onHttpError={e =>
            console.log(
              '❌ HTTP Error:',
              e.nativeEvent.statusCode,
              e.nativeEvent.description,
            )
          }
          onMessage={event =>
            console.log('📩 Message from WebView:', event.nativeEvent.data)
          }
          renderLoading={() => (
            <ActivityIndicator size="large" color="#007AFF" />
          )}
          style={{flex: 1, width: 400, height: '100%', borderWidth: 2, borderColor: '#1a1818ff', marginTop: 7, padding: 8}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
     borderWidth: 2, borderColor: '#1a1818ff'
  },
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
