import {
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinTable,
    Column,
} from "typeorm";
import { Characters } from "./Characters";

@Entity()
export class Quotes {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    quotes: string;

    @OneToOne((type) => Characters)
    @JoinColumn({ name: "character" })
    character: Characters;
}
