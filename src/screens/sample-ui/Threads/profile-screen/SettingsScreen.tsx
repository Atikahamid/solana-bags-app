import React, {useRef, useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icons from '@/assets/svgs';
import COLORS from '@/assets/colors';
import {useAuth} from '@/modules/wallet-providers';
import {useCustomization} from '@/shared/config/CustomizationProvider';
import {SERVER_URL} from '@env';
import {PINATA_API_KEY} from '@env';
import {PINATA_SECRET} from '@env';
import {usePrivy} from '@privy-io/expo';
import {IPFSAwareImage} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
const DELETE_USER = '/api/userRoutess/deleteAccount';
const UPDATE_USER = '/api/userRoutess/updateProfile';


export default function SettingsScreen() {
  const navigation = useNavigation();
  const {logout} = useAuth(); // assuming `user` has privyId, username, profile_image_url
  const {user} = usePrivy();
  const {auth: authConfig} = useCustomization();
  const selectedProvider = authConfig.provider;
  const route = useRoute();
  const {profile} = route.params || {};

  // console.log('user: ', user);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [showEditModal, setShowEditModal] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [profileImage, setProfileImage] = useState(
    profile?.profile_image_url || '',
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoBack = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  }, [navigation]);

  // 📸 Pick a new profile image
  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadImageToPinata = async (uri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const res = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET,
          },
          body: formData,
        },
      );

      const data = await res.json();
      if (res.ok && data.IpfsHash) {
        // Return full IPFS gateway link
        return `https://ipfs.io/ipfs/${data.IpfsHash}`;
      } else {
        console.error('Pinata upload failed:', data);
        Alert.alert('Upload failed', 'Could not upload image to IPFS.');
        return '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Error', 'Something went wrong while uploading.');
      return '';
    }
  };

  // ✏️ Handle profile update
  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username cannot be empty');
      return;
    }

    try {
      setUploading(true);
      let imageUrl = profileImage;

      // Upload to Pinata if it's a local file
      if (profileImage && profileImage.startsWith('file://')) {
        imageUrl = await uploadImageToPinata(profileImage);
      }

      const response = await fetch(`${SERVER_URL}${UPDATE_USER}/${user?.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, profile_image_url: imageUrl}),
      });

      const data = await response.json();
      console.log('update profile resposne: ', data);

      if (response.ok && data.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setProfileImage(imageUrl);
        setShowEditModal(false);
        navigation.goBack();
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong while updating profile.');
    } finally {
      setUploading(false);
    }
  };
  const handleExportWallet = async() => {
    navigation.navigate('ExportWalletScreen' as never);
  }

  // 🗑️ Delete account handler
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently remove your data. Your wallet remains with Privy. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                `${SERVER_URL}${DELETE_USER}/${user?.id}`,
                {
                  method: 'DELETE',
                },
              );
              const data = await res.json();
              if (res.ok && data.success) {
                Alert.alert(
                  'Account Deleted',
                  'Your account has been removed.',
                );
                await logout();
                navigation.reset({
                  index: 0,
                  routes: [{name: 'IntroScreen'}],
                });
              } else {
                Alert.alert(
                  'Error',
                  data.message || 'Failed to delete account.',
                );
              }
            } catch (err) {
              console.error('Delete Error:', err);
              Alert.alert('Error', 'Failed to delete account.');
            }
          },
        },
      ],
    );
  }, [logout]);

  const handleOptionPress = (label: string) => {
    switch (label) {
      case 'Edit Profile':
        setShowEditModal(true);
        break;
      case 'Logout':
        Alert.alert('Logout', 'Are you sure you want to logout?', [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Logout', style: 'destructive', onPress: logout},
        ]);
        break;
      case 'Delete Account':
        handleDeleteAccount();
        break;
      case 'Export Private Key':
        handleExportWallet();
        break;
      default:
        Alert.alert(label, 'Option pressed.');
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.overlay, {opacity: backdropOpacity}]} />
      <Animated.View
        style={[
          styles.animatedWrapper,
          {transform: [{translateX: slideAnim}]},
        ]}>
        <LinearGradient
          colors={COLORS.backgroundGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Icons.ArrowLeft width={22} height={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {settingsOptions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionRow}
                onPress={() => handleOptionPress(item.label)}>
                <View style={styles.iconWrapper}>{item.icon}</View>
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* 🧩 Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TouchableOpacity onPress={pickProfileImage}>
              {profileImage ? (
                // 🧠 If user picked new image (file://) → show directly
                profileImage.startsWith('file://') ? (
                  <Image source={{uri: profileImage}} style={styles.avatar} />
                ) : (
                  // 🧠 Otherwise show from IPFS or remote URL
                  <IPFSAwareImage
                    source={profileImage}
                    style={styles.avatar}
                    defaultSource={DEFAULT_IMAGES.user}
                    key={
                      Platform.OS === 'android'
                        ? `profile-${Date.now()}`
                        : 'profile'
                    }
                  />
                )
              ) : (
                // 🧩 Fallback placeholder if no image
                <View style={styles.avatarPlaceholder}>
                  <Icons.EditIcon width={10} height={10} />
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#888"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const settingsOptions = [
  {
    label: 'Swap Settings',
    icon: <Icons.Swapsettingsicon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Export Private Key',
    icon: <Icons.ExportWalleticon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Edit Profile',
    icon: <Icons.ProfileSettingssIcon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Two-Factor Authentication',
    icon: <Icons.ShieldIcon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Transaction History',
    icon: <Icons.Historyicon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Report Bugs & Errors',
    icon: <Icons.FlagIcon width={20} height={20} color="#fff" />,
  },
  {
    label: 'I need help',
    icon: <Icons.HelpIcon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Logout',
    icon: <Icons.LogoutIcon width={20} height={20} color="#fff" />,
  },
  {
    label: 'Delete Account',
    icon: <Icons.DeleteIcon width={20} height={20} color="#fff" />,
  },
];

const styles = StyleSheet.create({
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#000'},
  animatedWrapper: {position: 'absolute', top: 0, bottom: 0, right: 0, left: 0},
  container: {flex: 1, paddingTop: 50, paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'center', marginBottom: 30},
  backButton: {marginRight: 16},
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '700'},
  scroll: {paddingBottom: 50},
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#082e58',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  iconWrapper: {marginRight: 16, backgroundColor: '#a3a0a0ff', padding: 3, borderRadius: 19},
  optionText: {color: '#fff', fontSize: 15, fontWeight: '500'},

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#0b2649',
    padding: 20,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  avatar: {width: 80, height: 80, borderRadius: 40, marginBottom: 16},
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#164780',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#082e58',
    color: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#164780',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  saveText: {color: '#fff', fontWeight: 'bold'},
  cancelButton: {marginTop: 10},
  cancelText: {color: '#aaa'},
});
