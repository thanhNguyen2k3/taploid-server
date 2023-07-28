import { User } from '../entities/User';
import { Field, ObjectType } from 'type-graphql';
import { IMutationResponse } from './MutationResponse';
import { FieldErrors } from './FieldErrors';

@ObjectType({ implements: IMutationResponse })
export class UserMutationResponse extends IMutationResponse {
    code: number;
    success: boolean;
    message?: string;

    @Field({ nullable: true })
    user?: User;

    @Field((_type) => [FieldErrors], { nullable: true })
    errors?: FieldErrors[];
}
