import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import "reflect-metadata";

@Entity()
export class Character {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
