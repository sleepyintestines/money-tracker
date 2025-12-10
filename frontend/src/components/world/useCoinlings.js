import { useState, useEffect } from "react"

export default function useCoinlings(count){
    const [positions, setPositions] = useState([]);

    const fieldWidth = 100;
    const fieldHeight = 100;
    const coinlingSize = 10;

    // initializes position data for each coinling, runs everytime count changes
    useEffect(() => {
        const newPositions = [];
        for(let i = 0; i < count; i++){
            // determines where coinling will start (random)
            const startTop = Math.random() * (fieldHeight - coinlingSize);
            const startleft = Math.random() * (fieldWidth - coinlingSize);
            // determines where coinling should move (random)
            const targetTop = Math.random() * (fieldHeight - coinlingSize);
            const targetLeft = Math.random() * (fieldWidth - coinlingSize);

            newPositions.push({
                top: startTop,
                left: startleft,
                targetTop,
                targetLeft,
                duration: 3 + Math.random() * 2,
                paused: false
            });
        }

        setPositions(newPositions);
    }, [count]);

    // movement logic
    useEffect(() => {
        const intervals = [];

        positions.forEach((_, index) => {
            // run for each coinling, not optimized for > 100 
            const move = () => {
                setPositions((prev) => 
                    prev.map((p, i) => {
                        if(i !== index) return p;
                        
                        // calculates current position and target position using pythagorean theorem
                        const dx = p.targetLeft - p.left;
                        const dy = p.targetTop - p.top;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if(p.dragging || p.paused) return p;

                        // waits before generating a new random target
                        if(distance < 1 && !p.waiting){
                            const waitTime = 5000 + Math.random() * 7000;
                            setTimeout(() => {
                                setPositions((prev) =>
                                    prev.map((ent, idx) =>
                                        idx === i ? {
                                            ...ent,
                                            waiting: false,
                                            targetTop: Math.random() * (fieldHeight - coinlingSize),
                                            targetLeft: Math.random() * (fieldWidth - coinlingSize),
                                            duration: 3 + Math.random() * 2,
                                        } : ent
                                    )
                                );
                            }, waitTime);

                            return  {...p, waiting: true};
                        }

                        // generates movement speed
                        const speed = Math.max(0.2, Math.min(2, distance / 20));
                        const stepX = (dx / distance) * speed;
                        const stepY = (dy / distance) * speed;

                        // keeps coinling inside field
                        return {
                            ...p,
                            top: Math.min(Math.max(p.top + stepY, 0), fieldHeight - coinlingSize),
                            left: Math.min(Math.max(p.left + stepX, 0), fieldWidth - coinlingSize),
                        };
                    })
                );
            };

            // animation
            const delay = Math.random() * 500;
            const interval = setInterval(move, 50 + delay);
            intervals.push(interval);
        });

        // cleanup
        return () => intervals.forEach(clearInterval);
    }, [positions]);

    return{positions, setPositions};
}