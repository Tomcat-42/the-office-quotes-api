import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Characters {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
