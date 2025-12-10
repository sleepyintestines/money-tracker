const nameParts = [
    "Shower",
    "Heirophant",
    "Grass",
    "Golden",
    "Cafe",
    "Grand",
    "Thief",
    "Toilet",
    "Garbage Bin",
    "Marvelous",
    "Spoon",
    "Falcon",
    "Shuttle",
    "Fine",
    "King",
    "Thunder",
    "Comet",
    "Meteor",
    "Midnight",
    "Forest",
    "Bad Dream",
    "Whisper",
    "Biscuit",
    "Sea",
    "Arrow",
    "Mercury",
    "Spirit",
    "Hermit",
    "Cross",
    "Bourbon",
    "Sword",
    "Cumulonimbus",
    "Clandestine",
    "Pernicious",
    "Angel",
    "Fortress",
    "Blue Coat",
    "Raisin",
    "Deodarant",
    "Super",
    "Week",
    "Silent",
    "Helios",
    "Fool"
];

// get random word  
export function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 90% chance to generate a two word name
export function randomName(twoWordChance = 0.9) {
    const useTwoWords = Math.random() < twoWordChance;

    const first = randomFrom(nameParts);
    const second = randomFrom(nameParts);

    if (useTwoWords) {
        return `${first} ${second}`;
    }

    return first;
}