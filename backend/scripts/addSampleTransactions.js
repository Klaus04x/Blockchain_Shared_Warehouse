const db = require('../config/database');

async function addSampleTransactions() {
  try {
    console.log('Adding sample transactions...');
    
    const sampleTransactions = [
      {
        transaction_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        from_address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        to_address: null,
        type: 'create_lease',
        amount: '1000000000000000000',
        status: 'success',
        block_number: 12345
      },
      {
        transaction_hash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef123',
        from_address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        to_address: null,
        type: 'complete_lease',
        amount: '0',
        status: 'success',
        block_number: 12346
      },
      {
        transaction_hash: '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef1234',
        from_address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        to_address: null,
        type: 'register_warehouse',
        amount: '500000000000000000',
        status: 'success',
        block_number: 12347
      }
    ];

    for (const tx of sampleTransactions) {
      const query = `
        INSERT INTO transactions 
        (transaction_hash, from_address, to_address, type, amount, status, block_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.execute(query, [
        tx.transaction_hash,
        tx.from_address,
        tx.to_address,
        tx.type,
        tx.amount,
        tx.status,
        tx.block_number
      ]);
      
      console.log(`Added transaction: ${tx.transaction_hash}`);
    }
    
    console.log('Sample transactions added successfully!');
  } catch (error) {
    console.error('Error adding sample transactions:', error);
  } finally {
    process.exit(0);
  }
}

addSampleTransactions();
