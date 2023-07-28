import { Context } from '../types/Context';
import { Query, Resolver, Ctx } from 'type-graphql';

@Resolver()
export class GreetingResolver {
    @Query()
    hello(@Ctx() { req }: Context): string {
        console.log(req.session.userId);

        return `Hello AE`;
    }
}
