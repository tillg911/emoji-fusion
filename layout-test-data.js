// Test data to verify leaderboard alignment with different score lengths
const testLeaderboardData = [
  { rank: 1, name: 'Till', score: 99999, highestTile: 11 },     // 5-digit score
  { rank: 2, name: 'Alexander', score: 8750, highestTile: 10 }, // 4-digit score
  { rank: 3, name: 'Max', score: 654, highestTile: 9 },        // 3-digit score
  { rank: 4, name: 'Anna', score: 89, highestTile: 8 },        // 2-digit score
  { rank: 5, name: 'Bob', score: 12345, highestTile: 10 },     // 5-digit score
  { rank: 6, name: 'Charlie Brown', score: 999, highestTile: 7 }, // Long name, 3-digit score
  { rank: 7, name: 'D', score: 50000, highestTile: 11 },       // Short name, 5-digit score
  { rank: 8, name: 'Eva Martinez', score: 123, highestTile: 6 }, // Long name, 3-digit score
  { rank: 9, name: 'Frank', score: 67890, highestTile: 10 },   // 5-digit score
  { rank: 10, name: 'Grace', score: 45, highestTile: 5 }       // 2-digit score
];

console.log('Test Leaderboard Data for Layout Verification:');
console.log('==========================================');

testLeaderboardData.forEach((entry, index) => {
  const scoreLength = entry.score.toLocaleString().length;
  const nameLength = entry.name.length;
  
  console.log(`#${entry.rank.toString().padStart(2)} | ${entry.name.padEnd(15)} | Tile ${entry.highestTile.toString().padStart(2)} | ${entry.score.toLocaleString().padStart(7)} (${scoreLength} digits, name: ${nameLength} chars)`);
});

console.log('\n📱 Mobile Grid: "32px 1fr 60px 80px"');
console.log('🖥️  Desktop Grid: "40px 1fr 80px 100px"');
console.log('\n✅ The fixed-width columns should ensure:');
console.log('   - Rank column: Always centered in fixed space');
console.log('   - Name column: Expandable, truncated with ellipsis if needed');
console.log('   - Tile column: Fixed width, emoji and number aligned consistently');
console.log('   - Score column: Fixed width, right-aligned, accommodates up to 5 digits');