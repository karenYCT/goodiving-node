import db from "../utils/connect-sql.js";
const router = express.Router();
import moment from "moment-timezone";
import express from "express";

// 讀取列表及篩選資料
router.get("/", async (req, res) => {
  res.locals.title = "goodiving - " + res.locals.title;
  res.locals.pageName = "搜尋課程";
  const perPage = 10; // 每頁最多顯示幾筆
  let page = parseInt(req.query.page) || 1;

  // 取得篩選與排序參數
  const { loc, date, type, dept, exp, gender, sort } = req.query;
  const params = [];

  // 主查詢
  let sql = `
    SELECT lr.round_id, lr.lesson_id, lr.coach_id, lr.lesson_loc_id, lr.round_start, lr.round_end, lr.round_price, lr.round_quota, l.lesson_name, l.lesson_name_zh, l.lesson_img_a, c.coach_name, c.coach_sex, c.coach_img, c.coach_rate, c.coach_exp, lt.lesson_type, cd.cert_dept, ll.lesson_loc
    FROM lesson_round lr
    JOIN lesson l ON lr.lesson_id = l.lesson_id
    JOIN coach c ON lr.coach_id = c.coach_id
    JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
    JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
    JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
    WHERE 1=1
  `;

  // 加入篩選條件
  if (loc) {
    sql += " AND lr.lesson_loc_id = ?";
    params.push(loc);
  }

  if (date) {
    sql += " AND lr.round_start >= ?";
    params.push(date);
  }

  if (type) {
    sql += " AND l.lesson_type_id = ?";
    params.push(type);
  }

  if (dept) {
    if (Array.isArray(dept)) {
      sql += ` AND l.cert_dept_id IN (${dept.map(() => "?").join(", ")})`;
      params.push(...dept);
    } else {
      sql += " AND l.cert_dept_id = ?";
      params.push(dept);
    }
  }

  if (exp) {
    if (Array.isArray(exp)) {
      sql += ` AND c.coach_exp IN (${exp.map(() => "?").join(", ")})`;
      params.push(...exp);
    } else {
      sql += " AND c.coach_exp >= ?";
      params.push(exp);
    }
  }

  if (gender) {
    if (Array.isArray(gender)) {
      sql += ` AND c.coach_sex IN (${gender.map(() => "?").join(", ")})`;
      params.push(...gender);
    } else {
      sql += " AND c.coach_sex = ?";
      params.push(gender);
    }
  }

  // 加入排序條件
  if (sort) {
    if (sort === "date_asc") {
      sql += " ORDER BY lr.round_start ASC";
    } else if (sort === "date_desc") {
      sql += " ORDER BY lr.round_start DESC";
    } else if (sort === "price_asc") {
      sql += " ORDER BY lr.round_price ASC";
    } else if (sort === "price_desc") {
      sql += " ORDER BY lr.round_price DESC";
    } else if (sort === "rate_asc") {
      sql += " ORDER BY c.coach_rate ASC";
    } else if (sort === "rate_desc") {
      sql += " ORDER BY c.coach_rate DESC";
    }
  } else {
    sql += " ORDER BY lr.round_start ASC"; // 預設按日期升序排序
  }

  // 加入分頁條件
  sql += ` LIMIT ${(page - 1) * perPage}, ${perPage}`;

  try {
    // 計算符合條件的總筆數
    const countSql =
      `
      SELECT COUNT(1) AS totalRows 
      FROM lesson_round lr
      JOIN lesson l ON lr.lesson_id = l.lesson_id
      JOIN coach c ON lr.coach_id = c.coach_id
      JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
      JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
      JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
      WHERE 1=1
    ` + sql.slice(sql.indexOf("AND"), sql.indexOf("ORDER BY")); // 重用篩選條件

    const [[{ totalRows }]] = await db.query(countSql, params);
    const totalPages = Math.ceil(totalRows / perPage);

    // 查詢符合條件的資料
    const [rows] = await db.query(sql, params);

    rows.forEach((el) => {
      const s = moment(el.round_start);
      el.round_start = s.isValid() ? s.format("YYYY/MM/DD") : "";
      const e = moment(el.round_end);
      el.round_end = e.isValid() ? e.format("YYYY/MM/DD") : "";
    });

    res.json({ totalRows, totalPages, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "內部伺服器錯誤" });
  }
});

// 讀取單筆資料
// router.get("/:round_id", async (req, res) => {
//   const output = {
//     success: false,
//     data: {},
//     error: "",
//   };
//   let round_id = parseInt(req.params.round_id) || 0;
//   if (!round_id) {
//     output.error = "沒有此資料的主鍵";
//     return res.json(output);
//   }
//   const sql = `
//     SELECT lr.round_id, lr.lesson_id, lr.coach_id, lr.lesson_loc_id, lr.round_start, lr.round_end, lr.round_price, lr.round_quota, l.lesson_name, l.lesson_name_zh, l.lesson_intro, l.lesson_group, l.lesson_content, l.lesson_process, l.lesson_contain, l.lesson_notice, l.lesson_img_a, l.lesson_img_b, l.lesson_img_c, l.lesson_img_d, l.lesson_img_e, c.coach_name, c.coach_img, c.coach_intro, c.coach_rate, c.coach_exp, lt.lesson_type, cd.cert_dept, ll.lesson_loc, cert.cert_dept, cert.cert_name
//     FROM lesson_round lr
//     JOIN lesson l ON lr.lesson_id = l.lesson_id
//     JOIN coach c ON lr.coach_id = c.coach_id
//     JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
//     JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
//     JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
//     JOIN cert_ref cr ON c.coach_id = cr.coach_id
//     JOIN cert ON cr.cert_id = cert.cert_id
//     WHERE round_id = ${round_id} `;
//   const [rows] = await db.query(sql);

//   // 利用資料長度來判斷有沒有拿到資料
//   if (!rows.length) {
//     output.error = "沒有此筆資料項目";
//     return res.json(output);
//   }
//   const row = rows[0];

//   // 如果日期為有效資料則利用moment改格式, 不然設成空字串
//   const s = moment(row.round_start);
//   if (s.isValid()) {
//     row.round_start = s.format("YYYY/MM/DD");
//   } else {
//     row.round_start = "";
//   }
//   const e = moment(row.round_end);
//   if (e.isValid()) {
//     row.round_end = e.format("YYYY/MM/DD");
//   } else {
//     row.round_end = "";
//   }

//   output.data = row;
//   output.success = true;
//   res.json(output);
// });

// 讀取單筆資料
router.get("/:round_id", async (req, res) => {
  const { round_id } = req.params;
  try {
    // 查詢產品基本資料
    const sql = `
    SELECT lr.round_id, lr.lesson_id, lr.coach_id, lr.lesson_loc_id, lr.round_start, lr.round_end, lr.round_price, lr.round_quota, l.lesson_name, l.lesson_name_zh, l.lesson_intro, l.lesson_group, l.lesson_content, l.lesson_process, l.lesson_contain, l.lesson_notice, l.lesson_img_a, l.lesson_img_b, l.lesson_img_c, l.lesson_img_d, l.lesson_img_e, c.coach_name, c.coach_img, c.coach_intro, c.coach_rate, c.coach_exp, lt.lesson_type, cd.cert_dept, ll.lesson_loc
    FROM lesson_round lr
    JOIN lesson l ON lr.lesson_id = l.lesson_id
    JOIN coach c ON lr.coach_id = c.coach_id
    JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
    JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
    JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
    WHERE round_id = ${round_id}`;
    const [rows] = await db.query(sql, [round_id]);

    // 如果日期為有效資料則利用moment改格式, 不然設成空字串
    rows.forEach((el) => {
      const s = moment(el.round_start);
      el.round_start = s.isValid() ? s.format("YYYY/MM/DD") : "";
      const e = moment(el.round_end);
      el.round_end = e.isValid() ? e.format("YYYY/MM/DD") : "";
    });

    res.json(Object.assign({}, ...rows));
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "內部伺服器錯誤" });
  }
});

// 新增課程預約訂單
router.post("/:round_id/booking/step", async (req, res) => {
  try {
    const { round_id, user_id, order_point, order_price } = req.body;

    // 驗證必要欄位
    if (!round_id || !user_id || !order_point || !order_price) {
      return res.status(400).json({
        success: false,
        message: "缺少必要欄位",
        received: req.body,
      });
    }

    // 檢查數值是否合法
    if (isNaN(order_point) || isNaN(order_price)) {
      return res.status(400).json({
        success: false,
        message: "order_point 或 order_price 值無效",
      });
    }

    const order_num = new Date().getTime(); // 使用 new Date().getTime()生成 order_num, 亦可用 Date.now()
    // console.log("order_num:", Date.now());

    const sql = `
      INSERT INTO lesson_order SET ?`;

    const data = {
      round_id,
      user_id,
      order_num,
      order_point,
      order_price,
    };
    console.log("data:", data);

    const [result] = await db.query(sql, [data]);

    if (result.affectedRows > 0) {
      return res.status(201).json({
        success: true,
        message: "訂單建立成功",
        orderId: result.insertId,
        order_num: order_num,
      });
    } else {
      throw new Error("訂單建立失敗");
    }
  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// 修改付款(選擇付款方式)
// router.put("/:round_id/booking/step", async (req, res) => {
//   try {
//     const { order_id } = req.params;
//     const { payment_method } = req.body;

//     // 驗證付款方式
//     if (
//       !payment_method ||
//       !["LINE_PAY", "CREDIT_CARD"].includes(payment_method)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "付款方式無效",
//       });
//     }

//     const sql = `
//       UPDATE lesson_order
//       SET order_payment = ?
//       WHERE order_id = ?
//     `;

//     const [result] = await db.query(sql, [payment_method, order_id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "查無此訂單",
//       });
//     }

//     return res.json({
//       success: true,
//       message: "選擇付款方式成功",
//       payment_method: payment_method,
//     });
//   } catch (error) {
//     console.error("更新付款方式時發生錯誤:", error);
//     return res.status(500).json({
//       success: false,
//       message: "內部伺服器錯誤",
//       error: error.message,
//     });
//   }
// });

// 讀取課程訂單(完成頁)
router.get("/:round_id/booking/complete", async (req, res) => {
  try {
    const { round_id } = req.params;
    const { order_id } = req.query; // 從查詢字串獲取 order_id

    // 確保有提供 order_id
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "缺少訂單編號",
      });
    }

    const sql = `
      SELECT 
        lo.order_id,
        lo.order_num,
        lo.order_price,
        lo.created_at,
        u.user_id,
        lr.round_start,
        lr.round_end,
        l.lesson_name,
        l.lesson_img_a,
        c.coach_name,
        c.coach_img,
        ll.lesson_loc,
        cd.cert_dept
      FROM lesson_order lo
      LEFT JOIN user u ON lo.user_id = u.user_id
      LEFT JOIN lesson_round lr ON lo.round_id = lr.round_id
      LEFT JOIN lesson l ON lr.lesson_id = l.lesson_id
      LEFT JOIN coach c ON lr.coach_id = c.coach_id
      LEFT JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
      LEFT JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
      WHERE lo.order_id = ? 
      AND lo.round_id = ?`;

    const [rows] = await db.query(sql, [order_id, round_id]);

    // 如果日期為有效資料則利用moment改格式, 不然設成空字串
    rows.forEach((el) => {
      const s = moment(el.round_start);
      el.round_start = s.isValid() ? s.format("YYYY/MM/DD") : "";
      const e = moment(el.round_end);
      el.round_end = e.isValid() ? e.format("YYYY/MM/DD") : "";
    });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "找不到此訂單",
      });
    }

    const orderData = rows[0];

    // 格式化回傳的資料
    const responseData = {
      order: {
        id: orderData.order_id,
        order_num: orderData.order_num,
        order_price: orderData.order_price,
        created_at: orderData.created_at,
      },
      lesson: {
        coach_img: orderData.coach_img,
        lesson_img: orderData.lesson_img_a,
        dept: orderData.cert_dept,
        name: orderData.lesson_name,
        coach: orderData.coach_name,
        loc: orderData.lesson_loc,
        start: orderData.round_start,
        end: orderData.round_end,
      },
      user: {
        id: orderData.user_id,
      },
    };

    return res.status(200).json({
      success: true,
      message: "成功獲取訂單完成資訊",
      data: responseData,
    });
  } catch (error) {
    console.error("Order complete page query error:", error);
    return res.status(500).json({
      success: false,
      message: "伺服器內部錯誤",
      error: error.message,
    });
  }
});

export default router;
