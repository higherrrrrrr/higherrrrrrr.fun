const config = {
  baseScaling: {
    stats: level => ({
      hp: level === 1 ? 69 : Math.floor(69 * (1 + level * 0.5)),
      atk: level === 1 ? 420 : Math.floor(420 * (1 + level * 0.4)),
      spd: level === 1 ? 1337 : Math.floor(1337 * (1 + level * 0.3)),
      ele: level === 1 ? 'LSD' : ['LSD', 'DMT', 'MDMA', 'THC', 'PCP'][Math.min(4, Math.floor(level/4))]
    }),
    rarityScore: level => level === 1 ? 93.69 : 93.69 + (level * 2.5)
  },

  stages: {
    1: {
      eyeGradients: [
        ['#FFF', '#FF00EA', '#00FFEA', '#ADFF2F'],
        ['#FFF', '#FF0000', '#FF00FF', '#FFFF00'],
        ['#FFF', '#00FF00', '#0000FF', '#FF0000'],
        ['#FFF', '#FF8800', '#00FFFF', '#FF00FF'],
        ['#FFF', '#FF00FF', '#FFFF00', '#00FFFF']
      ],
      glowColors: ['#22C55E', '#FF00EA', '#00FFFF', '#FFFF00', '#FF3AF7']
    }
  },

  maxLevel: 21
};

module.exports = config;