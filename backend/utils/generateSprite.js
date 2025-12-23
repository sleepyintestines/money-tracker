export function getSprite(rarity){
    const spriteOptions = {
        common: [
            "/sprites/resident-sprites/common/common1.png",
        ],
        rare: [
            "/sprites/resident-sprites/rare/rare1.png",
            "/sprites/resident-sprites/rare/rare2.png",
            "/sprites/resident-sprites/rare/rare3.png",
            "/sprites/resident-sprites/rare/rare4.png",
            "/sprites/resident-sprites/rare/rare5.png",
            "/sprites/resident-sprites/rare/rare6.png",
            "/sprites/resident-sprites/rare/rare7.png",
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