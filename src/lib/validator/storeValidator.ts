export const isZipCode = (zipCode: string): boolean => {
    //is Number and got 5 length
    return zipCode.length == 5 && !isNaN(+zipCode)
}