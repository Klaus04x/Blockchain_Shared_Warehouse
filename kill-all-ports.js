#!/usr/bin/env node

/**
 * Kill All Ports Script
 * Kill tất cả processes đang chiếm ports 3000, 5000, 8545
 */

const { exec } = require('child_process');

async function killPort(port) {
  return new Promise((resolve) => {
    console.log(`🔍 Đang kiểm tra port ${port}...`);
    
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} đã được giải phóng`);
        resolve();
        return;
      }

      console.log(`⚠️ Tìm thấy processes trên port ${port}:`);
      console.log(stdout);

      // Extract PIDs
      const lines = stdout.split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[4];
          if (pid && pid !== '0') {
            pids.add(pid);
          }
        }
      });

      if (pids.size === 0) {
        console.log(`✅ Không có processes nào để kill trên port ${port}`);
        resolve();
        return;
      }

      const pidArray = Array.from(pids);
      console.log(`🔪 Đang kill processes: ${pidArray.join(', ')}`);

      // Kill each process
      let killedCount = 0;
      pidArray.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
          if (killError) {
            console.log(`⚠️ Không thể kill PID ${pid}: ${killError.message}`);
          } else {
            console.log(`✅ Đã kill PID ${pid}`);
            killedCount++;
          }

          if (killedCount === pidArray.length) {
            console.log(`✅ Port ${port} đã được giải phóng`);
            resolve();
          }
        });
      });
    });
  });
}

async function killAllPorts() {
  console.log('🚀 Đang kill tất cả ports ứng dụng...\n');

  try {
    await killPort(3000);
    console.log('');
    await killPort(5000);
    console.log('');
    await killPort(8545);
    
    console.log('\n🎉 Tất cả ports đã được giải phóng!');
    console.log('💡 Bạn có thể chạy: npm run dev:all:preserve');
  } catch (error) {
    console.error('❌ Lỗi kill ports:', error.message);
  }
}

// Chạy kill all ports
killAllPorts();
