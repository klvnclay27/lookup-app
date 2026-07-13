import { View, Text, StyleSheet } from "react-native"

export default function GameDetails() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏀 Game Details</Text>

            <View style={styles.scoreCard}>
                <Text style={styles.matchup}>Knicks vs Celtics</Text>
                <Text style={styles.status}>7:00 PM</Text>
                <Text style={styles.info}>NBA • Madison Square Garden</Text>
            </View>

            <Text style={styles.sectionTitle}>Game information</Text>
            <Text style={styles.info}>Scores, stats, and highlights coming soon.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
        padding: 20,
    },

    title: {
        color: "#ffffff",
        fontSize: 30,
        fontWeight: "bold",
        marginBottom: 20,
    },

    scoreCard: {
        backgroundColor: "#1e293b",
        padding: 18,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)", 
    },

    matchup: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 8,
        
    },

    status: {
        color: "#38bdf8",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 8,
    },

    sectionTitle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },

    info: {
        color: "#cbd5e1",
        fontSize: 15,
        marginTop: 6,
    },
});