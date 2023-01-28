import passwordValidator from "password-validator"

const schema = new passwordValidator();

schema
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces()

export const isStrongPassword = (password: string): boolean => {
    return schema.validate(password) as boolean;
}