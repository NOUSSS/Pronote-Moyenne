import puppeteer from "puppeteer";

import { data } from "../data.js";
import { Logger } from "./Logger.js";

const { PRONOTE_URL, REDIRECT_ENT, USER_IDENTIFIANT, USER_PASSWORD } = data;

const waitFunction = async (ms = 1000) =>
  new Promise((res) => setTimeout(res, ms, true));

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(PRONOTE_URL);
  await page.setViewport({
    height: 10000,
    width: 10000,
  });

  Logger.log("Identification sur EduConnect");

  await page.evaluate(
    (USER_IDENTIFIANT, USER_PASSWORD) => {
      const [identifiantInput, passwordInput] = Array.from(
        document.querySelectorAll(".fr-input")
      );

      selectionProfil("eleve");

      identifiantInput.value = USER_IDENTIFIANT;
      passwordInput.value = USER_PASSWORD;

      document.querySelector("#bouton_valider").click();
    },
    USER_IDENTIFIANT,
    USER_PASSWORD
  );

  await waitFunction();

  Logger.log("Identification sur l'ENT");

  await page.goto(REDIRECT_ENT);
  await page.evaluate(() => {
    document.querySelectorAll("label").forEach((e) => {
      if (e.innerText === "de l’académie de Toulouse avec EduConnect")
        e.click();
    });

    document.querySelector("#button-submit").click();
  });

  await waitFunction(2000);

  Logger.log("Redirection vers PRONOTE");

  await page.evaluate(() => {
    document.querySelector(".burger").click();

    document.querySelectorAll(".services-shortcut__link").forEach((e) => {
      if (e.dataset.service === "SERVICES_VIE_SCOLAIRE") {
        e.target = "";
        e.click();
      }
    });
  });

  await waitFunction(3500);

  Logger.log("Recupérations des notes\n");

  await page.evaluate(async () => {
    document.querySelectorAll(".item-menu_niveau0")[2].click();
  });

  await waitFunction();

  const typeNote = await page.evaluate(() => {
    let returnValue = "";

    document.querySelectorAll("div").forEach((e) => {
      if (e.ariaLabel === "Liste déroulante : sélectionnez une période.")
        returnValue = e.innerText.match(/([^\d]+)\s*\d+/)[1].trim();
    });

    return returnValue;
  });

  const dateValue = await Logger.prompt({
    prompt: `Quel ${typeNote} ? (1 par defaut)`,
    defaultValue: "1",
  });

  await page.evaluate(
    (dateValue, typeNote) => {
      document.querySelectorAll(".as-li").forEach((e) => {
        if (e.innerText === `${typeNote} ${dateValue}`) e.click();
      });
    },
    dateValue,
    typeNote
  );

  await waitFunction();

  const notes = await page.evaluate(() => {
    notes = [];

    document.querySelectorAll("span").forEach((e) => {
      if (e.innerText === "Par matière") e.click();
    });

    document.querySelectorAll(".ie-titre-gros").forEach((e) => {
      if (Number(e.innerText.replace(",", ".")))
        notes.push(Number(e.innerText.replace(",", ".")));
    });

    return notes;
  });

  await waitFunction();

  const moyenne = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2);

  if (!parseInt(moyenne))
    Logger.error(`Vous n'avez pas de notes pour ce ${typeNote.toLowerCase()}.`);
  else if (parseInt(moyenne)) {
    Logger.log(
      `Pendant le ${typeNote} ${dateValue}, votre moyenne est/était de ` +
        `${moyenne}`.cyan
    );
  }

  await browser.close();
  process.exit(0);
})();
