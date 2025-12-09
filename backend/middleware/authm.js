import jwt from "jsonwebtoken"

// protects api routes by verifying jwt token
export const protect = (req, res, next) => {
    // reads token from authorization header
    const token = req.headers.authorization;

    if(!token){
        return res.status(401).json({message: "Not authorized!"});
    }

    try{
        // verifies token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
    }catch (err){
        res.status(401).json({message: "Invalid token!"});
    }
}