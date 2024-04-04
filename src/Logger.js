import "colors";

export const Logger = {
  /**
   *
   * @param {String} text
   * @returns
   */
  log: (text) => console.log(`[` + `*`.green + `] ` + text),

  /**
   *
   * @param {String} text
   * @returns
   */
  error: (text) => console.log("[" + "-".red + "] " + text),

  /**
   * Fonction pour prompt
   * @returns {Promise<String>} Une Promise qui retourne la valeur que l'utilisateur a entré (defaultValue si rien n'est entré)
   */
  prompt: async ({ prompt, defaultValue }) => {
    return new Promise((res) => {
      process.stdin.resume();
      process.stdout.write("[" + "?".green + "] " + prompt + " | ");

      process.stdin.on("data", (data) => {
        process.stdin.pause();

        const returnValue = data.toString().trim();

        if (!returnValue) {
          return res(defaultValue);
        } else {
          return res(returnValue);
        }
      });
    });
  },
};
