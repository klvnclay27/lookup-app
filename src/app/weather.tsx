import { View, Text, StyleSheet } from "react-native";

export default function WeatherScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🌤️ Weather Details</Text>

            <Text style={styles.info}>Temperature: 74°F</Text>
            <Text style={styles.info}>Condition: Sunny</Text>
            <Text style={styles.info}>Feels Like: 76°F</Text>

            <Text style={styles.note}>
                Hourly forecast coming soon...
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
        marginBottom: 24,
    },
    info: {
        fontSize: 20,
        color: "white",
        marginBottom: 12,
    },
    note: {
        fontSize: 16,
        color: "#9CA3AF",
        marginTop: 20,
    },
});