import { View, Text, StyleSheet } from "react-native";

export default function SportsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏀 Sports Details</Text>

            <Text style={styles.info}>Knicks vs Celtics 7:00 PM</Text>
            <Text style={styles.info}>Yankees vs Red Sox 7:05 PM</Text>
            <Text style={styles.info}>Mets vs Phillies 7:10 PM</Text>

            <Text style={styles.note}>
                Scores and Standings coming soon...
            </Text>
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
})