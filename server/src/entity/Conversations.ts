import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { Quotes } from "./Quotes";

@Entity()
export class Conversations {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany((type) => Quotes, (quotes) => quotes.quotes)
    @JoinColumn()
    quotes: Quotes[];
}
