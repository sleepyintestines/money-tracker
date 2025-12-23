import { useState, useEffect } from "react"

export default function useResidents(count, playableAreaPercent = 100, playableAreaOffset = 0){
    const [positions, setPositions] = useState([]);
    const residentSize = 5;

    // calculate constraints for movement within accessible area
    const minPos = playableAreaOffset;
    const maxPos = playableAreaOffset + playableAreaPercent;
    const middlePos = playableAreaOffset + (playableAreaPercent / 2);
    
    // minimum distance for target positions 
    const minTravelDistance = Math.max(50, playableAreaPercent * 0.7);

    // helper function to generate a target position with minimum distance requirement
    const generateTarget = (currentLeft, currentTop) => {
        let attempts = 0;
        let targetTop, targetLeft, distance;
        
        do {
            targetTop = minPos + Math.random() * (playableAreaPercent - residentSize);
            targetLeft = minPos + Math.random() * (playableAreaPercent - residentSize);
            
            const dx = targetLeft - currentLeft;
            const dy = targetTop - currentTop;
            distance = Math.sqrt(dx * dx + dy * dy);
            
            attempts++;
        } while (distance < minTravelDistance && attempts < 20);
        
        // determine sprite direction based on which half target is in
        const facingRight = targetLeft > middlePos;
        
        return { targetTop, targetLeft, facingRight };
    };

    // initializes position data for each resident, runs everytime count changes
    useEffect(() => {
        const newPositions = [];
        for(let i = 0; i < count; i++){
            // determines where resident will start (random within accessible area)
            const startTop = minPos + Math.random() * (playableAreaPercent - residentSize);
            const startleft = minPos + Math.random() * (playableAreaPercent - residentSize);
            // determines where resident should move (random within accessible area, with minimum distance)
            const { targetTop, targetLeft, facingRight } = generateTarget(startleft, startTop);

            newPositions.push({
                top: startTop,
                left: startleft,
                targetTop,
                targetLeft,
                facingRight,
                duration: 3 + Math.random() * 2,
                paused: false
            });
        }

        setPositions(newPositions);
    }, [count, playableAreaPercent, playableAreaOffset]);

    // movement logic - only reinitialize when count changes
    useEffect(() => {
        const intervals = [];

        for (let index = 0; index < count; index++) {
            // run for each resident, not optimized for > 100 
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
                                        const { targetTop, targetLeft, facingRight } = generateTarget(ent.left, ent.top);
                                        return {
                                            ...ent,
                                            waiting: false,
                                            targetTop,
                                            targetLeft,
                                            facingRight,
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

                        // keeps resident inside accessible area
                        return {
                            ...p,
                            top: Math.min(Math.max(p.top + stepY, minPos), maxPos - residentSize),
                            left: Math.min(Math.max(p.left + stepX, minPos), maxPos - residentSize),
                        };
                    })
                );
            };

            // animation
            const delay = Math.random() * 500;
            const interval = setInterval(move, 50 + delay);
            intervals.push(interval);
        }

        // cleanup
        return () => intervals.forEach(clearInterval);
    }, [count, minPos, maxPos, playableAreaPercent, residentSize]);

    return{positions, setPositions};
}