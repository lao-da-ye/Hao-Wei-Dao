const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = 'orders.json';

// 从文件加载订单
let orders = [];
if (fs.existsSync(DATA_FILE)) {
  const raw = fs.readFileSync(DATA_FILE);
  orders = JSON.parse(raw);
}

// 保存到文件的函数
function saveOrders() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

// 订单提交接口
app.post('/submitOrder', (req, res) => {
  const order = req.body;

  if (!order.name || !order.phone || !order.cart || !Array.isArray(order.cart) || order.cart.length === 0) {
    return res.json({ success: false, message: 'Missing information or shopping cart' });
  }

  order.total = order.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  order.status = 'pending';
  order.time = new Date().toISOString();

  orders.push(order);
  saveOrders(); // 保存到文件

  console.log('Received new order:', order);

  res.json({ success: true, order });
});

// 查询所有订单
app.get('/orders', (req, res) => {
  res.json(orders);
});

// 查询未处理订单
app.get('/pendingOrders', (req, res) => {
  const pending = orders.filter(order => order.status === 'pending');
  res.json(pending);
});

// 更新订单状态
app.post('/updateOrderStatus', (req, res) => {
  const { index, status } = req.body;

  if (typeof index !== 'number' || !status) {
    return res.json({ success: false, message: 'Invalid parameters' });
  }

  if (index < 0 || index >= orders.length) {
    return res.json({ success: false, message: 'Order not found' });
  }

  orders[index].status = status;
  saveOrders(); // 保存更新后的订单

  res.json({ success: true, order: orders[index] });
});

const COMMODITIES_FILE = 'commodities.json';

// 加载商品数据
let commodities = [];
if (fs.existsSync(COMMODITIES_FILE)) {
  const raw = fs.readFileSync(COMMODITIES_FILE);
  commodities = JSON.parse(raw);
}

// 保存到文件
function saveCommodities() {
  fs.writeFileSync(COMMODITIES_FILE, JSON.stringify(commodities, null, 2));
}

// 添加商品
app.post('/addCommodity', (req, res) => {
  const { name, price, details, type, imageFileName } = req.body;

  if (!name || !price || !type) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  const id = commodities.length > 0 ? Math.max(...commodities.map(c => c.id)) + 1 : 1;

  const newCommodity = {
    id,
    name,
    price: parseFloat(price),
    details: details || '',
    type,
    // 如果没提供图片，就给个默认图片
    imageUrl: imageFileName ? `/Image/${imageFileName}` : '/Image/default.png'
  };

  commodities.push(newCommodity);
  saveCommodities();

  res.json({ success: true, commodity: newCommodity });
});

// 获取单个商品
app.get('/getCommodity', (req, res) => {
  const id = parseInt(req.query.id);
  const commodity = commodities.find(c => c.id === id);
  if (!commodity) {
    return res.json({ success: false, message: 'Commodity not found' });
  }
  res.json({ success: true, commodity });
});

// 获取所有商品
app.get('/commodities', (req, res) => {
  res.json({ success: true, commodities });
});

// 更新商品
app.put('/updateCommodity', (req, res) => {
  const id = parseInt(req.query.id);
  const idx = commodities.findIndex(c => c.id === id);

  if (idx === -1) {
    return res.json({ success: false, message: 'Commodity not found' });
  }

  const { name, price, details, type, imageFileName } = req.body;
  const old = commodities[idx];

  commodities[idx] = {
    ...old,
    name: name || old.name,
    price: price ? parseFloat(price) : old.price,
    details: details ?? old.details,
    type: type || old.type,
    imageUrl: imageFileName ? `/Image/${imageFileName}` : old.imageUrl
  };

  saveCommodities();

  res.json({ success: true, commodity: commodities[idx] });
});

// 删除商品
app.delete('/deleteCommodity', (req, res) => {
  const id = parseInt(req.query.id);
  const idx = commodities.findIndex(c => c.id === id);

  if (idx === -1) {
    return res.json({ success: false, message: 'Commodity not found' });
  }

  const removed = commodities.splice(idx, 1)[0];
  saveCommodities();

  res.json({ success: true, deleted: removed });
});

// 启动服务器
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
