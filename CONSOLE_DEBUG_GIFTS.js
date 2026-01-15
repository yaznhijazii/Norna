// ═══════════════════════════════════════════════════════════════════
// 🎁 CONSOLE DEBUG FOR GIFTS - COPY & PASTE IN BROWSER CONSOLE (F12)
// ═══════════════════════════════════════════════════════════════════

console.log('========================================');
console.log('🔍 GIFTS DEBUG - START');
console.log('========================================');

// 1️⃣ Check localStorage user data
console.log('\n1️⃣ Current User Data:');
const userStr = localStorage.getItem('nooruna_user');
if (userStr) {
  const userData = JSON.parse(userStr);
  console.log('User ID:', userData.userId || userData.id || userData.user_id);
  console.log('Name:', userData.name || userData.username);
  console.log('Partner ID:', userData.partner_id || userData.partnerId);
  console.log('Partner Name:', userData.partnerName || userData.partner_name);
  console.log('Full Data:', userData);
  
  // ⚠️ Check for issues
  if (!userData.userId && !userData.id && !userData.user_id) {
    console.error('❌ NO USER ID FOUND!');
  }
  if (!userData.partner_id && !userData.partnerId) {
    console.warn('⚠️ NO PARTNER ID - You need to link a partner first!');
  }
  if (userData.userId === userData.partner_id || userData.id === userData.partnerId) {
    console.error('❌ USER ID = PARTNER ID (Same person!)');
    console.error('This will cause "different_users" constraint error!');
  }
} else {
  console.error('❌ NO USER DATA IN LOCALSTORAGE - You need to login first!');
}

// 2️⃣ Check Supabase connection
console.log('\n2️⃣ Supabase Status:');
console.log('Supabase URL:', window.supabase?.supabaseUrl || 'Not found');
console.log('Supabase Key:', window.supabase?.supabaseKey ? '✅ Present' : '❌ Missing');

// 3️⃣ Test fetching gifts
console.log('\n3️⃣ Testing Gifts Query:');
async function testGifts() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://cobhopfnjktuwpxkejlz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYmhvcGZuamt0dXdweGtlamx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNDU3ODQsImV4cCI6MjA1MTkyMTc4NH0.YAHqhzF7kLnrfQSSYwqLEbECYcWAUJk2_MPjRDnUhDg'
    );
    
    console.log('Fetching recent gifts...');
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching gifts:', error);
    } else {
      console.log('✅ Recent gifts:', data);
      if (data.length === 0) {
        console.warn('⚠️ No gifts in database!');
      }
    }
  } catch (e) {
    console.error('❌ Error in testGifts:', e);
  }
}
testGifts();

// 4️⃣ Test sending a gift (DRY RUN - won't actually send)
console.log('\n4️⃣ Gift Send Validation (Dry Run):');
if (userStr) {
  const userData = JSON.parse(userStr);
  const fromId = userData.userId || userData.id || userData.user_id;
  const toId = userData.partner_id || userData.partnerId;
  
  console.log('From User ID:', fromId);
  console.log('To User ID:', toId);
  
  if (!fromId) {
    console.error('❌ CANNOT SEND: No user ID!');
  } else if (!toId) {
    console.error('❌ CANNOT SEND: No partner ID!');
  } else if (fromId === toId) {
    console.error('❌ CANNOT SEND: Cannot send gift to yourself!');
    console.error('   From:', fromId);
    console.error('   To:', toId);
    console.error('   Solution: Link with a different user account!');
  } else {
    console.log('✅ VALID: Can send gift!');
    console.log('Gift data that would be sent:');
    console.log({
      from_user_id: fromId,
      to_user_id: toId,
      gift_type: 'rose', // example
      message_text: null,
      is_read: false
    });
  }
}

// 5️⃣ Test Realtime subscription status
console.log('\n5️⃣ Realtime Subscriptions:');
console.log('Check console for messages like:');
console.log('  🎁 Setting up gift notifications for user: ...');
console.log('  🎁 Gift channel status: SUBSCRIBED');
console.log('\nIf you don\'t see these, Realtime might not be working!');

console.log('\n========================================');
console.log('🔍 GIFTS DEBUG - END');
console.log('========================================');
console.log('\n📋 NEXT STEPS:');
console.log('1. Check the output above for any ❌ errors');
console.log('2. If User ID = Partner ID, go to Settings and link a different partner');
console.log('3. If no partner ID, go to Settings and link a partner');
console.log('4. Try sending a gift and check console for errors');
console.log('5. Open a second tab with a different user to receive the gift');
console.log('\n💡 TIP: افتح تبويبين - واحد للمرسل ووحد للمستقبل!');
