import "reflect-metadata";
import { createConnection } from "typeorm";
import { Characters } from "./entity/Characters";

createConnection()
    .then(async (connection) => {
        console.log("Inserting a new character into the database...");
        const char = new Characters();
        char.name = "Yes";
        await connection.manager.save(char);
        console.log("Saved a new character with id: " + char.id);

        console.log("Loading chars from the database...");
        const chars = await connection.manager.find(Characters);
        console.log("Loaded chars: ", chars);

        console.log(
            "Here you can setup and run express/koa/any other framework."
        );
    })
    .catch((error) => console.log(error));
