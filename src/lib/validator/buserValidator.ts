import passwordValidator from "password-validator"
import validator from "validator"

const schema = new passwordValidator();

schema
    .is().min(8)
    .is().max(30)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces()

export const passwordIsValidate = (password: string): boolean | any[] => {
    return schema.validate(password)
}

export const usernameIsValidate = (username: string): boolean => {
    return validator.isLength(username, {
        min: 3,
        max: 20,
    })
}

export const isEmail = (email: string): boolean => {
    return validator.isEmail(email)
}