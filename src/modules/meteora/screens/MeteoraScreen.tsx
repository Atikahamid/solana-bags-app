import React, { useState, useCallback } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '@/modules/wallet-providers/hooks/useWallet';
import { AppHeader } from '@/core/shared-ui';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';
import { TokenCreationForm } from '../components';

enum MeteoraTab {
    CREATE_TOKEN = 'create_token'
}

export default function MeteoraScreen() {
    const navigation = useNavigation();
    const {wallet, isPrivy, sendBase64Transaction} = useWallet();

    // console.log("isprivy: ", isPrivy);
    // console.log("sendbase64: ", sendBase64Transaction);
    // ✅ all hooks declared at top level, always in same order
    const [activeTab] = useState<MeteoraTab>(MeteoraTab.CREATE_TOKEN);
    const [transactionHistory, setTransactionHistory] = useState<
        Array<{ id: string; type: string; timestamp: number }>
    >([]);
    const [creationResult, setCreationResult] = useState<{ txId: string; baseMint: string } | null>(null);

    const walletAddress = wallet?.publicKey?.toString() || '';

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleTransactionComplete = useCallback((txId: string, type?: string) => {
        setTransactionHistory(prev => [
            {
                id: txId,
                type: type || 'Token Creation',
                timestamp: Date.now(),
            },
            ...prev,
        ]);
    }, []);

    const handleTokenCreated = useCallback((tokenAddress: string, txId: string) => {
        handleTransactionComplete(txId, 'Token Creation');
        setCreationResult({ txId, baseMint: tokenAddress });
    }, [handleTransactionComplete]);

    return (
        <SafeAreaView
            style={[
                styles.container,
                Platform.OS === 'android' && styles.androidSafeArea,
            ]}>
            <StatusBar style="light" />

            <AppHeader
                title="Launch a coin"
                showBackButton={true}
                onBackPress={handleBack}
            />

            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* ✅ no conditional hooks, just pass props */}
                <TokenCreationForm walletAddress={walletAddress} isPrivy={isPrivy} sendBase64Transaction={sendBase64Transaction} onTokenCreated={handleTokenCreated} />

                {/* {transactionHistory.length > 0 && (
                    <View style={styles.historyContainer}>
                        <Text style={styles.historyTitle}>Recent Transactions</Text>
                        {transactionHistory.map((tx) => (
                            <View key={tx.id} style={styles.historyItem}>
                                <View style={styles.historyItemLeft}>
                                    <Text style={styles.historyItemType}>{tx.type}</Text>
                                    <Text style={styles.historyItemTime}>
                                        {new Date(tx.timestamp).toLocaleTimeString()}
                                    </Text>
                                </View>
                                <Text style={styles.historyItemStatus}>Completed</Text>
                            </View>
                        ))}
                    </View>
                )} */}
            </ScrollView>

            {/* ✅ keep Modal always mounted, just control `visible` */}
            {/* <Modal
                visible={!!creationResult}
                transparent
                animationType="fade"
                onRequestClose={() => setCreationResult(null)}
            > 
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Token Created 🎉</Text>
                        <Text style={styles.modalText}>TxID: {creationResult?.txId}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                const explorerUrl = `https://explorer.solana.com/address/${creationResult?.baseMint}?cluster=devnet`;
                                Linking.openURL(explorerUrl).catch(err =>
                                    console.error("Failed to open Solana Explorer:", err)
                                );
                            }}
                        >
                            <Text style={[styles.modalText, { color: '#a49999ff', textDecorationLine: 'underline' }]}>
                                Base Mint: {creationResult?.baseMint}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.modalText}>Base Mint: {creationResult?.baseMint}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setCreationResult(null)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal> */}
            
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.lightBackground,
    },
    androidSafeArea: {
        paddingTop: 50,
    },
    contentContainer: {
        // paddingBottom: 40,
    },
    historyContainer: {
        marginHorizontal: 16,
        marginTop: 32,
        padding: 16,
        backgroundColor: COLORS.lighterBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderDarkColor,
    },
    historyTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weights.semiBold,
        color: COLORS.white,
        marginBottom: 16,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderDarkColor,
    },
    historyItemLeft: {
        flex: 1,
    },
    historyItemType: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.weights.medium,
    },
    historyItemTime: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.greyMid,
        marginTop: 4,
    },
    historyItemStatus: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.brandGreen,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        backgroundColor: COLORS.darkerBackground,
        padding: 24,
        borderRadius: 16,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weights.semiBold,
        color: COLORS.white,
        marginBottom: 12,
    },
    modalText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.greyMid,
        marginBottom: 8,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 16,
        backgroundColor: COLORS.brandPrimary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    closeButtonText: {
        color: COLORS.white,
        fontWeight: TYPOGRAPHY.weights.semiBold,
    },
});
