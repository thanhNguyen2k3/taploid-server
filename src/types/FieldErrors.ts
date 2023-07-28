import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class FieldErrors {
    @Field()
    field: string;

    @Field()
    message: string;
}
