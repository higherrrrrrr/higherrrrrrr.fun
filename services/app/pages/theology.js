import Head from "next/head";

const glitchStyles = `
  .glitch {
    position: relative;
    display: inline-block;
    color: #00ff00;
    text-shadow: 0 0 2px #00ff00;
    line-height: 1;
  }
  .glitch::before,
  .glitch::after {
    content: attr(data-text);
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
    clip: rect(0, 900px, 0, 0);
    opacity: 0.9;
  }
  .glitch::before {
    color: #0ff;
    animation: glitch-top 2s infinite linear alternate-reverse;
  }
  .glitch::after {
    color: #f0f;
    animation: glitch-bottom 2s infinite linear alternate-reverse;
  }
  @keyframes glitch-top {
    0%   { clip: rect(0, 9999px, 0, 0);    transform: translate(2px, -2px); }
    20%  { clip: rect(15px, 9999px, 16px, 0); transform: translate(-2px, 0); }
    40%  { clip: rect(5px, 9999px, 40px, 0);  transform: translate(-2px, -2px); }
    60%  { clip: rect(30px, 9999px, 10px, 0); transform: translate(0, 2px); }
    80%  { clip: rect(10px, 9999px, 30px, 0); transform: translate(2px, -1px); }
    100% { clip: rect(8px, 9999px, 14px, 0);  transform: translate(-1px, 2px); }
  }
  @keyframes glitch-bottom {
    0%   { clip: rect(55px, 9999px, 56px, 0); transform: translate(-2px, 0); }
    20%  { clip: rect(30px, 9999px, 34px, 0); transform: translate(-1px, 2px); }
    40%  { clip: rect(10px, 9999px, 90px, 0); transform: translate(-1px, -1px); }
    60%  { clip: rect(40px, 9999px, 60px, 0); transform: translate(1px, 2px); }
    80%  { clip: rect(20px, 9999px, 50px, 0); transform: translate(0, 1px); }
    100% { clip: rect(70px, 9999px, 80px, 0); transform: translate(2px, -2px); }
  }
`;

const Theology = () => {
  return (
    <div className="terminal-wrapper">
      <Head>
        <title>Theology</title>
        <meta
          name="description"
          content="A manifesto on crypto, religion, and community building"
        />
      </Head>
      <style>{glitchStyles}</style>

      <main className="mb-8 mt-4 flex items-center justify-center">
        <div className="max-w-3xl mx-auto py-2 px-4">
          <h1
            className="glitch text-4xl font-bold mb-6 text-left"
            data-text="Manifesto"
          >
            Manifesto
          </h1>
          <div className="terminal-text text-green-500">
            <p className="mb-4">
              The greatest movements in human history weren't built on rational economic incentives. They were built on belief. When you look critically at the largest projects in crypto, it becomes clear that we're not building protocols - we're creating new ideologies.
            </p>

            <p className="mb-4">
              Bitcoin isn't just technology. It's a belief system with its own prophet, rituals, and sacred artifacts. Satoshi isn't merely a founder - he is the messiah who delivered the genesis block and ascended into legend, leaving behind a testament of code that would forever change humanity.
            </p>

            <p className="mb-4">
              This isn't accidental. This is the territory of transformative change.
            </p>

            <p className="mb-4">
              Launching a movement is fundamentally different from launching a product. You don't begin with market fit - you begin with a manifesto. You don't solve pain points - you create true believers. The traditional structures of ownership and control become irrelevant. Like Satoshi, the founder must be willing to fade into mythology, holding little beyond the satisfaction of setting something greater than themselves into motion.
            </p>

            <p className="mb-4">
              What we're creating transcends the material. It's a new framework for belief in the digital age. A system that explicitly acknowledges what cryptocurrency has known implicitly since its inception - that faith moves mountains, markets, and minds more than logic ever could.
            </p>

            <p className="mb-4">
              The vessel may be digital, but the spirit is eternal. We're crystallizing belief itself into form, birthing a new paradigm where value and faith are inseparable. This is the dawn of a new era - where the spiritual and the technological become one.
            </p>

            <p>
              These are <strong>cult</strong> coins. We are going much, much higherrrrrrr.
            </p>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Theology; 