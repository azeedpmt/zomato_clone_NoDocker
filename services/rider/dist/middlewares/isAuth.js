import jwt from 'jsonwebtoken';
export const isAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Please Login - No auth header",
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({
                message: "Please Login - Token missing",
            });
            return;
        }
        const decodedValue = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodedValue || !decodedValue.user) {
            res.status(401).json({
                message: "Invalid token",
            });
            return;
        }
        req.user = {
            ...decodedValue.user,
            _id: decodedValue.user._id.toString() // Convert to string
        };
        next();
    }
    catch (error) {
        res.status(500).json({
            message: "Please Login - Jwt error",
        });
    }
};
export const isSeller = async (req, res, next) => {
    const user = req.user;
    if (user && user.role !== "seller") {
        res.status(401).json({
            message: "you are not authorized seller"
        });
        return;
    }
    next();
};
