import { Audio } from 'expo-av';

const SOUNDS = {
    SUCCESS: require('../../assets/sounds/success.wav'),
    POP: require('../../assets/sounds/pop.wav'),
};

// NOTE: Local assets integrated successfully.


class SoundService {
    static async playSound(soundKey) {
        if (!SOUNDS[soundKey]) {
            return;
        }
        try {
            const { sound } = await Audio.Sound.createAsync(SOUNDS[soundKey]);
            await sound.playAsync();
            // Automatically unload after playing to free up memory
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }

    static async playSuccess() {
        return this.playSound('SUCCESS');
    }

    static async playPop() {
        return this.playSound('POP');
    }
}

export default SoundService;
