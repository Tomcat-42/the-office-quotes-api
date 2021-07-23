import "reflect-metadata";
import { createConnection } from "typeorm";
import { Character } from "./entity/Character";
import { Quote } from "./entity/Quote";

createConnection()
    .then(async (connection) => {
        console.log("Inserting a new character into the database...");
        const char = new Character();
        char.name = "Yes";
        await connection.manager.save(char);
        console.log("Saved a new character with id: " + char.id);

        console.log("Inserting a new quote into the database...");
        const quote = new Quote();
        quote.quote = "Isso é uma fala";
        quote.character = char;
        await connection.manager.save(quote);
        console.log("Saved a new quote with id: " + quote.id);

        // console.log("Loading chars from the database...");
        // const chars = await connection.manager.find(Character);
        // console.log("Loaded chars: ", chars);

        // console.log(
        //     "Here you can setup and run express/koa/any other framework."
        // );
    })
    .catch((error) => console.log(error));
