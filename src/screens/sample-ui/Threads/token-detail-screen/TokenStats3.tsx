import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    ActivityIndicator,
} from "react-native";
import COLORS from "@/assets/colors";
import SampleAvatar from "@/assets/images/User2.png";
import { fetchTokenHolders, fetchTokenActivity } from "./tokenDetailService";
// import { getRelativeTime, formatCompactNumber } from "./utils"; // ✅ make sure you import
import { getRelativeTime } from "../tokenPulse/tokenServicefile";
import { formatCompactNumber } from "../SearchScreen";

type Holder = {
    address: string;
    holding: number;
};

type Activity = {
    trader: string;
    activity: "BUY" | "SELL" | "UNKNOWN";
    amountSOL: number;
    priceUSD: number | null;
    priceChange: number | null;
    time: string | number;
};

interface Props {
    mintAddress: string;
}

const TokenStats3: React.FC<Props> = ({ mintAddress }) => {
    const [showAllHolders, setShowAllHolders] = useState(false);
    const [showAllActivity, setShowAllActivity] = useState(false);

    const [holders, setHolders] = useState<Holder[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [holdersData, activityData] = await Promise.all([
                    fetchTokenHolders(mintAddress),
                    fetchTokenActivity(mintAddress),
                ]);

                setHolders(holdersData.holders || []);
                setActivities(activityData.activities || []);
            } catch (error) {
                console.error("❌ Error loading token stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (mintAddress) {
            loadData();
        }
    }, [mintAddress]);

    if (loading) {
        return (
            <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    const displayedHolders = showAllHolders ? holders : holders.slice(0, 3);
    const displayedActivities = showAllActivity ? activities : activities.slice(0, 2);

    // ✅ utility to shorten addresses
    const shortenAddress = (addr: string) =>
        addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

    return (
        <View style={styles.container}>
            {/* Holders Section */}
            <Text style={styles.sectionTitle}>Top Holders</Text>
            <FlatList
                data={displayedHolders}
                keyExtractor={(item, index) => item.address + index}
                renderItem={({ item }) => (
                    <View style={styles.holderRow}>
                        <View style={styles.holderIcon} />
                        <View style={styles.holderInfo}>
                            <Text style={styles.holderAddress}>{shortenAddress(item.address)}</Text>
                            <Text style={styles.holderAmount}>
                                {formatCompactNumber(item.holding)}
                            </Text>
                        </View>

                        {/* ✅ Static fields until backend provides them */}
                        <Text style={styles.holderPercent}>8.00%</Text>
                        <Text style={styles.holderValue}>${formatCompactNumber(646580000)}</Text>
                    </View>
                )}
            />
            <TouchableOpacity onPress={() => setShowAllHolders(!showAllHolders)}>
                <Text style={styles.viewMore}>
                    {showAllHolders ? "VIEW LESS" : "VIEW MORE"}
                </Text>
            </TouchableOpacity>

            {/* Activity Section */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Activity</Text>
            <FlatList
                data={displayedActivities}
                keyExtractor={(_, index) => "activity-" + index}
                renderItem={({ item }) => (
                    <View style={styles.activityRow}>
                        <Image source={SampleAvatar} style={styles.avatar} />
                        <View style={styles.activityInfo}>
                            <Text style={styles.username}>{shortenAddress(item.trader)}</Text>
                            <View style={styles.innerActivity}>
                                <Text
                                    style={[
                                        styles.activityType,
                                        item.activity === "BUY" ? styles.buy : styles.sell,
                                    ]}
                                >
                                    {item.activity}
                                </Text>
                                <Text style={styles.activityAmount}>
                                    {item.amountSOL.toFixed(2)} SOL @
                                    {item.priceUSD ? formatCompactNumber(item.priceUSD.toFixed(2)) : "N/A"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.activityRight}>
                            <Text style={styles.activityTime}>
                                {getRelativeTime(item.time)}
                            </Text>
                            <Text
                                style={[
                                    styles.activityChange,
                                    { color: item.priceChange && item.priceChange < 0 ? "red" : "limegreen" },
                                ]}
                            >
                                {item.priceChange ? item.priceChange.toFixed(2) + "%" : "--"}
                            </Text>

                        </View>
                    </View>
                )}
            />
            <TouchableOpacity onPress={() => setShowAllActivity(!showAllActivity)}>
                <Text style={styles.viewMore}>
                    {showAllActivity ? "VIEW LESS" : "VIEW MORE"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    viewMore: {
        color: "#888",
        fontSize: 13,
        textAlign: "center",
        marginVertical: 10,
    },
    holderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
    },
    holderIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#444",
        marginRight: 12,
    },
    holderInfo: { flex: 1 },
    holderAddress: { color: "#fff", fontSize: 14, fontWeight: "600" },
    holderAmount: { color: "#aaa", fontSize: 12 },
    holderPercent: { color: "#fff", fontSize: 13, marginRight: 12 },
    holderValue: { color: "#aaa", fontSize: 12 },
    activityRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#333",
    },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
    activityInfo: { flex: 1 },
    username: { color: "#fff", fontSize: 14, fontWeight: "600" },
    activityType: {
        fontSize: 12,
        marginVertical: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: "hidden",
        fontWeight: "600",
    },
    buy: { color: "#000", backgroundColor: "limegreen" },
    sell: { color: "#fff", backgroundColor: "red" },
    innerActivity: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    activityAmount: { color: "#aaa", fontSize: 12 },
    activityRight: { alignItems: "flex-end" },
    activityChange: { fontSize: 12 },
    activityTime: { color: "#777", fontSize: 10, marginTop: 2 },
});

export default TokenStats3;
