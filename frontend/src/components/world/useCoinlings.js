import { useState, useEffect } from "react"

export default function useCoinlings(count, playableAreaPercent = 100, playableAreaOffset = 0){
    const [positions, setPositions] = useState([]);
    const coinlingSize = 10;

    // calculate constraints for movement within accessible area
    const minPos = playableAreaOffset;
    const maxPos = playableAreaOffset + playableAreaPercent;
    
    // minimum distance for target positions (scales with playable area, but has a floor)
    const minTravelDistance = Math.max(15, playableAreaPercent * 0.2);

    // helper function to generate a target position with minimum distance requirement
    const generateTarget = (currentLeft, currentTop) => {
        let attempts = 0;
        let targetTop, targetLeft, distance;
        
        do {
            targetTop = minPos + Math.random() * (playableAreaPercent - coinlingSize);
            targetLeft = minPos + Math.random() * (playableAreaPercent - coinlingSize);
            
            const dx = targetLeft - currentLeft;
            const dy = targetTop - currentTop;
            distance = Math.sqrt(dx * dx + dy * dy);
            
            attempts++;
        } while (distance < minTravelDistance && attempts < 20);
        
        return { targetTop, targetLeft };
    };

    // initializes position data for each coinling, runs everytime count changes
    useEffect(() => {
        const newPositions = [];
        for(let i = 0; i < count; i++){
            // determines where coinling will start (random within accessible area)
            const startTop = minPos + Math.random() * (playableAreaPercent - coinlingSize);
            const startleft = minPos + Math.random() * (playableAreaPercent - coinlingSize);
            // determines where coinling should move (random within accessible area, with minimum distance)
            const { targetTop, targetLeft } = generateTarget(startleft, startTop);

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
    }, [count, playableAreaPercent, playableAreaOffset]);

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

                        // reached target thn wait before generating a new random target
                        if(distance < 0.5 && !p.waiting){
                            const waitTime = 5000 + Math.random() * 7000;
                            setTimeout(() => {
                                setPositions((prev) =>
                                    prev.map((ent, idx) => {
                                        if (idx !== i) return ent;
                                        const { targetTop, targetLeft } = generateTarget(ent.left, ent.top);
                                        return {
                                            ...ent,
                                            waiting: false,
                                            targetTop,
                                            targetLeft,
                                            duration: 3 + Math.random() * 2,
                                        };
                                    })
                                );
                            }, waitTime);

                            return  {...p, waiting: true};
                        }

                        // stop moving when very close to prevent sliding
                        if(distance < 0.5) {
                            return p;
                        }

                        // generates movement speed
                        const speed = Math.max(0.2, Math.min(2, distance / 20));
                        const stepX = (dx / distance) * speed;
                        const stepY = (dy / distance) * speed;

                        // keeps coinling inside accessible area
                        return {
                            ...p,
                            top: Math.min(Math.max(p.top + stepY, minPos), maxPos - coinlingSize),
                            left: Math.min(Math.max(p.left + stepX, minPos), maxPos - coinlingSize),
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
    }, [positions, minPos, maxPos, playableAreaPercent, coinlingSize]);

    return{positions, setPositions};
}