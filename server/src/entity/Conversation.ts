import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { Quote } from "./Quote";

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany((type) => Quote, (quote) => quote.quote)
    @JoinColumn()
    quotes: Quote[];
}
