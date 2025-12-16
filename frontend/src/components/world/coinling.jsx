import { useState, useEffect, useRef, forwardRef } from "react"

const coinling = forwardRef(function Coinling({ coinling, position, onMove, onDragEnd, onClick, canDrag = true, playableAreaPercent = 100, playableAreaOffset = 0}, ref){
    const internalRef = useRef(null);

    const setRef = (el) => {
        internalRef.current = el;
        if (ref) ref(el);
    };
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({x: 0, y: 0});

    const {top, left, targetTop, targetLeft, duration} = position;
    const isMoving = Math.abs(left - targetLeft) > 0.5 || Math.abs(top - targetTop) > 0.5;

    const hasMovedRef = useRef(false);
    const suppressClickRef = useRef(false);

    const { paused } = position;

    // handles when coinling is clicked 
    const handleMouseDown = (e) => {
        // prevents drag if zoomed in (if canDrag = false then is zoomed in)
        if (!canDrag) return;

        e.stopPropagation();
        e.preventDefault();
        
        const rect = internalRef.current.getBoundingClientRect();

        // match the location of the mouse when dragging
        setOffset({x: e.clientX - rect.left, y: e.clientY - rect.top});
        setDragging(true);

        hasMovedRef.current = false;
        suppressClickRef.current = false;
    }

    // logic for dragging and dropping coinlings
    useEffect(() => {
        const handleMouseMove = (e) => {
            if(!dragging) return;

            hasMovedRef.current = true;

            // keeps coinling draggable inside field boundaries only
            const field = document.querySelector(".field");
            if(!field) return;

            const rect = field.getBoundingClientRect();

            const mouseX = (e.clientX - rect.left - offset.x) / rect.width;
            const mouseY = (e.clientY - rect.top - offset.y) / rect.height;

            const newLeftPercent = mouseX * 100;
            const newTopPercent = mouseY * 100;

            // allow free dragging without constraints
            onMove(newLeftPercent, newTopPercent);
        };

        // drop coinling
        const handleMouseUp = () => {
            if(dragging){
                const moved = !!hasMovedRef.current;

                setDragging(false);

                // snap back to playable area if dropped outside
                if (moved) {
                    const minPos = playableAreaOffset;
                    const maxPos = playableAreaOffset + playableAreaPercent;
                    
                    const constrainedLeft = Math.min(Math.max(left, minPos), maxPos);
                    const constrainedTop = Math.min(Math.max(top, minPos), maxPos);

                    // if outside playable area, snap back
                    if (left !== constrainedLeft || top !== constrainedTop) {
                        onMove(constrainedLeft, constrainedTop);
                    }

                    suppressClickRef.current = true;
                }

                hasMovedRef.current = false;
                onDragEnd?.(moved);
            }
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, offset, onMove, onDragEnd, playableAreaPercent, playableAreaOffset]);

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                onClick?.(e);
            }}
            style={{
                top: `${top}%`,
                left: `${left}%`,
                transition: dragging || paused ? "none" : `top ${duration}s linear, left ${duration}s linear`,
                position: "absolute",
                cursor: canDrag ? "grab" : "default",
                pointerEvents: "auto",
                transform: dragging ? "scale(1.25)" : "scale(1)",
                transformOrigin: "center bottom",
            }}
        >
            <img
                ref={setRef}
                src={coinling.sprite}
                alt="coinling"
                className={`coinling ${isMoving ? "coinling-moving" : ""}`}
                style={{
                    position: "relative",
                    width: "auto",
                    height: "auto",
                    transformOrigin: "center bottom",
                }}
                draggable={false}
            />
        </div>
    );
});

export default coinling;