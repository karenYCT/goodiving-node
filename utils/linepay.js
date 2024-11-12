import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// 生成 nonce 和 簽名
export function generateSignature(uriPath, requestBody) {
  const nonce = uuidv4(); // 每次生成新的 nonce
  const requestBodyString = JSON.stringify(requestBody);
  const rawSignature = `${process.env.channel_secret}${uriPath}${requestBodyString}${nonce}`;
  const signature = crypto
    .createHmac("sha256", process.env.channel_secret)
    .update(rawSignature)
    .digest("base64");

  return { nonce, signature };
}
