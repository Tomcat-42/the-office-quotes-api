import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany } from "typeorm";
import { Conversations } from "./Conversations";

@Entity()
export class Episodes {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    number: number;

    @Column()
    season: number;

    @OneToMany((type) => Conversations, (conversations) => conversations.quotes)
    @JoinColumn({ name: "conversations" })
    conversations: Conversations[];
}
