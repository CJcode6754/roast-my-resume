/**
 * Calculates "Career Concern Index" (0–100) based on roast content.
 */
export function getIntensity(text) {
  const words = [
    'terrible', 'awful', 'disaster', 'yikes', 'useless', 'generic',
    'weak', 'cringe', 'questionable', 'concerning', 'vague', 'excessive',
    'grabe', 'nako', 'jusko', 'talaga', 'seriously', 'unfortunate',
    'unclear', 'suspicious', 'gaps', 'unexplained'
  ];
  const emojis = ['💀', '😭', '🤣', '😱', '😬', '🙈', '🤦', '🚩', '☠️'];

  let score = 0;
  const lower = text.toLowerCase();
  words.forEach(w => { if (lower.includes(w)) score += 8; });
  emojis.forEach(e => { if (text.includes(e)) score += 6; });

  return Math.min(98, Math.max(38, score));
}