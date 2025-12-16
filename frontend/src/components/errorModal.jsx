import Modal from "./modal.jsx"

function errorModal({ onClose, message }) {
    return (
        <Modal onClose={onClose}>
            <h2 style={{ color: "#ef4444" }}>WARNING!</h2>
            <p style={{ 
                fontSize: "1.1rem", 
                marginTop: "16px",
                textAlign: "center" 
            }}>
                {message}
            </p>
        </Modal>
    );
}

export default errorModal;
