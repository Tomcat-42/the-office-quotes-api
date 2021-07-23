import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    OneToMany,
} from "typeorm";
import { Conversation } from "./Conversation";

@Entity()
export class Episodes {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    number: number;

    @Column()
    season: number;

    @OneToMany((type) => Conversation, (conversation) => conversation.quotes)
    @JoinColumn({ name: "conversations" })
    conversations: Conversation[];
}
