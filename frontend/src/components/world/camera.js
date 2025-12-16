import { useState, useEffect } from "react"

// manages camera movement
export function Camera(disabled = false){
    // store viewport dimensions in state so they can be updated on window resize
    const [dimensions, setDimensions] = useState({
        VIEW_WIDTH: window.innerWidth,
        VIEW_HEIGHT: window.innerHeight,
    });

    const VIEW_WIDTH = dimensions.VIEW_WIDTH;
    const VIEW_HEIGHT = dimensions.VIEW_HEIGHT;

    // 3 times bigger than the screen
    const WORLD_WIDTH = VIEW_WIDTH * 3; 
    const WORLD_HEIGHT = VIEW_HEIGHT * 3; 

    // zoom limits
    const MIN_SCALE = Math.min(VIEW_WIDTH / WORLD_WIDTH, VIEW_HEIGHT / WORLD_HEIGHT);
    const MAX_SCALE = 1;

    // camera state, starts fully zoomed out
    const [camera, setCamera] = useState({
        x: (VIEW_WIDTH - WORLD_WIDTH * MIN_SCALE) / 2, 
        y: (VIEW_HEIGHT - WORLD_HEIGHT * MIN_SCALE) / 2,
        scale: MIN_SCALE,
    });

    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({x: 0, y: 0});
    const [lastWheel, setLastWheel] = useState(0);

    // handles zoom in/out logic
    const handleWheel = (e) => {
        e.preventDefault();
        setLastWheel(Date.now());
        setCamera((prev) => {
            // calculates new zoom
            const zoomIntensity = 0.0015;
            let newScale = prev.scale - e.deltaY * zoomIntensity;
            newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

            if (newScale === prev.scale) return prev;

            if (newScale <= MIN_SCALE + 0.001) {
                // when fully zoomed out, center world
                const centeredX = (VIEW_WIDTH - WORLD_WIDTH * newScale) / 2;
                const centeredY = (VIEW_HEIGHT - WORLD_HEIGHT * newScale) / 2;
                return {...prev, scale: newScale, x: centeredX, y: centeredY};
            }

            // zoom around viewport center
            const rect = {cx: VIEW_WIDTH / 2, cy: VIEW_HEIGHT / 2};
            const scaleRatio = newScale / prev.scale;
            const newX = rect.cx - (rect.cx - prev.x) * scaleRatio;
            const newY = rect.cy - (rect.cy - prev.y) * scaleRatio;

            const minX = -(WORLD_WIDTH * newScale - VIEW_WIDTH);
            const minY = -(WORLD_HEIGHT * newScale - VIEW_HEIGHT);
            const maxX = 0;
            const maxY = 0;

            return {
                ...prev,
                scale: newScale,
                // keep camera inside world bounds
                x: Math.min(maxX, Math.max(newX, minX)),
                y: Math.min(maxY, Math.max(newY, minY)),
            };
        });
    };

    // handles drag logic (clicking)
    const handleCameraDown = (e) => {
        // prevents drag when fully zoomed out
        if(camera.scale <= MIN_SCALE + 0.001) return;
        
        setIsDragging(true);
        setLastMousePos({x: e.clientX, y: e.clientY});
    }

    // handles drag logic (moving mouse)
    const handleCameraMove = (e) => {
        if(!isDragging) return;

        setCamera((prev) => {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;

            const minX = -(WORLD_WIDTH * prev.scale - VIEW_WIDTH);
            const minY = -(WORLD_HEIGHT * prev.scale - VIEW_HEIGHT);
            const maxX = 0;
            const maxY = 0;

            const newX = Math.min(maxX, Math.max(prev.x + dx, minX));
            const newY = Math.min(maxY, Math.max(prev.y + dy, minY));

            return{...prev, x: newX, y: newY};
        });

        setLastMousePos({x: e.clientX, y: e.clientY});
    }

    const handleCameraUp = () => setIsDragging(false);

    // listen for window resize events and recalculate dimensions to maintain responsiveness
    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                VIEW_WIDTH: window.innerWidth,
                VIEW_HEIGHT: window.innerHeight,
            });
        };
        
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // listen for mouse wheel events to handle zoom
    useEffect(() => {
        if (disabled) return;
        window.addEventListener("wheel", handleWheel, {passive: false});
        return () => window.removeEventListener("wheel", handleWheel);
    }, [disabled]);

    return{
        camera, 
        MIN_SCALE,
        lastWheel,
        handleCameraDown,
        handleCameraMove,
        handleCameraUp
    }
}