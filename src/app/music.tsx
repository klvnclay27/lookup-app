import { View, Text, StyleSheet, ScrollView } from "react-native";

const topTracks = [
    {
        title: "Not Like Us",
        artist: "Kendrick Lamar",
        genre: "Hip-Hop",
    },
    {
        title: "Die With a Smile",
        artist: "Lady Gaga & Bruno Mars",
        genre: "Pop",
    },
    {
        title: " Birds of a Feather",
        artist: "Billie Eilish",
        genre: "Alternative",
    },
];

export default function MusicScreen() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🎵 Music</Text>
            <Text style={styles.subtitle}>Made for Kelvin</Text>

            <View style={styles.nowPlayingCard}>
                <Text style={styles.nowPlayingLabel}>Now Playing</Text>
                <Text style={styles.nowPlayingTitle}>{topTracks[0].title}</Text>
                <Text style={styles.nowPlayingArtist}>{topTracks[0].artist}</Text>
            </View>

            <Text style={styles.sectionTitle}>Top Tracks Today</Text>

            {topTracks.map((song, index) => (
                <View key={index} style={styles.songCard}>
                    <Text style={styles.songRank}>{index + 1}</Text>

                    <View>
                        <Text style={styles.songTitle}>{song.title}</Text>
                        <Text style={styles.songArtist}>{song.artist}</Text>
                        <Text style={styles.songGenre}>{song.genre}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 20,
    },
    info: {
        fontSize: 20,
        color: "#fff",
    },
    note: {
        marginTop: 20,
        color:"94a3b8",
        fontSize: 16,
    },

    subtitle: {
        color: "#94a3b8",
        fontSize: 16,
        marginBottom: 20,
    },

    nowPlayingCard: {
        backgroundColor: "#1e293b",
        padding : 24,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },

    nowPlayingLabel: {
        color: "#38bdf8",
        fontSize: 14,
        marginBottom: 8,
    },

    nowPlayingTitle: {
        color: "#fff",
        fontSize: 34,
        fontWeight: "bold",
    },

    nowPlayingArtist: {
        color: "#cbd5e1",
        fontSize: 16,
        marginTop: 6,
    },

    sectionTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 14,
    },

    songCard: {
        flexDirection: "row",
        alignItems: 'center',
        backgroundColor: "#111827",
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
    },

    songRank: {
        color: "#38bdf8",
        fontSize: 22,
        fontWeight: "bold",
        marginRight: 16,
    },

    songTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    
    songArtist: {
        color: "#cbd5e1",
        fontSize: 13,
        marginTop: 4,
    },

    songGenre: {
        color: "#64748b",
        fontSize: 13,
        marginTop: 2,
    }
})