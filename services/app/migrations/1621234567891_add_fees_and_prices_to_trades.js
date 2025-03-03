exports.up = pgm => {
  pgm.addColumns('trades', {
    fees: {
      type: 'numeric',
      notNull: false,
      default: 0
    },
    price_in_usd: {
      type: 'numeric',
      notNull: false,
      default: 0
    },
    price_out_usd: {
      type: 'numeric',
      notNull: false,
      default: 0
    }
  });
};

exports.down = pgm => {
  pgm.dropColumns('trades', ['fees', 'price_in_usd', 'price_out_usd']);
}; 