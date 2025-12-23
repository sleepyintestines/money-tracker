export function getSprite(rarity){
    const spriteOptions = {
        common: [
            "/sprites/resident-sprites/common/common1.png",
            "/sprites/resident-sprites/common/common2.png",
        ],
        rare: [
            "/sprites/resident-sprites/rare/rare1.png",
            "/sprites/resident-sprites/rare/rare2.png",
            "/sprites/resident-sprites/rare/rare3.png",
        ],
        legendary: [
            "/sprites/resident-sprites/legendary/legendary1.png",
            "/sprites/resident-sprites/legendary/legendary2.png",
        ]
    };

    const options = spriteOptions[rarity];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}