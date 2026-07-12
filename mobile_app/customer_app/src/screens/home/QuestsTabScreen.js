import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function QuestsTabScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchQuests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/quests/active');
            if (response.data && !response.data.isAxiosError) {
                setQuests(response.data);
            }
        } catch (error) {
            console.error('[QuestsTabScreen] Error fetching quests:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchQuests();
        }, [])
    );

    const renderQuestCard = ({ item }) => {
        const progressFraction = Math.min(item.currentCount / item.targetCount, 1);
        const progressPercent = Math.round(progressFraction * 100);

        return (
            <TouchableOpacity 
                style={[styles.questCard, { borderColor: '#d0dcd0', backgroundColor: colors.card }]}
                activeOpacity={0.9}
                onPress={async () => {
                    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
                    navigation.navigate('Quest', { quest: item });
                }}
            >
                <View style={styles.questCardTop}>
                    <View style={styles.questIconWrapper}>
                        <Ionicons name="trophy" size={24} color="#056f36" />
                    </View>
                    <View style={styles.questInfoBox}>
                        <Text style={[styles.questTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.questDesc, { color: colors.gray }]} numberOfLines={2}>{item.description}</Text>
                    </View>
                    <View style={styles.questRewardBadge}>
                        <Text style={styles.questRewardLabel}>REWARD</Text>
                        <View style={styles.rewardAmountRow}>
                            <MaterialCommunityIcons name="database-marker" size={14} color="#056f36" style={{ marginRight: 2 }} />
                            <Text style={styles.questRewardAmount}>+{Math.round(item.rewardAmount)} Ł</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <View style={styles.progressTextRow}>
                        <Text style={styles.progressCountText}>
                            {item.currentCount} / {item.targetCount} orders
                        </Text>
                        <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerSubtitle, { color: '#056f36' }]}>COMMUNITY CHALLENGES</Text>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Campus Quests</Text>
                </View>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            <FlatList
                data={quests}
                keyExtractor={(item) => item.id}
                renderItem={renderQuestCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchQuests} tintColor="#056f36" />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="compass-outline" size={60} color="#ccc" style={{ marginBottom: 15 }} />
                            <Text style={[styles.emptyText, { color: colors.gray }]}>No active quests for your campus right now.</Text>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
        marginRight: 4,
    },
    liveText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#ef4444',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    questCard: {
        borderRadius: 22,
        padding: 16,
        borderWidth: 1.5,
        shadowColor: '#056f36',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 15,
    },
    questCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    questIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#edf5ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    questInfoBox: {
        flex: 1,
        marginRight: 8,
    },
    questTitle: {
        fontSize: 15,
        fontWeight: '900',
        marginBottom: 4,
    },
    questDesc: {
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 15,
    },
    questRewardBadge: {
        backgroundColor: '#edf5ed',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#d0dcd0',
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 70,
    },
    questRewardLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#056f36',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    rewardAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questRewardAmount: {
        fontSize: 14,
        fontWeight: '900',
        color: '#056f36',
    },
    progressContainer: {
        marginTop: 14,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#f0f3f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#056f36',
        borderRadius: 4,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    progressCountText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#666',
    },
    progressPercentText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#056f36',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
        fontWeight: '600',
        lineHeight: 20,
    },
});
