#!/usr/bin/env node

/**
 * Service tự động hoàn thành hợp đồng hết hạn
 * Chạy liên tục trong background, kiểm tra mỗi 30 giây
 */

const autoCompleteExpiredLeases = require('./auto-complete-expired-leases');

// Cấu hình
const CHECK_INTERVAL = 30 * 1000; // 30 giây (có thể điều chỉnh)
let isRunning = false;

console.log('\n' + '='.repeat(70));
console.log('🤖 LEASE AUTO-COMPLETE SERVICE');
console.log('='.repeat(70));
console.log(`⏰ Kiểm tra mỗi: ${CHECK_INTERVAL / 1000} giây`);
console.log('🔄 Service đang khởi động...\n');

async function runCheck() {
  if (isRunning) {
    console.log('⏭️  Bỏ qua - đang chạy check trước đó');
    return;
  }

  isRunning = true;
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] 🔍 Bắt đầu kiểm tra...`);

  try {
    await autoCompleteExpiredLeases();
    console.log(`[${timestamp}] ✅ Kiểm tra hoàn tất\n`);
  } catch (error) {
    console.error(`[${timestamp}] ❌ Lỗi:`, error.message);
  } finally {
    isRunning = false;
  }
}

// Chạy lần đầu ngay
runCheck().then(() => {
  console.log('✅ Service đã sẵn sàng!');
  console.log('💡 Service sẽ tự động kiểm tra và hoàn thành lease hết hạn');
  console.log('🛑 Nhấn Ctrl+C để dừng\n');
  
  // Thiết lập interval
  setInterval(runCheck, CHECK_INTERVAL);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Đang dừng service...');
  console.log('✅ Service đã dừng!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Đang dừng service...');
  console.log('✅ Service đã dừng!');
  process.exit(0);
});

