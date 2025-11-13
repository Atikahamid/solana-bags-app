// src/screens/AddCashScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '@/assets/colors';
import Icons from '@/assets/svgs';
import QRCodeModal from '@/modules/moonpay/components/QRCodeModal';
import { useWallet } from '@/modules/wallet-providers';
import { useNavigation } from '@react-navigation/native';

const AddCashScreen: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Apple Pay');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const { address } = useWallet();
  const navigation = useNavigation();

  const walletAddress = address;
  const paymentOptions = ['Apple Pay', 'Coinbase', 'Crypto Wallet'];

  const handleNumPress = (num: string) => {
    if (num === '⌫') setAmount(prev => prev.slice(0, -1));
    else if (num === '.' && amount.includes('.')) return;
    else setAmount(prev => prev + num);
  };

  const handlePreset = (val: number) => setAmount(val.toString());
  const handleQRPress = () => walletAddress && setQrModalVisible(true);

  const handlePaymentSelection = (option: string) => {
    setPaymentMethod(option);
    setShowModal(false);
    if (option === 'Crypto Wallet') handleQRPress();
  };

  const displayAmount = amount === '' ? '$0' : `$${amount}`;
  const numericAmount = parseFloat(amount) || 0;

  // ✅ Enable button based on payment method
  const isButtonEnabled =
    (paymentMethod === 'Coinbase' && numericAmount > 1) ||
    (paymentMethod === 'Apple Pay' && numericAmount > 20);

  // ✅ Conditional navigation
  const handleAddCash = () => {
    if (paymentMethod === 'Coinbase') {
      navigation.navigate('CoinbaseOnRampScreen' as never);
    } else if (paymentMethod === 'Apple Pay') {
      navigation.navigate('OnrampScreen' as never);
    } else {
      Alert.alert('Info', 'Other payment methods coming soon!');
    }
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <SafeAreaView>
        {/* Header */}
        <View style={[styles.header, { padding: 16, height: 70 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>💸 Add Cash</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{displayAmount}</Text>
          <Text style={styles.limitText}>Limit: $2000 per day</Text>
        </View>

        {/* Payment Selector */}
        <TouchableOpacity style={styles.selector} onPress={() => setShowModal(true)}>
          <Ionicons
            name={
              paymentMethod === 'Apple Pay'
                ? 'logo-apple'
                : paymentMethod === 'Coinbase'
                ? 'logo-bitcoin'
                : 'wallet-outline'
            }
            size={20}
            color="#fff"
          />
          <Text style={styles.selectorText}>{paymentMethod}</Text>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        {/* If Crypto Wallet selected, show QR */}
        {paymentMethod === 'Crypto Wallet' && (
          <TouchableOpacity
            onPress={handleQRPress}
            style={styles.qrIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            disabled={!walletAddress}>
            <Icons.QrCodeIcon width={22} height={22} color={COLORS.white} />
            <Text style={styles.qrText}>Show Wallet QR</Text>
          </TouchableOpacity>
        )}

        {/* Preset Buttons */}
        <View style={styles.presetRow}>
          {[50, 100, 250, 500].map(val => (
            <TouchableOpacity
              key={val}
              style={styles.presetButton}
              onPress={() => handlePreset(val)}>
              <Text style={styles.presetText}>${val}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Numpad */}
        <View style={styles.numPad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.numButton}
              onPress={() => handleNumPress(num)}>
              <Text style={styles.numText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Add Cash Button */}
        <LinearGradient
          colors={
            isButtonEnabled ? ['#05375fff', '#1c4372ff'] : ['#444', '#333']
          }
          style={[styles.addButton, { opacity: isButtonEnabled ? 1 : 0.5 }]}>
          <TouchableOpacity
            onPress={handleAddCash}
            disabled={!isButtonEnabled}
            activeOpacity={0.8}>
            <Text style={styles.addText}>Add Cash</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Payment Options Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}>
            <View style={styles.modalContent}>
              {paymentOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionRow}
                  onPress={() => handlePaymentSelection(option)}>
                  <Ionicons
                    name={
                      option === 'Apple Pay'
                        ? 'logo-apple'
                        : option === 'Coinbase'
                        ? 'logo-bitcoin'
                        : 'wallet-outline'
                    }
                    size={22}
                    color="#fff"
                  />
                  <Text style={styles.optionText}>{option}</Text>
                  {paymentMethod === option && (
                    <Ionicons name="checkmark" size={22} color="#0b84fe" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* QR Modal */}
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => setQrModalVisible(false)}
          walletAddress={walletAddress || ''}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AddCashScreen;

// (styles remain same as before)

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  amountContainer: { alignItems: 'center', marginVertical: 10 },
  amountText: { color: '#fff', fontSize: 48, fontWeight: '700' },
  limitText: { color: '#aaa', fontSize: 14, marginTop: 5 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#838486ff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 20,
  },
  selectorText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  qrIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  qrText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#363738ff',
    borderRadius: 25,
    marginHorizontal: 6,
    alignItems: 'center',
    paddingVertical: 10,
  },
  presetText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numButton: {
    width: '30%',
    margin: '1.5%',
    backgroundColor: '#05375fff',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 14,
  },
  numText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  addButton: {
    marginTop: 25,
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#05375fff',
    paddingVertical: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
});
