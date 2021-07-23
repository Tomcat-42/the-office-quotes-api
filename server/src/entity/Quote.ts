import {
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
    Column,
} from "typeorm";
import { Character } from "./Character";

@Entity()
export class Quote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    quote: string;

    @OneToOne((type) => Character, (character) => character.id)
    @JoinColumn({ name: "character" })
    character: Character;
}
