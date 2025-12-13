export function getSprite(rarity){
    const spriteOptions = {
        common: [
            "/sprites/coinling-sprites/common/common.png",
        ],
        rare: [
            "/sprites/coinling-sprites/rare/rare.png",
            "/sprites/coinling-sprites/rare/rare2.png",
            "/sprites/coinling-sprites/rare/rare3.png",
            "/sprites/coinling-sprites/rare/rare4.png",
            "/sprites/coinling-sprites/rare/rare5.png",
        ],
        legendary: [
            "/sprites/coinling-sprites/legendary/legendary.png",
        ]
    };

    const options = spriteOptions[rarity];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}