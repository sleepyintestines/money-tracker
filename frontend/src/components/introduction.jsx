import Modal from "./modal.jsx"

import "../css/modal.css"

export default function ({ onClose }){
    return(
        <Modal onClose={onClose} showCloseButton={false}>
            <div 
                style={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                    padding: "10px 20px"
                }} 
                onWheel={(e) => e.stopPropagation()}
            >
                <h2 style={{
                    color: "#4f3fcc",
                    marginTop: 0,
                    fontSize: "2rem",
                    textAlign: "center"
                }}>
                    Welcome to COINLINGS!
                </h2>

                <p style={{
                    fontSize: "1.1rem",
                    lineHeight: "1.6",
                    marginBottom: "20px"
                }}>
                    A <strong>gacha-inspired savings tracker</strong> that makes managing your money fun and engaging! 
                    Watch your balance grow as adorable creatures called <strong>COINLINGS</strong> populate your world.
                </p>

                <h3 style={{color: "#4f3fcc", fontSize: "1.5rem"}}>
                    Core Concept
                </h3>
                <p style={{lineHeight: "1.6", marginBottom: "20px"}}>
                    Every <strong>₱1,000</strong> in your balance creates a new COINLING! They live in houses scattered 
                    across your overworld, each with unique sprites, names, personalities, and dialogues. As you save more, 
                    your world becomes more lively! 
                    <br></br>
                    <br></br>

                    <strong>THOUGH BE AWARE!</strong> 
                    subtracting money from your balance will kill a random COINLING, so think before you spend!
                </p>

                <h3 style={{color: "#4f3fcc", fontSize: "1.5rem"}}>
                    Key Features
                </h3>

                <div style={{marginBottom: "15px"}}>
                    <h4 style={{color: "#333", fontSize: "1.2rem", marginBottom: "5px"}}>
                        Transaction Management
                    </h4>
                    <ul style={{lineHeight: "1.8", marginTop: "5px"}}>
                        <li><strong>Add Money:</strong> Record income and watch new COINLINGS spawn</li>
                        <li><strong>Subtract Money:</strong> Track expenses and mark if purchases were "worth it"</li>
                        <li><strong>Categories:</strong> Organize transactions with custom or default categories</li>
                        <li><strong>Notes:</strong> Add context to every transaction</li>
                    </ul>
                </div>

                <div style={{marginBottom: "15px"}}>
                    <h4 style={{color: "#333", fontSize: "1.2rem", marginBottom: "5px"}}>
                        House System
                    </h4>
                    <ul style={{lineHeight: "1.8", marginTop: "5px"}}>
                        <li><strong>Create Houses:</strong> COINLINGS automatically populate houses as they spawn</li>
                        <li><strong>Merge Houses:</strong> Combine two full houses of the same capacity to double their size (2→4→8→16→32→64→128)</li>
                        <li><strong>Drag & Drop:</strong> Move houses around your overworld to organize your world</li>
                        <li><strong>Delete Mode:</strong> Remove empty houses when needed</li>
                    </ul>
                </div>

                <div style={{marginBottom: "15px"}}>
                    <h4 style={{color: "#333", fontSize: "1.2rem", marginBottom: "5px"}}>
                         COINLING Interactions
                    </h4>
                    <ul style={{lineHeight: "1.8", marginTop: "5px"}}>
                        <li><strong>Click to Talk:</strong> Each COINLING has unique dialogues based on their personality</li>
                        <li><strong>Drag COINLINGS:</strong> Move them between houses (respecting capacity limits)</li>
                        <li><strong>Click Name to Rename:</strong> Give your COINLINGS custom names</li>
                        <li><strong>Rarity System:</strong> Common, Rare, and Legendary COINLINGS with different sprites</li>
                        <li><strong>Automatic Movement:</strong> Watch them wander around their house area</li>
                    </ul>
                </div>

                <div style={{marginBottom: "15px"}}>
                    <h4 style={{color: "#333", fontSize: "1.2rem", marginBottom: "5px"}}>
                        Analytics & History
                    </h4>
                    <ul style={{lineHeight: "1.8", marginTop: "5px"}}>
                        <li><strong>History View:</strong> Browse all transactions with detailed information</li>
                        <li><strong>Analytics Dashboard:</strong> View spending patterns, weekly/monthly summaries, and lifetime totals</li>
                        <li><strong>Category Breakdown:</strong> See spending distribution across categories</li>
                    </ul>
                </div>

                <div style={{marginBottom: "15px"}}>
                    <h4 style={{color: "#333", fontSize: "1.2rem", marginBottom: "5px"}}>
                        Visual Features
                    </h4>
                    <ul style={{lineHeight: "1.8", marginTop: "5px"}}>
                        <li><strong>Interactive Overworld (via Scroll Wheel):</strong> Pan and zoom with camera controls</li>
                        <li><strong>Sprite Collection:</strong> Collect different COINLING designs</li>
                        <li><strong>Journal:</strong> Browse your complete COINLING collection</li>
                        <li><strong>Death/Birth Notifications:</strong> See which COINLINGS are affected when your balance changes</li>
                    </ul>
                </div>

                <p style={{
                    textAlign: "center",
                    fontSize: "1.1rem",
                    color: "#666",
                    fontStyle: "italic",
                    marginTop: "30px"
                }}>
                   ! THIS IS STILL A PROTOTYPE !
                </p>

                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px"
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 40px",
                            fontSize: "1rem",
                            backgroundColor: "#4f3fcc",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        Get Started!
                    </button>
                </div>
            </div>
        </Modal>    
    );
}