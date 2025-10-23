/**
 * Script để tăng thời gian blockchain (Time Travel)
 * Dùng để test hợp đồng mà không cần đợi thời gian thực
 * 
 * Usage:
 *   npx hardhat run scripts/increase-time.js --network localhost
 */

const { ethers } = require('hardhat');

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('⏰ BLOCKCHAIN TIME MANIPULATION');
  console.log('='.repeat(60) + '\n');

  // Lấy thời gian hiện tại
  const provider = ethers.provider;
  const blockBefore = await provider.getBlock('latest');
  const timeBefore = blockBefore.timestamp;
  
  console.log('📅 Thời gian blockchain hiện tại:');
  console.log('   Timestamp:', timeBefore);
  console.log('   Date:', new Date(timeBefore * 1000).toLocaleString());

  // Hỏi người dùng muốn tăng bao nhiêu
  const args = process.argv.slice(2);
  let increaseSeconds = 86400; // Default: 1 ngày

  if (args.length > 0) {
    const arg = args[0].toLowerCase();
    if (arg.includes('day')) {
      const days = parseInt(arg.replace('day', '').replace('s', '')) || 1;
      increaseSeconds = days * 86400;
      console.log(`\n⏭️  Tăng thời gian: ${days} ngày`);
    } else if (arg.includes('hour')) {
      const hours = parseInt(arg.replace('hour', '').replace('s', '')) || 1;
      increaseSeconds = hours * 3600;
      console.log(`\n⏭️  Tăng thời gian: ${hours} giờ`);
    } else if (arg.includes('minute')) {
      const minutes = parseInt(arg.replace('minute', '').replace('s', '')) || 1;
      increaseSeconds = minutes * 60;
      console.log(`\n⏭️  Tăng thời gian: ${minutes} phút`);
    } else {
      increaseSeconds = parseInt(arg) || 86400;
      console.log(`\n⏭️  Tăng thời gian: ${increaseSeconds} giây`);
    }
  } else {
    console.log('\n⏭️  Tăng thời gian: 1 ngày (mặc định)');
  }

  // Tăng thời gian blockchain
  console.log('\n🔄 Đang thay đổi thời gian blockchain...');
  await provider.send('evm_increaseTime', [increaseSeconds]);
  await provider.send('evm_mine'); // Mine block mới để áp dụng thay đổi

  // Kiểm tra thời gian sau khi thay đổi
  const blockAfter = await provider.getBlock('latest');
  const timeAfter = blockAfter.timestamp;

  console.log('\n✅ Thay đổi thời gian thành công!');
  console.log('\n📅 Thời gian blockchain sau khi thay đổi:');
  console.log('   Timestamp:', timeAfter);
  console.log('   Date:', new Date(timeAfter * 1000).toLocaleString());
  
  const actualIncrease = timeAfter - timeBefore;
  console.log('\n📊 Thống kê:');
  console.log('   Thời gian đã tăng:', actualIncrease, 'giây');
  console.log('   Tương đương:', Math.floor(actualIncrease / 86400), 'ngày',
              Math.floor((actualIncrease % 86400) / 3600), 'giờ',
              Math.floor((actualIncrease % 3600) / 60), 'phút');

  console.log('\n💡 Tips:');
  console.log('   - Giờ bạn có thể hoàn thành các hợp đồng đã hết hạn');
  console.log('   - Kiểm tra hợp đồng trên frontend để test');
  console.log('   - Thời gian này chỉ áp dụng cho blockchain local');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });

