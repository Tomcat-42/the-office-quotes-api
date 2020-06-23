function main() {
    "use strict";
    const ALERT_TIME = 2000;
    const apiUrl = "https://the-office-quotes-api.herokuapp.com";

    const quoteForm = document.querySelector(".quoteForm");
    const charImg = document.querySelector(".charImg");
    const episodeInfo = document.querySelector(".episodeInfo");
    const copyBtn = document.querySelector(".copyButton");
    const quoteList = document.querySelector(".quoteList");
    const cardBody = document.querySelector(".card-body");
    const appAlert = document.querySelector(".appAlert");

    let quotes = [];

    function alerta(string) {
        appAlert.querySelector("span").textContent = string;
        appAlert.removeAttribute("hidden");
        setTimeout(() => {
            appAlert.setAttribute("hidden", "true");
        }, ALERT_TIME);
    }

    async function setClipboard() {
        const txt = quotes.reduce(
            (acc, val) => `${acc}${val.name}: ${val.quote}\n`,
            ""
        );

        navigator.clipboard.writeText(txt).then(() => {
            alerta("quote(s) copied to clipboard.");
        });
    }

    function setImage(names) {
        const images = [
            "andy",
            "angela",
            "creed",
            "darryl",
            "jan",
            "jim",
            "kelly",
            "kevin",
            "meredith",
            "michael",
            "oscar",
            "pam",
            "phyllis",
            "ryan",
            "stanley",
            "karen",
            "dwight",
        ];
        let match = false;
        for (const name of names) {
            for (const image of images) {
                const reg = new RegExp(image, "i");
                if (name.match(reg)) {
                    match = true;
                    charImg.setAttribute("src", `../images/${image}.jpg`);
                    break;
                }
            }
            if (match) {
                break;
            }
        }
        if (!match) {
            charImg.setAttribute("src", "../images/default.jpg");
        }
    }

    function getLi(name, text) {
        const newli = document.createElement("li");
        const newSpanName = document.createElement("span");
        const newSpanQuote = document.createElement("span");

        newli.classList.add("list-group-item", "quoteItem");

        newSpanName.classList.add("charName");
        newSpanName.textContent = name + ": ";

        newSpanQuote.classList.add("charQuote");
        newSpanQuote.textContent = text;

        newli.appendChild(newSpanName);
        newli.appendChild(newSpanQuote);

        return newli;
    }

    async function requestQuote(url) {
        try {
            const data = await fetch(url, { method: "GET", mode: "cors" });
            const json = await data.json();

            return json["result"];
        } catch (err) {
            alerta("Error requesting quote(s).");
        }
    }

    function setQuote(obj, type) {
        while (quoteList.firstChild) {
            quoteList.firstChild.remove();
        }

        quotes = [];
        const { episode } = obj;

        let info;
        if (episode.season === 11) {
            info = episode.number === 1 ? "Creed Thoughts" : "Schrute Space";
        } else if (episode.season === 10) {
            info = `Webisodes - ${episode.name}`;
        } else {
            info = `s${episode.season
                .toString()
                .padStart(2, "0")}e${episode.season
                .toString()
                .padStart(2, "0")} - ${episode.name}`;
        }

        episodeInfo.textContent = info;

        if (type === "quotes") {
            const item = getLi(obj.character.name, obj.quote);
            quoteList.appendChild(item);
            quotes.push({ name: obj.character.name, quote: obj.quote });
            setImage(Array(obj.character.name));
        } else {
            obj.quotes.forEach((quote) => {
                const item = getLi(quote.character.name, quote.quote);
                quoteList.appendChild(item);
                quotes.push({ name: quote.character.name, quote: quote.quote });
                setImage(obj.quotes.map(quote => quote.character.name));
            });
        }
    }

    quoteForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        alerta("requesting quote(s).");
        const data = new FormData(e.target);
        const res = await requestQuote(`${apiUrl}/${data.get("quote")}/random`);
        setQuote(res, data.get("quote"));
        cardBody.removeAttribute("hidden");
    });

    copyBtn.addEventListener("click", async () => {
        setClipboard();
    });
}

window.onload = main;
