import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    // 從 header 取得 token
    const authHeader = req.get('Authorization');
    console.log('收到的 Authorization header:', authHeader); 

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authorization header 格式不正確');
      return res.status(401).json({
        success: false,
        message: '未提供認證令牌'
      });
    }

    // 解析 token
    const token = authHeader.split(' ')[1];
    console.log('解析出的 token:', token); // 檢查解析出的 token
    console.log('JWT_KEY 是否存在:', !!process.env.JWT_KEY);
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    console.log('解碼後的資料:', decoded);

    // 將解析後的用戶資訊附加到 request 物件
    req.auth = {
      user_id: decoded.user_id,
      user_full_name: decoded.user_full_name,
      role_id: decoded.role_id,
      iat: decoded.iat
    };
 
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '認證令牌已過期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '無效的認證令牌'
      });
    }

    console.error('認證中間件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

export default authMiddleware;