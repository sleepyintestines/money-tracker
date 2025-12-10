export const personalityDialogues = {
    cheerful: [
        "What a wonderful day!",
        "Hey there, buddy! Got any spare change?",
        "I love meeting new people!",
    ],
    grumpy: [
        "Hmph. Don't bother me.",
        "Back off. I'm busy counting coins.",
        "You again? Fine.",
    ],
    mysterious: [
        "The moon told me secrets last night...",
        "Not everything is as it seems.",
        "Are you listening closely?",
    ],
    shy: [
        "Oh—hello.",
        "Um... do you like collecting coins too?",
        "I don't talk much, but... hi.",
    ],
    talkative: [
        "Did you hear about the market today? So much happened!",
        "I can tell you stories all day!",
        "Let me tell you about my favorite coin...",
    ],
};

export function randomPersonality() {
    const keys = Object.keys(personalityDialogues);
    return keys[Math.floor(Math.random() * keys.length)];
}

export function dialoguesFor(personality) {
    return (personalityDialogues[personality] || []).slice();
}