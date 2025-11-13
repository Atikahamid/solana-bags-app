import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Image,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "@/assets/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Icons from "@/assets/svgs";
import PumpFunImg from '@/assets/images/pumpfun-logo-img.png';
import BonkImg from '@/assets/images/bonk-logo.png';
import BagsImg from '@/assets/images/bags-logo.png';
import MoonShotImg from '@/assets/images/moonshot-logo.png';
import BelieveImg from '@/assets/images/believe-logo.png';
import JupiterImg from '@/assets/images/jupiter-logo.png';
import MoonitImg from '@/assets/images/moonit-logo.png';
import BoopImg from '@/assets/images/boop-logo.png';
import launchlabImg from '@/assets/images/launchlab-logo.png';
import DBCImg from '@/assets/images/DB-logo.png';

if (Platform.OS === "android") {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const PROTOCOLS = [
    { name: "Pump", image: PumpFunImg, color: "#11aa6dff" },
    { name: "Bonk", image: BonkImg, color: "#F4A261" },
    { name: "Bags", image: BagsImg, color: "#08c608ff" },
    { name: "Moonshot", image: MoonShotImg, color: "#df52c8ff" },
    // { name: "Heaven", image: require("@/assets/protocols/heaven.png"), color: "#9B5DE5" },
    // { name: "Sugar", image: require("@/assets/protocols/sugar.png"), color: "#F15BB5" },
    { name: "Believe", image: BelieveImg, color: "#11892bff" },
     { name: "Boop", image: BoopImg, color: "#108eeeff" },
    { name: "Jupiter Studio", image: JupiterImg, color: "#b4aa27ff" },
    { name: "Moonit", image: MoonitImg, color: "#d8df14ff" },
    { name: "LaunchLab", image: launchlabImg, color: "#0d4cb1ff" },
    { name: "Dynamic BC", image: DBCImg, color: "#d66006ff" },
];


export const FiltersScreen: React.FC = () => {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
    const [includeKeywords, setIncludeKeywords] = useState("");
    const [excludeKeywords, setExcludeKeywords] = useState("");
    const [dexPaid, setDexPaid] = useState(false);
    const [caEndsPump, setCaEndsPump] = useState(false);
    const [curveMin, setCurveMin] = useState("");
    const [curveMax, setCurveMax] = useState("");
    const [ageMin, setAgeMin] = useState("");
    const [ageMax, setAgeMax] = useState("");
    const navigation = useNavigation();

    const handleClose = () => navigation.goBack();

    const toggleExpand = (section: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(expanded === section ? null : section);
    };

    const toggleProtocol = (name: string) => {
        setSelectedProtocols((prev) =>
            prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
        );
    };

    return (
        <LinearGradient
            colors={COLORS.backgroundGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bigcontainer}
        >
            <SafeAreaView style={styles.container} edges={["top"]}>
                <LinearGradient
                    colors={['#050b24ff', '#142542ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                // style={styles.container}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Filters</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Icons.cross width={22} height={22} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                </LinearGradient>


                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.firstfilter}>
                        <View style={styles.protocolHeader}>
                            <Text style={styles.sectionTitle}>Protocols</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedProtocols(PROTOCOLS)}
                            >
                                <Text style={styles.selectAll}>Select All</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.protocols}>
                            {PROTOCOLS.map((p) => {
                                const isActive = selectedProtocols.includes(p.name);
                                return (
                                    <TouchableOpacity
                                        key={p.name}
                                        style={[
                                            styles.protocolChip,
                                            {
                                                borderColor: p.color,
                                                backgroundColor: isActive ? p.color : "transparent",
                                            },
                                        ]}
                                        onPress={() => toggleProtocol(p.name)}
                                    >
                                        <View style={styles.protocolChipContent}>
                                            <Image source={p.image} style={styles.protocolIcon} />
                                            <Text
                                                style={[
                                                    styles.protocolText,
                                                    { color: isActive ? COLORS.white : p.color },
                                                ]}
                                            >
                                                {p.name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>


                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>Search Keywords</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="keyword1, keyword2..."
                                placeholderTextColor={COLORS.greyMid}
                                value={includeKeywords}
                                onChangeText={setIncludeKeywords}
                            />
                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                Exclude Keywords
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="keyword1, keyword2..."
                                placeholderTextColor={COLORS.greyMid}
                                value={excludeKeywords}
                                onChangeText={setExcludeKeywords}
                            />
                            <View style={styles.sectionContent}>
                                <Text style={styles.sectionTitle}>B. curve %</Text>
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Min"
                                        keyboardType="numeric"
                                        value={curveMin}
                                        onChangeText={setCurveMin}
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Max"
                                        keyboardType="numeric"
                                        value={curveMax}
                                        onChangeText={setCurveMax}
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                </View>
                            </View>

                        </View>
                    </View>
                    {/* Audit Section */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleExpand("Audit")}
                        >
                            <Text style={styles.sectionTitle}>Audit</Text>
                            <Text style={styles.dropdownIcon}>
                                {expanded === "Audit" ? "▲" : "▼"}
                            </Text>
                        </TouchableOpacity>

                        {expanded === "Audit" && (
                            <View style={styles.sectionContent}>
                                {/* Checkboxes */}
                                <View style={styles.row}>
                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setDexPaid(!dexPaid)}
                                    >
                                        <View style={[styles.checkboxBox, dexPaid && styles.checkboxBoxChecked]} />
                                        <Text style={styles.checkboxLabel}>Dex Paid</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setCaEndsPump(!caEndsPump)}
                                    >
                                        <View style={[styles.checkboxBox, caEndsPump && styles.checkboxBoxChecked]} />
                                        <Text style={styles.checkboxLabel}>CA ends in 'pump'</Text>
                                    </TouchableOpacity>
                                </View>


                                {/* Age */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Age</Text>
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Min"
                                        value={ageMin}
                                        keyboardType="numeric"
                                        onChangeText={setAgeMin}
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Max"
                                        value={ageMax}
                                        keyboardType="numeric"
                                        onChangeText={setAgeMax}
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                </View>

                                {/* Top 10 Holders % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Top 10 Holders %
                                </Text>
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Min"
                                        keyboardType="numeric"
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Max"
                                        keyboardType="numeric"
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Dev Holding %
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Snipers % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Snipers %
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Insiders % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Insiders %
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Bundles % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Bundles %
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Holders */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Holders
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Pro Traders */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Pro Traders
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Migrations */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Dev Migrations
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Pairs Created */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Dev Pairs Created
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>
                            </View>
                        )}
                    </View>


                    {/* Metrics Section */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleExpand("Metrics")}
                        >
                            <Text style={styles.sectionTitle}>$ Metrics</Text>
                            <Text style={styles.dropdownIcon}>
                                {expanded === "Metrics" ? "▲" : "▼"}
                            </Text>
                        </TouchableOpacity>
                        {expanded === "Metrics" && (
                            <View style={styles.sectionContent}>
                                <Text style={styles.sectionTitle}>Liquidity ($)</Text>
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Min"
                                        keyboardType="numeric"
                                        value={curveMin}
                                        onChangeText={setCurveMin}
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.half]}
                                        placeholder="Max"
                                        keyboardType="numeric"
                                        value={curveMax}
                                        onChangeText={setCurveMax}
                                        placeholderTextColor={COLORS.greyMid}
                                    />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Volume ($)
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Market Cap ($)
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Global Fees Paid (SOL)
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Txns
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Num Buys
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Num Sells
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Socials Section */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleExpand("Socials")}
                        >
                            <Text style={styles.sectionTitle}>Socials</Text>
                            <Text style={styles.dropdownIcon}>
                                {expanded === "Socials" ? "▲" : "▼"}
                            </Text>
                        </TouchableOpacity>
                        {expanded === "Socials" && (
                            <View style={styles.sectionContent}>
                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    Twitter Reuses
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>

                                {/* Dev Holding % */}
                                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                                    twitter Age
                                </Text>
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, styles.half]} placeholder="Min" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                    <TextInput style={[styles.input, styles.half]} placeholder="Max" keyboardType="numeric" placeholderTextColor={COLORS.greyMid} />
                                </View>
                                <View style={styles.row} >
                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setDexPaid(!dexPaid)}
                                    >
                                        <View style={[styles.checkboxBox, dexPaid && styles.checkboxBoxChecked]} />
                                        <Text style={styles.checkboxLabel}>Twitter</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setCaEndsPump(!caEndsPump)}
                                    >
                                        <View style={[styles.checkboxBox, caEndsPump && styles.checkboxBoxChecked]} />
                                        <Text style={styles.checkboxLabel}>Website</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setCaEndsPump(!caEndsPump)}
                                    >
                                        <View style={[styles.checkboxBox, caEndsPump && styles.checkboxBoxChecked]} />
                                        <Text style={styles.checkboxLabel}>Telegram</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.checkboxRow}
                                        onPress={() => setCaEndsPump(!caEndsPump)}
                                    >
                                        <View style={[styles.checkboxBox, caEndsPump && styles.checkboxBoxChecked]} />
                                        <Text style={styles.checkboxLabel}>Atleast One Social</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.applyButton}>
                        <Text style={styles.applyButtonText}>Apply All</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    ); 
};

const styles = StyleSheet.create({
    bigcontainer: {flex: 1},
    container: { flex: 1, paddingHorizontal: 6,
     },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        // backgroundColor: "#282e41ff"
    },
    firstfilter: {
        // marginHorizontal: 16,
        // marginVertical: 16
        // marginTop: 4
    },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "600" },
    closeButton: { padding: 4 },
    scroll: { padding: 16, paddingBottom: 120 },
    section: { marginBottom: 20 },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: COLORS.greyDark,
    },
    protocolHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: "600", marginBottom: 8 },
    dropdownIcon: { color: COLORS.white, fontSize: 16 },
    sectionContent: { marginTop: 12, paddingHorizontal: 6 },
    selectAll: { color: COLORS.white, fontSize: 14 },
    protocols: { flexDirection: "row", flexWrap: "wrap" },
    protocolChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.greyDark,
        margin: 4,
    },
    protocolChipActive: { backgroundColor: COLORS.primary },
    protocolText: { color: COLORS.greyMid },
    protocolTextActive: { color: COLORS.white, fontWeight: "600" },
    input: {
        borderWidth: 1,
        borderColor: COLORS.greyDark,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 12,
        color: COLORS.white,
        marginBottom: 8,
    },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
    half: { flex: 1 },
    checkbox: {
        borderWidth: 1,
        borderColor: COLORS.greyDark,
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
    },
    checkboxActive: { backgroundColor: COLORS.primary },
    checkboxText: { color: COLORS.white },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        padding: 8,
        backgroundColor: "#16264aff",
        // borderTopWidth: 1,
        // borderColor: COLORS.greyDark,
    },
    applyButton: {
        flex: 1,
        marginLeft: 6,
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    applyButtonText: { color: COLORS.white, fontWeight: "600" },
    protocolChipContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    protocolIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
    },
    checkboxBox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: COLORS.greyDark,
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: "transparent",
    },
    checkboxBoxChecked: {
        backgroundColor: COLORS.primary,
    },
    checkboxLabel: {
        color: COLORS.white,
    },


});