class FunctionHandler {
  static setContext(yourContext, lifeSpan = 1) {
    return agent.setContext({
      name: yourContext,
      lifespan: lifeSpan
    });
  }

  static format2(n) {
    return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1.');
  }

  static randomNumber(howMuchNumber) {
    for (let i = 0; i < howMuchNumber; i++) {
      if (Math.round(Math.random() * 100) === 0) {
        console.log('DORRRR');
      }
      if (Math.round(Math.random() * 100).toString().includes(0)) {
        console.log('DUARRR');
      }
      console.log(Math.round(Math.random() * 100));
    }
  }
}

module.exports = FunctionHandler;
