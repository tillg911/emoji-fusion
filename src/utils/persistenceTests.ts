// Test utilities for max discovered rank persistence
// Run these tests in browser console to verify functionality

import { 
  loadMaxDiscoveredRank, 
  saveMaxDiscoveredRank, 
  updateMaxDiscoveredRank, 
  resetMaxDiscoveredRank,
  getAvailableEmojiLevels 
} from './storage';

/**
 * Test Suite for Max Discovered Rank Persistence
 * Run in browser console: window.testMaxDiscoveredRank()
 */
export const testMaxDiscoveredRank = () => {
  console.log('🧪 Starting Max Discovered Rank Tests...\n');

  // Test 1: First start without saved data
  console.log('Test 1: First start (no localStorage data)');
  localStorage.removeItem('emoji-fusion-max-discovered-rank');
  const firstLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 1, Got: ${firstLoad}`, firstLoad === 1 ? '✅' : '❌');

  // Test 2: Save and load valid rank
  console.log('\nTest 2: Save and load valid rank');
  saveMaxDiscoveredRank(5);
  const validLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 5, Got: ${validLoad}`, validLoad === 5 ? '✅' : '❌');

  // Test 3: Update with higher rank
  console.log('\nTest 3: Update with higher rank');
  updateMaxDiscoveredRank(7);
  const higherLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 7, Got: ${higherLoad}`, higherLoad === 7 ? '✅' : '❌');

  // Test 4: Update with lower rank (should not change)
  console.log('\nTest 4: Update with lower rank (should not change)');
  updateMaxDiscoveredRank(4);
  const noChangeLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 7, Got: ${noChangeLoad}`, noChangeLoad === 7 ? '✅' : '❌');

  // Test 5: Corrupted data handling
  console.log('\nTest 5: Corrupted data handling');
  localStorage.setItem('emoji-fusion-max-discovered-rank', 'invalid_data');
  const corruptedLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 1, Got: ${corruptedLoad}`, corruptedLoad === 1 ? '✅' : '❌');

  // Test 6: Negative value handling
  console.log('\nTest 6: Negative value handling');
  localStorage.setItem('emoji-fusion-max-discovered-rank', '-5');
  const negativeLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 1, Got: ${negativeLoad}`, negativeLoad === 1 ? '✅' : '❌');

  // Test 7: Available emoji levels
  console.log('\nTest 7: Available emoji levels');
  saveMaxDiscoveredRank(3);
  const levels = getAvailableEmojiLevels();
  const expectedLevels = [1, 2, 3];
  const levelsMatch = JSON.stringify(levels) === JSON.stringify(expectedLevels);
  console.log(`✓ Expected: [1,2,3], Got: [${levels.join(',')}]`, levelsMatch ? '✅' : '❌');

  // Test 8: Reset functionality
  console.log('\nTest 8: Reset functionality');
  saveMaxDiscoveredRank(10);
  resetMaxDiscoveredRank();
  const resetLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 1, Got: ${resetLoad}`, resetLoad === 1 ? '✅' : '❌');

  // Test 9: Invalid update inputs
  console.log('\nTest 9: Invalid update inputs');
  saveMaxDiscoveredRank(5);
  updateMaxDiscoveredRank(NaN);
  updateMaxDiscoveredRank(-1);
  updateMaxDiscoveredRank(0);
  const invalidInputLoad = loadMaxDiscoveredRank();
  console.log(`✓ Expected: 5 (unchanged), Got: ${invalidInputLoad}`, invalidInputLoad === 5 ? '✅' : '❌');

  console.log('\n🎉 Max Discovered Rank Tests Complete!');
  
  // Clean up
  resetMaxDiscoveredRank();
  console.log('🧹 Test cleanup: Reset to default state\n');
};

/**
 * Simulation test: Play through a game progression
 */
export const simulateGameProgression = () => {
  console.log('🎮 Simulating Game Progression...\n');
  
  resetMaxDiscoveredRank();
  console.log(`Start: Max rank = ${loadMaxDiscoveredRank()}`);
  
  // Simulate merges during gameplay
  const merges = [2, 3, 2, 4, 5, 3, 6, 4, 7];
  
  merges.forEach((rank, index) => {
    updateMaxDiscoveredRank(rank);
    console.log(`Merge ${index + 1}: Reached rank ${rank}, Max = ${loadMaxDiscoveredRank()}`);
  });
  
  console.log(`\nFinal max discovered rank: ${loadMaxDiscoveredRank()}`);
  console.log(`Available emoji levels: [${getAvailableEmojiLevels().join(', ')}]`);
  
  console.log('\n🎮 Game Progression Simulation Complete!\n');
};

// Make tests available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testMaxDiscoveredRank = testMaxDiscoveredRank;
  (window as any).simulateGameProgression = simulateGameProgression;
  
  console.log('🧪 Test functions loaded! Run in console:');
  console.log('  window.testMaxDiscoveredRank()');
  console.log('  window.simulateGameProgression()');
}