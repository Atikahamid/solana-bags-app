import React, { useState, useEffect } from 'react';
// import {Solfla}
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icons from '@/assets/svgs';
import { IPFSAwareImage } from '@/shared/utils/IPFSImage';

import * as ImagePicker from 'expo-image-picker';
// import * as VideoThumbnails from 'expo-video-thumbnails';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';
import {
  TokenType,
  FeeSchedulerMode,
  ActivationType,
  CollectFeeMode,
  MigrationOption,
  MigrationFeeOption,
  BuildCurveByMarketCapParams,
} from '../types';
import {
  buildCurveByMarketCap,
  createPool,
  createTokenWithCurve,
  uploadTokenMetadata,
} from '../services/meteoraService';
import BondingCurveVisualizer from './BondingCurveVisualizer';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@/modules/wallet-providers/hooks/useWallet';
import BN from 'bn.js';
import { HELIUS_STAKED_URL } from '@env';

interface TokenCreationFormProps {
  walletAddress: string;
  isPrivy: () => boolean;
  sendBase64Transaction: (
    base64Tx: string,
    connection: Connection,
    options?: {
      confirmTransaction?: boolean;
      statusCallback?: (status: string) => void;
    },
  ) => Promise<string>;
  onTokenCreated?: (tokenAddress: string, txId: string) => void;
}
type FeeEarner = {
  id: string;
  username: string;
  percentage: number;
};

export default function TokenCreationForm({
  walletAddress,
  isPrivy,
  sendBase64Transaction,
  onTokenCreated,
}: TokenCreationFormProps) {
  //   const {wallet} = useWallet();
  //   console.log('wallet from wallet address: ', walletAddress);
  // Basic token info
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('1000000000');
  const [tokenDecimals, setTokenDecimals] = useState('9');
  const [tokenWebsite, setTokenWebsite] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenTwitter, setTokenTwitter] = useState('');
  const [tokenTelegram, setTokenTelegram] = useState('');

  const [feeEarners, setFeeEarners] = useState<FeeEarner[]>([]);
  const [yourShare, setYourShare] = useState(100);
  const [addingEarner, setAddingEarner] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftPercentage, setDraftPercentage] = useState(0);
  const [splitEqually, setSplitEqually] = useState(false);

  useEffect(() => {
    const used = feeEarners.reduce((sum, e) => sum + e.percentage, 0);
    setYourShare(Math.max(0, 100 - used));
  }, [feeEarners]);

  // Market cap settings
  const [initialMarketCap, setInitialMarketCap] = useState('100');
  const [migrationMarketCap, setMigrationMarketCap] = useState('3000');

  // Token type
  const [isToken2022, setIsToken2022] = useState(false);

  // Buy on creation options
  const [buyOnCreate, setBuyOnCreate] = useState(false);
  const [buyAmount, setBuyAmount] = useState('1');

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [baseFeeBps, setBaseFeeBps] = useState('100'); // 1% fee
  const [dynamicFeeEnabled, setDynamicFeeEnabled] = useState(true);
  const [collectFeeBoth, setCollectFeeBoth] = useState(false);
  const [selectedMigrationFee, setSelectedMigrationFee] = useState(
    MigrationFeeOption.FixedBps25,
  );

  // LP distribution
  const [partnerLpPercentage, setPartnerLpPercentage] = useState('25');
  const [creatorLpPercentage, setCreatorLpPercentage] = useState('25');
  const [partnerLockedLpPercentage, setPartnerLockedLpPercentage] =
    useState('25');
  const [creatorLockedLpPercentage, setCreatorLockedLpPercentage] =
    useState('25');

  // Form state
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [configAddress, setConfigAddress] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Image and metadata handling
  const [tokenLogo, setTokenLogo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [metadataUri, setMetadataUri] = useState('');
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [feeSharing, setFeeSharing] = useState(false);

  // Video upload handling
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<any>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Get wallet and connection
  // const wallet = useWallet();
  // console.log("wallet publickey passing: ", wallet.publicKey?.toBase58())
  // Create a connection to the Solana network with better configuration

  //   const connection = new Connection(HELIUS_STAKED_URL, {
  //     commitment: 'confirmed',
  //     confirmTransactionInitialTimeout: 120000, // 2 minutes
  //     disableRetryOnRateLimit: false,
  //   });

  const connection = new Connection(clusterApiUrl('devnet'), {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 120000, // optional
  });

  // Add new state variables for parsed numeric values
  const [parsedInitialMarketCap, setParsedInitialMarketCap] = useState(100);
  const [parsedMigrationMarketCap, setParsedMigrationMarketCap] =
    useState(3000);
  const [parsedTokenSupply, setParsedTokenSupply] = useState(1000000000);

  // Update parsed values when inputs change
  useEffect(() => {
    const initCap = Number(initialMarketCap);
    if (!isNaN(initCap) && initCap > 0) {
      setParsedInitialMarketCap(initCap);
    }

    const migCap = Number(migrationMarketCap);
    if (!isNaN(migCap) && migCap > 0) {
      setParsedMigrationMarketCap(migCap);
    }

    const supply = Number(tokenSupply);
    if (!isNaN(supply) && supply > 0) {
      setParsedTokenSupply(supply);
    }
  }, [initialMarketCap, migrationMarketCap, tokenSupply]);
  useEffect(() => {
    const used = feeEarners.reduce((s, e) => s + e.percentage, 0);
    setYourShare(Math.max(0, 100 - used));
  }, [feeEarners]);

  const startAddEarner = () => {
    setDraftUsername('');
    setDraftPercentage(0);
    setAddingEarner(true);
  };

  const cancelAddEarner = () => {
    setAddingEarner(false);
  };

  const confirmAddEarner = () => {
    if (!draftUsername || draftPercentage <= 0) return;

    setFeeEarners(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        username: draftUsername,
        percentage: draftPercentage,
      },
    ]);

    setAddingEarner(false);
  };

  const removeEarner = (id: string) => {
    setFeeEarners(prev => prev.filter(e => e.id !== id));
  };

  const validateStep1 = () => {
    if (!tokenName.trim()) {
      setError('Token name is required');
      return false;
    }

    if (!tokenSymbol.trim()) {
      setError('Token symbol is required');
      return false;
    }

    if (!tokenDescription.trim()) {
      setError('Token description is required');
      return false;
    }

    if (!imageUri && !tokenLogo) {
      setError('Token image is required');
      return false;
    }

    const supplyNum = Number(tokenSupply);
    if (isNaN(supplyNum) || supplyNum <= 0) {
      setError('Token supply must be a positive number');
      return false;
    }

    const decimalsNum = Number(tokenDecimals);
    if (isNaN(decimalsNum) || decimalsNum < 6 || decimalsNum > 9) {
      setError('Token decimals must be between 6 and 9');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const initMarketCap = Number(initialMarketCap);
    if (isNaN(initMarketCap) || initMarketCap <= 0) {
      setError('Initial market cap must be a positive number');
      return false;
    }

    const migMarketCap = Number(migrationMarketCap);
    if (isNaN(migMarketCap) || migMarketCap <= initMarketCap) {
      setError('Migration market cap must be greater than initial market cap');
      return false;
    }

    const feeVal = Number(baseFeeBps);
    if (isNaN(feeVal) || feeVal < 0 || feeVal > 1000) {
      setError('Base fee must be between 0 and 1000 basis points (0-10%)');
      return false;
    }

    // Validate buy amount if buy on create is enabled
    if (buyOnCreate) {
      const buyAmountVal = Number(buyAmount);
      if (isNaN(buyAmountVal) || buyAmountVal <= 0) {
        setError('Buy amount must be a positive number');
        return false;
      }

      // Check if buy amount is reasonable (usually not more than 100 SOL)
      if (buyAmountVal > 100) {
        setError('Buy amount is unusually high. Please check the amount.');
        return false;
      }
    }

    // Check LP percentages add up to 100%
    const totalPercentage =
      Number(partnerLpPercentage) +
      Number(creatorLpPercentage) +
      Number(partnerLockedLpPercentage) +
      Number(creatorLockedLpPercentage);

    if (totalPercentage !== 100) {
      setError('LP percentages must add up to 100%');
      return false;
    }

    return true;
  };

  const handleCreateToken = async () => {
    if (!validateStep2()) {
      return;
    }
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    // if (balance === 0) {
    //   return Alert.alert('Error', 'Not enough sol');
    // }
    // setError('');
    // setIsCreating(true);

    try {
      // Step 1: Upload metadata first
      setStatusMessage('Uploading token metadata...');
      let uri = metadataUri;

      if (!uri) {
        uri = await uploadMetadata();
      }

      if (!uri) {
        throw new Error('Failed to get metadata URI');
      }

      // Step 2: Create token with curve
      setStatusMessage('Creating token with bonding curve...');

      // Log parameters for debugging
      console.log('Creating token with params:', {
        tokenName,
        tokenSymbol,
        buyAmount: buyOnCreate ? parseFloat(buyAmount) : undefined,
        metadataUri: uri,
        website: tokenWebsite,
        logo: imageUri || tokenLogo,
      });

      // Use the createTokenWithCurve function with only the required params
      //   const walletPubKey = wallet?.publicKey;
      //   console.log(
      //     'wallet publickey passed in create token with curve function: ',
      //     walletPubKey,
      //   );
      // const result = await createTokenWithCurve(
      //   {
      //     tokenName,
      //     tokenSymbol,
      //     buyAmount: buyOnCreate ? parseFloat(buyAmount) : undefined,
      //     metadataUri: uri,
      //     website: tokenWebsite,
      //     logo: imageUri || tokenLogo,
      //   },
      //   connection,
      //   walletAddress,
      //   isPrivy,
      //   sendBase64Transaction,
      //   setStatusMessage,
      // );

      console.log('Token created successfully:');

      // Step 3: Upload video if provided
      if (videoFile) {
        try {
          setStatusMessage('Uploading token video...');
          await uploadVideoToServer('2Ne1SAvtYbnDasFAN5ZjznXzZVuZ9CgBPjrenEQggL3K');
        } catch (videoError) {
          console.error('Video upload failed:', videoError);
          // Don't fail the entire process if video upload fails
          Alert.alert('Warning', 'Token created but video upload failed. You can upload the video later.');
        }
      }

      // if (onTokenCreated && result.baseMintAddress) {
      //   onTokenCreated(result.baseMintAddress, result.txId);
      // }
      setTokenName('');
      setTokenSymbol('');
      setBuyAmount('');
      setBuyOnCreate(false);
      setMetadataUri('');
      setTokenWebsite('');
      setTokenLogo('');
      setImageUri(null);
      setVideoUri(null);
      setVideoFile(null);
      setTokenDescription('');
      setTokenTwitter('');
      setTokenTelegram('');
      setStatusMessage('Token created successfully!');
    } catch (err) {
      console.error('Error creating token:', err);
      setError(
        `Failed to create token: ${err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Add a function to handle image picking
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageFile(result.assets[0]);
        // If using direct URL input before, clear it
        if (tokenLogo && tokenLogo !== result.assets[0].uri) {
          setTokenLogo('');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Function to remove selected image
  const removeImage = () => {
    setImageUri(null);
    setImageFile(null);
    setTokenLogo('');
  };

  // Function to use image from URL
  const setImageFromUrl = () => {
    if (
      tokenLogo &&
      (tokenLogo.startsWith('http://') ||
        tokenLogo.startsWith('https://') ||
        tokenLogo.startsWith('ipfs://'))
    ) {
      setImageUri(tokenLogo);
      setImageFile(null);
    } else {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid URL starting with http://, https://, or ipfs://',
      );
    }
  };

  // Add function to handle video picking
  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 60 * 1000) {
          Alert.alert('Video too long', 'Please select a video shorter than 60 seconds');
          return;
        }
        setVideoUri(asset.uri);
        setVideoFile(asset);
        // Generate thumbnail for the video
        // await generateVideoThumbnail(asset.uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  // Function to generate video thumbnail
  // const generateVideoThumbnail = async (uri: string) => {
  //   try {
  //     const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
  //       uri,
  //       {
  //         time: 0, // Get thumbnail from the start of the video
  //       },
  //     );
  //     setVideoThumbnail(thumbnailUri);
  //   } catch (error) {
  //     console.error('Error generating video thumbnail:', error);
  //     // If thumbnail generation fails, it's not critical - video can still be used
  //   }
  // };

  // Function to remove selected video
  const removeVideo = () => {
    setVideoUri(null);
    setVideoFile(null);
    setVideoThumbnail(null);
  };

  // Add function to upload metadata
  const uploadMetadata = async (): Promise<string> => {
    try {
      setIsUploadingMetadata(true);
      setStatusMessage('Uploading token metadata and image...');

      if (!tokenName || !tokenSymbol || !tokenDescription) {
        throw new Error('Missing required metadata fields');
      }

      if (!imageUri && !tokenLogo) {
        throw new Error('Token image is required');
      }

      // Create form data for upload
      const metadataResult = await uploadTokenMetadata({
        tokenName,
        tokenSymbol,
        description: tokenDescription,
        imageUri: imageUri || tokenLogo,
        imageFile: imageFile,
        twitter: tokenTwitter,
        telegram: tokenTelegram,
        website: tokenWebsite,
      });

      if (!metadataResult.success || !metadataResult.metadataUri) {
        throw new Error(metadataResult.error || 'Failed to upload metadata');
      }

      setMetadataUri(metadataResult.metadataUri);
      setStatusMessage('Metadata uploaded successfully!');
      return metadataResult.metadataUri;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error uploading metadata';
      console.error('Error uploading metadata:', errorMessage);
      setStatusMessage('');
      throw new Error(errorMessage);
    } finally {
      setIsUploadingMetadata(false);
    }
  };

  // Function to upload video to server
  const uploadVideoToServer = async (tokenMint: string) => {
    if (!videoFile) return;

    try {
      setIsUploadingVideo(true);

      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: videoFile.type || 'video/mp4',
        name: videoFile.fileName || `video_${Date.now()}.mp4`,
      } as any);
      formData.append('tokenMint', tokenMint);
      formData.append('userId', walletAddress); // Using wallet address as user ID

      const response = await fetch(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/videos/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload video');
      }

      console.log('Video uploaded successfully:', result.video);
      return result.video;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const renderFeeSharingSection = () => {
    return (
      <View style={styles.feeCard}>
        {/* YOUR SHARE */}
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Your share</Text>
            <Text style={styles.helper} numberOfLines={2}>
              creators earn {yourShare}% of total trading volume
            </Text>
          </View>
          <Text style={styles.share}>{yourShare.toFixed(2)}%</Text>
        </View>

        <Text style={styles.section}>SHARE FEES (OPTIONAL)</Text>

        {/* ADD EARNER BUTTON */}
        {!addingEarner && (
          <TouchableOpacity style={styles.addButton} onPress={startAddEarner}>
            <Text style={styles.addText}>+ add fee earner</Text>
          </TouchableOpacity>
        )}

        {/* ADD EARNER EDITOR (PIC 2) */}
        {/* ADD EARNER EDITOR (MATCHING ATTACHED UI) */}
        {addingEarner && (
          <View style={styles.editorCard}>
            {/* HEADER */}
            <View style={styles.editorHeader}>
              <Text style={styles.editorTitle}>Fee Earner #1</Text>

              <View style={styles.headerIcons}>
                <TouchableOpacity onPress={cancelAddEarner}>
                  <Text style={styles.trash}>🗑</Text>
                </TouchableOpacity>
                <Text style={styles.chevron}>⌃</Text>
              </View>
            </View>

            {/* USER ROW */}
            <View style={styles.userRow}>
              <View style={styles.avatar} />
              <Text style={styles.username}>@{draftUsername || 'BagsAMM'}</Text>

              <TouchableOpacity>
                <Text style={styles.edit}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* SHARE */}
            <View style={styles.shareRow}>
              <Text style={styles.helper}>Their Share</Text>
              <Text style={styles.shareValue}>
                {draftPercentage.toFixed(2)}%
              </Text>
            </View>

            {/* PRESET BUTTONS */}
            <View style={styles.percentRow}>
              {[1, 10, 50, 100].map(v => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setDraftPercentage(v)}
                  style={[
                    styles.percentPill,
                    draftPercentage === v && styles.percentPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.percentText,
                      draftPercentage === v && styles.percentTextActive,
                    ]}>
                    {v}%
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.percentPill} onPress={() => { }}>
                <Text style={styles.percentText}>Custom</Text>
              </TouchableOpacity>
            </View>

            {/* SAVE */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={confirmAddEarner}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMMITTED EARNERS (PIC 3) */}
        {feeEarners.map(e => (
          <View key={e.id} style={styles.earnerRow}>
            <View>
              <Text style={styles.earnerName}>{e.username}</Text>
              <Text style={styles.helper}>{e.percentage.toFixed(2)}%</Text>
            </View>

            <TouchableOpacity onPress={() => removeEarner(e.id)}>
              <Text style={styles.delete}>🗑</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* SPLIT TOGGLE */}
        {feeEarners.length > 1 && (
          <View style={styles.row}>
            <Text style={styles.helper}>Split fees equally</Text>
            <Switch value={splitEqually} onValueChange={setSplitEqually} />
          </View>
        )}
      </View>
    );
  };

  const renderStep1 = () => {
    return (
      <View>
        {/* Token image section - improved UI */}
        <View style={styles.inputContainer}>
          {/* <View style={styles.avatarContainer}>
            {imageUri ? (
              imageUri.startsWith('http') || imageUri.startsWith('ipfs') ? (
                <View style={styles.avatarUrlPreview}>
                  <Text style={styles.avatarUrlText}>{imageUri}</Text>
                </View>
              ) : (
                <Image source={{uri: imageUri}} style={styles.avatarImage} />
              )
            ) : (
              <View style={styles.uploadContent}>
                <View style={{paddingTop: 2}} />
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.uploadImageButton}
                  disabled={isCreating}>
                  <Text style={styles.uploadButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            )}

          
            <TouchableOpacity
              style={styles.editIconContainer}
              onPress={pickImage}
              disabled={isCreating}>
              <View style={styles.editIconCircle}>
                <Icons.PencilIcon width={14} height={14} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View> */}

          <View style={styles.imageUploadBox}>
            <TouchableOpacity onPress={pickImage} disabled={isCreating}>
              {imageUri ? (
                imageUri.startsWith('file://') ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreviewSquare}
                  />
                ) : (
                  <IPFSAwareImage
                    source={{ uri: imageUri }}
                    style={styles.imagePreviewSquare}
                    key={
                      Platform.OS === 'android'
                        ? `profile-${Date.now()}`
                        : 'profile'
                    }
                  />
                )
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.plusIcon}>+</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Video upload section */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Token Video (Optional)</Text>
          <View style={styles.videoUploadBox}>
            <TouchableOpacity onPress={pickVideo} disabled={isCreating || isUploadingVideo}>
              {videoUri && videoThumbnail ? (
                <View style={styles.videoPreviewContainer}>
                  <Image
                    source={{uri: videoThumbnail}}
                    style={styles.videoThumbnailPreview}
                  />
                  <View style={styles.videoPlayOverlay}>
                    <Text style={styles.playIcon}>▶️</Text>
                  </View>
                  <TouchableOpacity onPress={removeVideo} style={styles.removeVideoButton}>
                    <Text style={styles.removeVideoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoIcon}>🎥</Text>
                  <Text style={styles.videoPlaceholderText}>Add Video</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Max 60 seconds, MP4 format recommended</Text>
        </View>

        <View style={styles.inputContainer}>
          {/* <Text style={styles.label}>Token Name</Text> */}
          <TextInput
            style={styles.input}
            value={tokenName}
            onChangeText={setTokenName}
            placeholder="Name"
            placeholderTextColor={COLORS.greyDark}
            keyboardAppearance="dark"
          />
        </View>

        <View style={styles.inputContainer}>
          {/* <Text style={styles.label}>Token Symbol</Text> */}
          <TextInput
            style={styles.input}
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
            placeholder="Ticker"
            placeholderTextColor={COLORS.greyDark}
            maxLength={10}
            keyboardAppearance="dark"
          />
        </View>

        <View style={styles.inputContainer}>
          {/* <Text style={styles.label}>Description</Text> */}
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={tokenDescription}
            onChangeText={setTokenDescription}
            placeholder="Description"
            placeholderTextColor={COLORS.greyDark}
            multiline
            keyboardAppearance="dark"
          />
        </View>

        <View style={styles.switchContainer}>
          <View style={styles.insideSwithcContainer}>
            <Text style={styles.label}>Fee sharing</Text>
            <Text style={styles.helperText}>
              Share trading fees with friends
            </Text>
          </View>

          <Switch
            value={feeSharing}
            onValueChange={setFeeSharing}
            trackColor={{ false: COLORS.greyDark, true: COLORS.brandPrimary }}
            thumbColor={COLORS.white}
          />
        </View>

        {feeSharing && renderFeeSharingSection()}

        <TouchableOpacity
          onPress={() => setShowAdvanced(!showAdvanced)}
          style={{ alignItems: 'center', marginBottom: 30, marginTop: 20 }}>
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? 'Less options' : 'More options'}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <>
            <Text style={styles.sectionLabel}>INITIAL BUY (OPTIONAL)</Text>

            <View style={styles.buyOptionsRow}>
              {['0.1', '0.5', '1', '2'].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.buyPill,
                    buyAmount === v && styles.buyPillActive,
                  ]}
                  onPress={() => {
                    setBuyOnCreate(true);
                    setBuyAmount(v);
                  }}>
                  <Text style={styles.buyPillText}>{v}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.buyPill}
                onPress={() => setBuyOnCreate(true)}>
                <Text style={styles.buyPillText}>Custom</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              {/* <Text style={styles.label}>Website (Optional)</Text> */}
              <TextInput
                style={styles.input}
                value={tokenWebsite}
                onChangeText={setTokenWebsite}
                placeholder="Website (Optional)"
                placeholderTextColor={COLORS.greyDark}
                keyboardAppearance="dark"
              />
            </View>

            <View style={styles.inputContainer}>
              {/* <Text style={styles.label}>Twitter (Optional)</Text> */}
              <TextInput
                style={styles.input}
                value={tokenTwitter}
                onChangeText={setTokenTwitter}
                placeholder="Twitter (Optional)"
                placeholderTextColor={COLORS.greyDark}
                editable={!isCreating}
                keyboardAppearance="dark"
              />
            </View>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={handleCreateToken}
          disabled={isCreating}>
          <LinearGradient
            colors={['#427abbff', '#164780ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}>
            {isCreating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionButtonText}>
                {buyOnCreate ? 'Launch and Buy' : 'Launch'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundSemiGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* <Text style={styles.title}>Create Token with Bonding Curve</Text> */}
          {renderStep1()}
          {/* <View style={styles.stepIndicator}>
                    <View style={[styles.step, step >= 1 && styles.stepActive]}>
                        <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
                    </View>
                    <View style={styles.stepConnector} />
                    <View style={[styles.step, step >= 2 && styles.stepActive]}>
                        <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
                    </View>
                </View>

                {step === 1 ? renderStep1() : renderStep2()} */}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    // backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 10,
    margin: 16,
    // shadowColor: '#000',
    // shadowOffset: {
    //     width: 0,
    //     height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    color: COLORS.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  sectionLabel: {
    color: COLORS.greyMid,
    fontSize: TYPOGRAPHY.size.xs,
    marginBottom: 16,
    marginLeft: 2,
  },

  buyOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  buyPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.darkerBackground,
  },

  buyPillActive: {
    backgroundColor: COLORS.brandPrimary,
  },

  buyPillText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
  },

  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.darkerBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
  },
  stepActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  stepConnector: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.borderDarkColor,
    marginHorizontal: 8,
  },
  stepText: {
    color: COLORS.greyDark,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  stepTextActive: {
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    color: COLORS.white,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.white,
    marginBottom: 8,
    marginRight: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0.75,
    backgroundColor: '#05223360',
    borderColor: '#646669',
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.md,
  },
  helperText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.greyDark,
    marginTop: 4,
    // width: 150,
    // marginLeft: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0.75,
    backgroundColor: '#05223360',
    borderColor: '#646669',
    borderRadius: 12,
  },
  insideSwithcContainer: {},
  errorText: {
    color: COLORS.errorRed,
    fontSize: TYPOGRAPHY.size.sm,
    marginVertical: 8,
  },
  statusContainer: {
    backgroundColor: COLORS.darkerBackground,
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brandPrimary,
  },
  statusText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
  },
  actionButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  advancedToggle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  advancedToggleText: {
    color: COLORS.brandPrimary,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  advancedContainer: {
    marginTop: 8,
  },
  feeTiersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  feeTierButton: {
    backgroundColor: COLORS.darkerBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
  },
  feeTierButtonSelected: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  feeTierText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
  },
  feeTierTextSelected: {
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  lpDistributionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  lpInputGroup: {
    width: '50%',
    paddingRight: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lpLabel: {
    width: '40%',
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.greyMid,
  },
  lpInput: {
    flex: 1,
    backgroundColor: COLORS.darkerBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
  },
  lpPercent: {
    marginLeft: 4,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.greyMid,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  createButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  imageUploadContainer: {
    backgroundColor: COLORS.darkerBackground,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
    borderStyle: 'dashed',
    height: 65,
    width: 65,
    overflow: 'hidden',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  uploadContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    padding: 20,
    borderRadius: 50,
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageUrlPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.darkerBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageUrlText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontFamily: TYPOGRAPHY.fontFamily,
    textAlign: 'center',
  },
  imageControlsContainer: {
    position: 'absolute',
    top: 2,
    right: 20,
    flexDirection: 'row',
  },
  imageControlButton: {
    backgroundColor: 'rgba(153, 131, 131, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  removeButton: {
    backgroundColor: 'rgba(220,53,69,0.8)', // Red color with transparency
  },
  imageControlText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.xs,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  selectFileButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
    marginBottom: 12,
  },
  selectFileText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  orText: {
    color: COLORS.greyMid,
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
    marginVertical: 8,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  urlButton: {
    backgroundColor: COLORS.brandPrimary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'center',
  },
  urlButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  socialsToggleButton: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  socialsToggleText: {
    color: COLORS.brandPrimary,
    fontSize: TYPOGRAPHY.size.md,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  socialsContainer: {
    marginBottom: 16,
  },
  uploadImageButton: {
    color: '#fff',
    // overflow: 'hidden',
    borderRadius: 8,

    // marginBottom: 16,
  },
  uploadButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  urlInputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },

  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: COLORS.darkerBackground,
    // overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: COLORS.greyDark,
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
  avatarUrlPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  avatarUrlText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#164780ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },

  imageUploadBox: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.greyDark,
    alignSelf: 'center',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  plusIcon: {
    color: COLORS.greyDark,
    fontSize: 36,
    fontWeight: '600',
  },

  imagePreviewSquare: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  videoUploadBox: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.greyDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  videoPlaceholderText: {
    color: COLORS.greyDark,
    fontSize: TYPOGRAPHY.size.sm,
  },
  videoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    position: 'relative',
  },
  videoThumbnailPreview: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  videoPlayOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIcon: {
    fontSize: 32,
  },
  videoSelectedText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.md,
  },
  removeVideoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.brandPrimary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeVideoText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  feeCard: {
    // backgroundColor: '#05223360',
    // borderRadius: 12,
    // paddingHorizontal: 16,
    // paddingVertical: 8,
    // borderWidth: 0.75,
    // borderColor: '#646669',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 0.75,
    borderColor: '#646669',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  share: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },

  section: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 12,
  },

  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.greyDark,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },

  addText: {
    color: COLORS.white,
  },

  editorCard: {
    // backgroundColor: COLORS.darkerBackground,
    // borderRadius: 10,
    paddingHorizontal: 16,
    gap: 5,
    paddingVertical: 8,
    marginTop: 10,
    backgroundColor: '#05223360',
    borderRadius: 12,
    // paddingHorizontal: 16,
    // paddingVertical: 8,
    borderWidth: 0.75,
    borderColor: '#646669',
  },

  editorTitle: {
    color: COLORS.white,
    marginBottom: 8,
  },

  editorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  cancel: {
    color: COLORS.greyDark,
  },

  next: {
    color: COLORS.brandPrimary,
    fontWeight: '600',
  },

  earnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: COLORS.borderDarkColor,
  },

  earnerName: {
    color: COLORS.white,
  },

  delete: {
    color: COLORS.errorRed,
  },
  helper: {
    color: COLORS.greyDark,
    fontSize: 12,
    width: 150,
  },
  //   editorCard: {
  //   backgroundColor: '#0b0b0b',
  //   borderRadius: 14,
  //   padding: 14,
  //   borderWidth: 0.75,
  //   borderColor: '#2a2a2a',
  //   marginTop: 12,
  // },

  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // editorTitle: {
  //   color: COLORS.white,
  //   fontSize: 14,
  //   fontWeight: '600',
  // },

  headerIcons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  trash: {
    color: COLORS.errorRed,
    fontSize: 14,
  },

  chevron: {
    color: COLORS.greyDark,
    fontSize: 14,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    marginBottom: 14,
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1f7aff',
  },

  username: {
    color: COLORS.white,
    flex: 1,
    fontSize: 13,
  },

  edit: {
    color: COLORS.greyMid,
    fontSize: 12,
  },

  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  shareValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  percentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  percentPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#141414',
  },

  percentPillActive: {
    backgroundColor: '#2dff6a',
  },

  percentText: {
    color: COLORS.greyMid,
    fontSize: 12,
  },

  percentTextActive: {
    color: '#000',
    fontWeight: '600',
  },

  saveButton: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  saveText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },

});
