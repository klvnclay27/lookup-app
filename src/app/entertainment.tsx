import { View, Text, StyleSheet } from "react-native";

export default function EntertainmentScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🎬 Entertainment Details</Text>

            <Text style={styles.info}>Now Showing: Superman</Text>
            <Text style={styles.info}>Trending Show: The Last Of Us</Text>
            <Text style={styles.info}>Top Streaming: Netflix</Text>

            <Text style={styles.note}>
                Reviews and trailers coming soon...
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
        marginBottom: 10,
    },
    info: {
        fontSize: 20,
        color: "#fff",
        marginBottom: 10,
    },
    note: {
        marginTop: 20,
        color: "#94a3b8"
    },
});