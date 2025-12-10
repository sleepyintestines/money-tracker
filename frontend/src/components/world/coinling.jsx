import { useState, useEffect, useRef, forwardRef } from "react"

const coinling = forwardRef(function Coinling({ position, onMove, onDragEnd, onClick, canDrag = true}, ref){
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

            onMove(mouseX * 100, mouseY * 100);
        };

        // drop coinling
        const handleMouseUp = () => {
            if(dragging){
                const moved = !!hasMovedRef.current;

                setDragging(false);
                onDragEnd?.();

                if (moved) {
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
    }, [dragging, offset, onMove, onDragEnd]);

    return (
        <img
            ref={setRef}
            src="/sprites/coinling.png"
            alt="coinling"
            className={`coinling ${isMoving ? "coinling-moving" : ""}`}
            style={{
                top: `${top}%`,
                left: `${left}%`,
                transition: dragging || paused
                    ? "none"
                    : `top ${duration}s linear, left ${duration}s linear`,
                position: "absolute",
                cursor: canDrag ? "grab" : "default",
                pointerEvents: "auto",
            }}
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
            draggable={false}
        />
    );
});

export default coinling;