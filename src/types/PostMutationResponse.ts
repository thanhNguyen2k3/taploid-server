import { Field, ObjectType } from 'type-graphql';
import { IMutationResponse } from './MutationResponse';
import { FieldErrors } from './FieldErrors';
import { Post } from '../entities/Post';

@ObjectType({ implements: IMutationResponse })
export class PostMutationResponse extends IMutationResponse {
    code: number;
    success: boolean;
    message?: string;

    @Field({ nullable: true })
    post?: Post;

    @Field((_type) => [FieldErrors], { nullable: true })
    errors?: FieldErrors[];
}
