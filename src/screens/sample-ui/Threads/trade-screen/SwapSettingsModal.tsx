// filepath: src/components/SwapSettingsModal.tsx

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Keyboard,
} from 'react-native';
import Animated, {SlideInUp, SlideOutDown} from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';
import COLORS from '@/assets/colors';
import Icons from '@/assets/svgs';

interface SwapSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  setSlippage: (value: number) => void; // ✅ use hook's setSlippage instead of onSlippageChange
}

const SwapSettingsModal: React.FC<SwapSettingsModalProps> = ({
  visible,
  onClose,
  setSlippage,
}) => {
  const [slippageOption, setSlippageOption] = useState<
    'auto' | '3%' | '5%' | 'custom'
  >('auto');
  const [customValue, setCustomValueInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectOption = (label: string) => {
    const value = label.toLowerCase();
    setSlippageOption(value as any);

    if (value === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  };

  const getNumericValue = (): number => {
    if (slippageOption === '3%') return 3;
    if (slippageOption === '5%') return 5;
    if (slippageOption === 'auto') return 10; // default fallback
    if (slippageOption === 'custom') {
      const num = parseFloat(customValue);
      return !isNaN(num) && num > 0 ? num : 10;
    }
    return 10;
  };

  const handleSetButton = () => {
    const finalValue = getNumericValue();
    setSlippage(finalValue); // ✅ directly call hook's setSlippage
    Keyboard.dismiss();
    onClose(); // close modal
  };

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(300)}
        style={styles.modalContainer}>
        <SafeAreaView style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Icons.ArrowLeft width={21} height={21} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Swap Settings</Text>
            <Text></Text>
          </View>

          {/* Slippage Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Slippage</Text>

            <View style={styles.row}>
              {['3%', '5%', 'Custom'].map(label => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.slippageButton,
                    slippageOption === label.toLowerCase() &&
                      styles.activeButton,
                  ]}
                  onPress={() => handleSelectOption(label)}>
                  <Text
                    style={[
                      styles.slippageText,
                      slippageOption === label.toLowerCase() &&
                        styles.activeText,
                    ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Auto Option */}
            <TouchableOpacity
              style={[
                styles.slippageButton,
                slippageOption === 'auto' && styles.activeButton,
                {marginTop: 10},
              ]}
              onPress={() => handleSelectOption('auto')}>
              <Text
                style={[
                  styles.slippageText,
                  slippageOption === 'auto' && styles.activeText,
                ]}>
                Auto
              </Text>
            </TouchableOpacity>

            {/* Custom Input */}
            {showCustomInput && (
              <View style={{marginTop: 15}}>
                <TextInput
                  placeholder="Enter custom slippage (%)"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={customValue}
                  onChangeText={setCustomValueInput}
                  style={styles.customInput}
                />
              </View>
            )}

            {/* ✅ Set Button */}
          </View>
        </SafeAreaView>
        <TouchableOpacity
          style={styles.setButtonFixed}
          onPress={handleSetButton}>
          <Text style={styles.setButtonText}>Set</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark || '#032448ff',
    justifyContent: 'flex-end',
  },
  inner: {
    flex: 1,
    backgroundColor: '#032448ff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  section: {marginVertical: 18},
  sectionTitle: {color: '#fff', fontSize: 18, marginBottom: 15},
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'space-evenly',
  },
  slippageButton: {
    borderWidth: 1,
    borderColor: '#545455ff',
    borderRadius: 16,
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  activeButton: {borderColor: '#00ff6a', backgroundColor: '#00ff6a1a'},
  slippageText: {color: '#fff', fontSize: 16},
  activeText: {color: '#00ff6a', fontWeight: '600'},
  customInput: {
    borderWidth: 1,
    borderColor: '#00ff6a',
    borderRadius: 10,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#1a1a1a',
  },
  setButtonFixed: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#0d498aff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  setButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SwapSettingsModal;
