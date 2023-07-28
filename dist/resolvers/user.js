"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const validateRegisterInput_1 = require("../utils/validateRegisterInput");
const UserMutationResponse_1 = require("../types/UserMutationResponse");
const RegisterInput_1 = require("../types/RegisterInput");
const type_graphql_1 = require("type-graphql");
const LoginInput_1 = require("../types/LoginInput");
const User_1 = require("../entities/User");
const argon2_1 = __importDefault(require("argon2"));
const constant_1 = require("../constant");
const ForgotPasswordInput_1 = require("../types/ForgotPasswordInput");
const sendEmail_1 = require("../utils/sendEmail");
const Token_1 = require("../models/Token");
const uuid_1 = require("uuid");
const ChangePasswordInput_1 = require("../types/ChangePasswordInput");
let UserResolver = exports.UserResolver = class UserResolver {
    email(user, { req }) {
        return req.session.userId === user.id ? user.email : '';
    }
    async me({ req }) {
        if (!req.session.userId)
            return null;
        const user = await User_1.User.findOne({ id: req.session.userId });
        return user;
    }
    async register(registerInput, { req }) {
        const validateRegisterInputErrors = (0, validateRegisterInput_1.validateRegisterInput)(registerInput);
        if (validateRegisterInputErrors !== null) {
            return Object.assign({ code: 400, success: false }, validateRegisterInputErrors);
        }
        try {
            const { username, email, password } = registerInput;
            const existingUser = await User_1.User.findOne({ where: [{ username }, { email }] });
            if (existingUser)
                return {
                    code: 400,
                    success: false,
                    message: 'Duplucated username or email',
                    errors: [
                        {
                            field: existingUser.username === username ? 'usename' : 'email',
                            message: `${existingUser.username === username ? 'Username' : 'Email'} already taken`,
                        },
                    ],
                };
            const hashPassword = await argon2_1.default.hash(password);
            const newUser = User_1.User.create({
                username,
                email,
                password: hashPassword,
            });
            await User_1.User.save(newUser);
            req.session.userId = newUser.id;
            return {
                code: 200,
                success: true,
                message: 'User registration success',
                user: newUser,
            };
        }
        catch (error) {
            console.log(error);
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error.message}`,
            };
        }
    }
    async login({ usernameOrEmail, password }, { req }) {
        try {
            const existingUser = await User_1.User.findOne(usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail });
            if (!existingUser) {
                return {
                    code: 400,
                    success: false,
                    message: 'User not found',
                    errors: [
                        {
                            field: 'usernameOrEmail',
                            message: 'Username or email incorrect',
                        },
                    ],
                };
            }
            const passwordValid = await argon2_1.default.verify(existingUser.password, password);
            if (!passwordValid)
                return {
                    code: 400,
                    success: false,
                    message: 'Wrong password',
                    errors: [
                        {
                            field: 'password',
                            message: 'Wrong password',
                        },
                    ],
                };
            req.session.userId = existingUser.id;
            return {
                code: 200,
                success: true,
                message: 'Logged in success',
                user: existingUser,
            };
        }
        catch (error) {
            console.log(error);
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error.message}`,
            };
        }
    }
    logout({ req, res }) {
        return new Promise((resolve, _reject) => {
            res.clearCookie(constant_1.COOKIE_NAME);
            req.session.destroy((error) => {
                if (error) {
                    console.log('SESSION_ERROR', error);
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
    async forgotPassword(forgotPassowordInput) {
        const user = await User_1.User.findOne({ email: forgotPassowordInput.email });
        if (!user)
            return true;
        await Token_1.TokenModel.findOneAndDelete({ userId: `${user.id}` });
        const resetToken = (0, uuid_1.v4)();
        const hashResetToken = await argon2_1.default.hash(resetToken);
        await new Token_1.TokenModel({ userId: `${user.id}`, token: hashResetToken }).save();
        await (0, sendEmail_1.sendEmail)(forgotPassowordInput.email, `<a href="http://localhost:3000/changePassword?token=${resetToken}&userId=${user.id}">Click here to reset your password</a>`);
        return true;
    }
    async changePassword(token, userId, changePasswordInput, { req }) {
        if (changePasswordInput.newPassword.length <= 2) {
            return {
                code: 400,
                success: false,
                message: 'Invalid password',
                errors: [{ field: 'newPassword', message: 'Length must be greater than 2' }],
            };
        }
        try {
            const resetPasswordTokenRecord = await Token_1.TokenModel.findOne({ userId });
            if (!resetPasswordTokenRecord) {
                return {
                    code: 400,
                    success: false,
                    message: 'Invalid or expired password reset token',
                    errors: [{ field: 'token', message: 'Invalid or expired password reset token' }],
                };
            }
            const resetPasswordTokenValid = argon2_1.default.verify(resetPasswordTokenRecord.token, token);
            if (!resetPasswordTokenValid) {
                return {
                    code: 400,
                    success: false,
                };
            }
            const userIdNum = parseInt(userId);
            const user = await User_1.User.findOne({ id: userIdNum });
            if (!user)
                return {
                    code: 400,
                    success: false,
                    message: 'User no longer exists',
                    errors: [
                        {
                            field: 'token',
                            message: 'User no longer exists',
                        },
                    ],
                };
            const updatedHasPassword = await argon2_1.default.hash(changePasswordInput.newPassword);
            await User_1.User.update({
                id: userIdNum,
            }, { password: updatedHasPassword });
            await resetPasswordTokenRecord.deleteOne();
            req.session.userId = user.id;
            return {
                code: 200,
                success: true,
                message: 'User password reset successfully',
                user,
            };
        }
        catch (error) {
            console.log(error);
            return {
                code: 500,
                success: false,
                message: `Internal server error ${error.message}`,
            };
        }
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)((_return) => String),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User_1.User, Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "email", null);
__decorate([
    (0, type_graphql_1.Query)((_return) => User_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('registerInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterInput_1.RegisterInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse),
    __param(0, (0, type_graphql_1.Arg)('loginInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginInput_1.LoginInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => Boolean),
    __param(0, (0, type_graphql_1.Arg)('forgotPasswordInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordInput_1.ForgotPasswordInput]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse),
    __param(0, (0, type_graphql_1.Arg)('token')),
    __param(1, (0, type_graphql_1.Arg)('userId')),
    __param(2, (0, type_graphql_1.Arg)('changePasswordInput')),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ChangePasswordInput_1.ChangePasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
exports.UserResolver = UserResolver = __decorate([
    (0, type_graphql_1.Resolver)((_of) => User_1.User)
], UserResolver);
//# sourceMappingURL=user.js.map